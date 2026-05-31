import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Upload, FileText, CheckCircle, AlertTriangle, Lightbulb, Zap, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const App = () => {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid PDF file.');
      setFile(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      setError('Please upload a resume first.');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    setError('');

    const formData = new FormData();
    formData.append('file', file);
    if (jobDescription) formData.append('job_description', jobDescription);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setAnalysis(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Something went wrong. Please check your backend connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Resume AI Analyzer
        </motion.h1>
        <motion.p 
          className="subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          Optimize your profile for the modern job market with Gemini AI.
        </motion.p>
      </header>

      <div className="glass-card">
        {/* File Upload Zone */}
        <div 
          className="upload-zone"
          onClick={() => fileInputRef.current.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
              setFile(droppedFile);
              setError('');
            }
          }}
        >
          <input 
            type="file" 
            hidden 
            ref={fileInputRef} 
            onChange={handleFileChange}
            accept=".pdf"
          />
          <Upload className="upload-icon" />
          <h3>{file ? 'Resume Selected' : 'Upload your Resume'}</h3>
          <p className="text-muted">Drag and drop or click to browse (PDF only)</p>
          {file && <div className="file-info">{file.name}</div>}
        </div>

        {/* Job Description Zone */}
        <div className="jd-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <FileText size={18} className="text-primary" />
            <h4 style={{ color: 'var(--text-muted)' }}>Job Description (Optional)</h4>
          </div>
          <textarea 
            placeholder="Paste the job description here for a tailored analysis..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </div>

        {error && <p style={{ color: '#ef4444', marginBottom: '1rem', textAlign: 'center' }}>{error}</p>}

        <button 
          className="analyze-btn" 
          onClick={handleAnalyze} 
          disabled={loading}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Loader2 className="loading-spinner" style={{ width: '20px', height: '20px', margin: 0 }} />
              Analyzing with AI...
            </div>
          ) : 'Start Analysis'}
        </button>
      </div>

      {/* Results Section */}
      <AnimatePresence>
        {analysis && (
          <motion.div 
            className="results-grid"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
          >
            <div className="glass-card score-card">
              <Zap className="upload-icon" style={{ color: 'var(--accent)' }} />
              <div className="ats-score">{analysis.ats_score}%</div>
              <div className="score-label">ATS Match Score</div>
              <p className="summary-text">{analysis.summary}</p>
            </div>

            <div className="glass-card" style={{ maxWidth: 'none' }}>
              <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <AlertTriangle className="text-primary" size={20} />
                  <h3>Skills Gaps</h3>
                </div>
                <ul className="skills-list">
                  {analysis.missing_skills.map((skill, index) => (
                    <motion.li 
                      key={index}
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {skill}
                    </motion.li>
                  ))}
                </ul>
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                  <Lightbulb size={20} style={{ color: 'var(--accent)' }} />
                  <h3>Improvement Suggestions</h3>
                </div>
                <ul className="suggestions-list">
                  {analysis.suggestions.map((suggestion, index) => (
                    <motion.li 
                      key={index}
                      initial={{ x: 10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 + 0.3 }}
                    >
                      {suggestion}
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer style={{ marginTop: '5rem', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        &copy; 2026 AI Resume Analyzer. Built for Excellence.
      </footer>
    </div>
  );
};

export default App;
