import React, { useState } from 'react';
import api from './api';

const EnrollStudent = ({ editStudent, onSave }) => {
  const [form, setForm] = useState(editStudent || { name: '', parentNumber: '', class: '', monthlyFee: '' });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editStudent && editStudent._id) {
        await api.put(`/api/students/${editStudent._id}`, { ...form, monthlyFee: Number(form.monthlyFee) });
        setMessage('Student updated successfully!');
        if (onSave) onSave();
      } else {
        await api.post('/api/students', { ...form, monthlyFee: Number(form.monthlyFee) });
        setMessage('Student enrolled successfully!');
        setForm({ name: '', parentNumber: '', class: '', monthlyFee: '' });
      }
    } catch (err) {
      setMessage('Error enrolling/updating student.');
    }
  };

  return (
    <div className="container enroll-container">
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