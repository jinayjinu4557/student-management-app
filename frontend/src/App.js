import React, { useState } from 'react';
import EnrollStudent from './EnrollStudent';
import FeeStatus from './FeeStatus';
import Summary from './Summary';
import StudentList from './StudentList';
import { ThemeProvider } from './contexts/ThemeContext';
import ThemeToggle from './components/ThemeToggle';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('enroll');

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'enroll':
        return <EnrollStudent />;
      case 'fees':
        return <FeeStatus />;
      case 'summary':
        return <Summary />;
      case 'students':
        return <StudentList />;
      default:
        return <EnrollStudent />;
    }
  };

  return (
    <ThemeProvider>
      <div className="hero">
        <img src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80" alt="Students" className="hero-img" />
        <div className="hero-text">
          <h1>Welcome to Deepika Tutions</h1>
          <p>Empower your students. Simplify your tuition management. Enjoy a modern, friendly experience!</p>
        </div>
      </div>
      <nav>
        <div className="nav-logo">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="Logo" style={{ background: '#fff', border: '2px solid #2196f3', padding: 2 }} />
          <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '1px' }}>Deepika Tutions</span>
        </div>
        <button 
          onClick={() => setActiveTab('enroll')} 
          className={activeTab === 'enroll' ? 'active' : ''}
        >
          Enroll Student
        </button>
        <button 
          onClick={() => setActiveTab('fees')} 
          className={activeTab === 'fees' ? 'active' : ''}
        >
          Fee Status
        </button>
        <button 
          onClick={() => setActiveTab('summary')} 
          className={activeTab === 'summary' ? 'active' : ''}
        >
          Summary
        </button>
        <button 
          onClick={() => setActiveTab('students')} 
          className={activeTab === 'students' ? 'active' : ''}
        >
          Student List
        </button>
        <ThemeToggle />
      </nav>
      {renderActiveComponent()}
    </ThemeProvider>
  );
}

export default App;
