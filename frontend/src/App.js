import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import EnrollStudent from './EnrollStudent';
import FeeStatus from './FeeStatus';
import Summary from './Summary';
import StudentList from './StudentList';
import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <>
      <div className="hero">
        <img src="https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=1200&q=80" alt="Students" className="hero-img" />
        <div className="hero-text">
          <h1>Welcome to Deepika Tutions</h1>
          <p>Empower your students. Simplify your tuition management. Enjoy a modern, friendly experience!</p>
        </div>
      </div>
      <Router>
        <nav>
          <a className="nav-logo" href="/">
            <img src="https://cdn-icons-png.flaticon.com/512/3135/3135768.png" alt="Logo" style={{ background: '#fff', border: '2px solid #2196f3', padding: 2 }} />
            <span style={{ fontWeight: 700, fontSize: '1.25rem', letterSpacing: '1px' }}>Deepika Tutions</span>
          </a>
          <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Enroll Student</NavLink>
          <NavLink to="/fees" className={({ isActive }) => isActive ? 'active' : ''}>Fee Status</NavLink>
          <NavLink to="/summary" className={({ isActive }) => isActive ? 'active' : ''}>Summary</NavLink>
          <NavLink to="/students" className={({ isActive }) => isActive ? 'active' : ''}>Student List</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<EnrollStudent />} />
          <Route path="/fees" element={<FeeStatus />} />
          <Route path="/summary" element={<Summary />} />
          <Route path="/students" element={<StudentList />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
