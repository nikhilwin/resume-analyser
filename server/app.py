import os
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pypdf
import google.generativeai as genai
from typing import Optional
import json
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure Gemini
# In a real app, use environment variables
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

def extract_text_from_pdf(file_path):
    text = ""
    try:
        reader = pypdf.PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() + "\n"
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text

@app.post("/analyze")
async def analyze_resume(
    file: UploadFile = File(...),
    job_description: Optional[str] = Form(None)
):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key not configured on server.")

    # Save temp file
    temp_path = f"temp_{file.filename}"
    with open(temp_path, "wb") as buffer:
        buffer.write(await file.read())

    try:
        resume_text = extract_text_from_pdf(temp_path)
        os.remove(temp_path)

        if not resume_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from PDF.")

        # Prepare Prompt
        prompt = f"""
        You are an expert ATS (Applicant Tracking System) and Career Coach. 
        Analyze the following resume text.
        
        {f"Compare it against this Job Description: {job_description}" if job_description else "Provide a general analysis based on industry standards for the roles mentioned in the resume."}
        
        Resume Content:
        {resume_text}
        
        Return the analysis ONLY as a JSON object with the following structure:
        {{
            "ats_score": (integer between 0-100),
            "missing_skills": ["list", "of", "missing", "or", "weak", "skills"],
            "suggestions": ["list", "of", "actionable", "suggestions", "to", "improve"],
            "summary": "Short 2-3 sentence overview of the profile."
        }}
        """

        model = genai.GenerativeModel("gemini-flash-latest")
        response = model.generate_content(prompt)
        
        # Clean response if it contains markdown code blocks
        resp_text = response.text.strip()
        if "```json" in resp_text:
            resp_text = resp_text.split("```json")[1].split("```")[0].strip()
        elif "```" in resp_text:
            resp_text = resp_text.split("```")[1].split("```")[0].strip()

        analysis = json.loads(resp_text)
        return analysis

    except Exception as e:
        if os.path.exists(temp_path):
            os.remove(temp_path)
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
