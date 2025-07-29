import React, { useState } from 'react';
import EnrollStudent from './EnrollStudent';
import FeeStatus from './FeeStatus';
import Summary from './Summary';
import StudentList from './StudentList';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('students'); // Start with Student List
  const [showEnrollModal, setShowEnrollModal] = useState(false);

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'students':
        return <StudentList />;
      case 'fees':
        return <FeeStatus />;
      case 'summary':
        return <Summary />;
      default:
        return <StudentList />;
    }
  };

  return (
    <ThemeProvider>
      <div className="hero">
        <img src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80" alt="Students" className="hero-img" />
        
        {/* Modern Navigation Overlay */}
        <nav className="modern-nav">
          <div className="nav-brand">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="Logo" className="nav-logo-img" />
            <span className="nav-brand-text">Deepika Tutions</span>
          </div>
          
          <div className="nav-tabs">
            <button 
              onClick={() => setActiveTab('students')} 
              className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
            >
              Student List
            </button>
            <button 
              onClick={() => setActiveTab('fees')} 
              className={`nav-tab ${activeTab === 'fees' ? 'active' : ''}`}
            >
              Fee Status
            </button>
            <button 
              onClick={() => setActiveTab('summary')} 
              className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
            >
              Summary
            </button>
          </div>
          
        </nav>
        
        {/* Separate Action Buttons */}
        <div className="floating-actions">
          <button 
            onClick={() => setShowEnrollModal(true)} 
            className="floating-enroll-btn"
          >
            <span className="enroll-icon">+</span>
            New Student
          </button>
          <div className="floating-theme-toggle">
            <ThemeToggle />
          </div>
        </div>
        
        <div className="hero-content">
          <h1>Welcome to Deepika Tutions</h1>
          <p>Empower your students. Simplify your tuition management. Enjoy a modern, friendly experience!</p>
        </div>
      </div>
      
      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enroll New Student</h2>
              <button className="modal-close" onClick={() => setShowEnrollModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <EnrollStudent onSuccess={() => setShowEnrollModal(false)} />
            </div>
          </div>
        </div>
      )}
      
      {renderActiveComponent()}
    </ThemeProvider>
  );
}

export default App;
