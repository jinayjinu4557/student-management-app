import React, { useState } from 'react';
import api from './api';
import Loader from './components/Loader';

const months = [
  'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
  'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
];

const EnrollStudent = ({ editStudent, onSave, onSuccess }) => {
  const [form, setForm] = useState(editStudent || { 
    name: '', 
    parentNumber: '', 
    class: '', 
    monthlyFee: '', 
    enrollmentMonth: 'June 2025',
    status: 'Active'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (editStudent && editStudent._id) {
        await api.put(`/api/students/${editStudent._id}`, { ...form, monthlyFee: Number(form.monthlyFee) });
        setMessage('Student updated successfully!');
        if (onSave) onSave();
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500); // Close modal after showing success message
        }
      } else {
        await api.post('/api/students', { ...form, monthlyFee: Number(form.monthlyFee) });
        setMessage('Student enrolled successfully!');
        setForm({ name: '', parentNumber: '', class: '', monthlyFee: '' });
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500); // Close modal after showing success message
        }
      }
    } catch (err) {
      setMessage('Error enrolling/updating student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container enroll-container">
      {loading && <Loader message={editStudent ? "Updating student..." : "Enrolling student..."} />}
      <h2>{editStudent ? 'Edit Student' : 'Enroll Student'}</h2>
      <form onSubmit={handleSubmit} className="enroll-form">
        {editStudent && editStudent._id && (
          <div className="form-group full-width">
            <label htmlFor="studentId">Student ID</label>
            <input 
              id="studentId"
              value={editStudent._id} 
              readOnly 
              style={{ background: '#f9f9f9', color: '#777' }} 
              placeholder="Student ID" 
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="name">Student Name</label>
          <input 
            id="name" 
            name="name" 
            type="text"
            value={form.name} 
            onChange={handleChange} 
            placeholder="Enter student name" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="class">Class/Grade</label>
          <input 
            id="class" 
            name="class" 
            type="text"
            value={form.class} 
            onChange={handleChange} 
            placeholder="Enter class/grade" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="parentNumber">Parent Contact</label>
          <input 
            id="parentNumber" 
            name="parentNumber" 
            type="tel"
            value={form.parentNumber} 
            onChange={handleChange} 
            placeholder="Enter phone number" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="monthlyFee">Monthly Fee (₹)</label>
          <input 
            id="monthlyFee" 
            name="monthlyFee" 
            value={form.monthlyFee} 
            onChange={handleChange} 
            placeholder="Enter amount" 
            type="number" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="enrollmentMonth">Enrollment Month</label>
          <select 
            id="enrollmentMonth" 
            name="enrollmentMonth" 
            value={form.enrollmentMonth} 
            onChange={handleChange}
            required
          >
            {months.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="status">Student Status</label>
          <select 
            id="status" 
            name="status" 
            value={form.status} 
            onChange={handleChange}
            required
          >
            <option value="Active">Active</option>
            <option value="Left">Left</option>
            <option value="Void">Void</option>
            <option value="Abandon">Abandon</option>
          </select>
        </div>
        
        <div className="button-group">
          <button type="submit" className="primary-button">
            {editStudent ? 'Save Changes' : 'Enroll Student'}
          </button>
        </div>
      </form>
      {message && <div className="success">{message}</div>}
    </div>
  );
};

export default EnrollStudent; 