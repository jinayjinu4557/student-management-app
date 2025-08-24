import React, { useState } from 'react';
import StudentList from './StudentList';
import FeeStatus from './FeeStatus';
import Summary from './Summary';
import EnrollStudent from './EnrollStudent';
import ThemeToggle from './components/ThemeToggle';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataRefreshProvider } from './contexts/DataRefreshContext';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('summary');
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  const closeSidebar = () => {
    setSidebarOpen(false);
  };
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    closeSidebar(); // Close sidebar on mobile when tab is clicked
  };

  return (
    <ThemeProvider>
      <DataRefreshProvider>
        <div className="app-container">
          {/* Mobile Sidebar Overlay */}
          {sidebarOpen && (
            <div className="sidebar-overlay" onClick={closeSidebar}></div>
          )}
          {/* Mobile Sidebar */}
          <div className={`mobile-sidebar ${sidebarOpen ? 'open' : ''}`}>
            <div className="sidebar-header">
              <div className="sidebar-logo">
                <div className="logo-icon-small">🎓</div>
                <span className="logo-text-small">Deepika Classes</span>
              </div>
              <button className="sidebar-close" onClick={closeSidebar}>×</button>
            </div>
        
            <nav className="sidebar-nav">
              <button 
                className={`sidebar-tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => handleTabClick('summary')}
              >
                📊 Summary
              </button>
              <button 
                className={`sidebar-tab ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => handleTabClick('students')}
              >
                👥 Students
              </button>
              <button 
                className={`sidebar-tab ${activeTab === 'fees' ? 'active' : ''}`}
                onClick={() => handleTabClick('fees')}
              >
                💰 Fee Status
              </button>
            </nav>
            <div className="sidebar-actions">
              <button 
                className="sidebar-new-student-btn"
                onClick={() => {
                  setShowEnrollModal(true);
                  closeSidebar();
                }}
              >
                + New Student
              </button>
              <ThemeToggle />
        </div>
      </div>
      
          {/* Main Navigation Bar */}
      <nav className="main-nav">
            <div className="nav-left">
              <button className="mobile-menu-btn" onClick={toggleSidebar}>
                ☰
              </button>
        <div className="nav-logo">
                <div className="logo-icon-small">🎓</div>
                <span className="logo-text-small">Deepika Classes</span>
        </div>
            </div>
        
            <div className="nav-center desktop-only">
          <button 
                className={`nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
                onClick={() => setActiveTab('summary')}
          >
                📊 Summary
          </button>
          <button 
                className={`nav-tab ${activeTab === 'students' ? 'active' : ''}`}
                onClick={() => setActiveTab('students')}
          >
                👥 Students
          </button>
          <button 
                className={`nav-tab ${activeTab === 'fees' ? 'active' : ''}`}
                onClick={() => setActiveTab('fees')}
          >
                💰 Fee Status
          </button>
        </div>
        
        <div className="nav-actions">
          <button 
                className="new-student-btn desktop-only"
            onClick={() => setShowEnrollModal(true)} 
          >
                + New Student
          </button>
          <ThemeToggle />
        </div>
      </nav>

          {/* Main Content */}
          <main className="main-content">
            <div className="content-wrapper">
              {activeTab === 'summary' && <Summary />}
              {activeTab === 'students' && <StudentList />}
              {activeTab === 'fees' && <FeeStatus />}
            </div>
          </main>
      
      {/* Enroll Student Modal */}
      {showEnrollModal && (
        <div className="modal-overlay" onClick={() => setShowEnrollModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Enroll New Student</h2>
              <button className="modal-close" onClick={() => setShowEnrollModal(false)}>×</button>
            </div>
            <div className="modal-body">
                  <EnrollStudent 
                    onSuccess={() => setShowEnrollModal(false)}
                  />
            </div>
          </div>
        </div>
      )}
        </div>
      </DataRefreshProvider>
    </ThemeProvider>
  );
}

export default App;
