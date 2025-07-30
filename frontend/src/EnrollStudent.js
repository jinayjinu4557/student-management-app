import React, { useState, useEffect } from 'react';
import api from './api';
import Loader from './components/Loader';
import { useDataRefresh } from './contexts/DataRefreshContext';
import './EnrollStudent.css';

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
    yearlyFee: '',
    feeType: 'monthly',
    installments: 1,
    endMonth: 'April 2026',
    enrollmentMonth: 'June 2025',
    status: 'Active'
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showYearlyFee, setShowYearlyFee] = useState(false);
  const { triggerRefresh } = useDataRefresh();
  
  // Check if class is 10th and update fee type accordingly
  useEffect(() => {
    // More comprehensive check for 10th class
    const classValue = form.class.toString().toLowerCase();
    if (
      classValue === '10' || 
      classValue === '10th' || 
      classValue.includes('10th') || 
      classValue.includes('10 ') || 
      classValue === 'x' || 
      classValue === 'class x' || 
      classValue === 'class 10'
    ) {
      setShowYearlyFee(true);
      setForm(prev => ({
        ...prev,
        feeType: 'yearly',
        installments: 3
      }));
    } else {
      setShowYearlyFee(false);
      setForm(prev => ({
        ...prev,
        feeType: 'monthly',
        installments: 1
      }));
    }
  }, [form.class]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Prepare data based on fee type
      const formData = {
        ...form,
        monthlyFee: form.feeType === 'monthly' ? Number(form.monthlyFee) : 0,
        yearlyFee: form.feeType === 'yearly' ? Number(form.yearlyFee) : 0
      };
      
      // Always use studentId for API calls to the backend
      if (editStudent && editStudent.studentId) {
        await api.put(`/api/students/${editStudent.studentId}`, formData);
        setMessage('Student updated successfully!');
        if (onSave) onSave();
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500); // Close modal after showing success message
        }
      } else {
        await api.post('/api/students', formData);
        setMessage('Student enrolled successfully!');
        setForm({ 
          name: '', 
          parentNumber: '', 
          class: '', 
          monthlyFee: '',
          yearlyFee: '',
          feeType: 'monthly',
          installments: 1,
          endMonth: 'April 2026',
          enrollmentMonth: 'June 2025',
          status: 'Active'
        });
        triggerRefresh(); // Trigger refresh for other components
        if (onSuccess) {
          setTimeout(() => onSuccess(), 1500); // Close modal after showing success message
        }
      }
    } catch (err) {
      console.error('Error:', err);
      setMessage('Error enrolling/updating student.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="enroll-wrapper">
      {loading && <Loader message={editStudent ? "Updating student..." : "Enrolling student..."} />}
      
      <h2 className="enroll-title">{editStudent ? 'Edit Student' : 'Enroll Student'}</h2>
      
      {message && <div className="enroll-message">{message}</div>}
      
      <form onSubmit={handleSubmit} className="enroll-form">
        {editStudent && editStudent.studentId && (
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentId">Student ID</label>
              <input 
                id="studentId"
                value={editStudent.studentId} 
                readOnly 
                className="readonly-input"
                placeholder="Student ID" 
              />
            </div>
          </div>
        )}
        
        <div className="form-row">
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
            {showYearlyFee && <small className="form-hint">Yearly fee structure will be applied for 10th class</small>}
          </div>
        </div>
        
        <div className="form-row">
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
          
          {!showYearlyFee ? (
            <div className="form-group">
              <label htmlFor="monthlyFee">Monthly Fee (₹)</label>
              <input 
                id="monthlyFee" 
                name="monthlyFee" 
                value={form.monthlyFee} 
                onChange={handleChange} 
                placeholder="Enter amount" 
                type="number" 
                required={form.feeType === 'monthly'}
              />
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="yearlyFee">Yearly Fee (₹)</label>
              <input 
                id="yearlyFee" 
                name="yearlyFee" 
                value={form.yearlyFee} 
                onChange={handleChange} 
                placeholder="Enter amount" 
                type="number" 
                required={form.feeType === 'yearly'}
              />
            </div>
          )}
        </div>
        
        <div className="form-row">
          {showYearlyFee && (
            <div className="form-group">
              <label htmlFor="installments">Number of Installments</label>
              <select
                id="installments"
                name="installments"
                value={form.installments}
                onChange={handleChange}
                required
              >
                <option value="1">1 (Full payment)</option>
                <option value="2">2 Installments</option>
                <option value="3">3 Installments</option>
              </select>
            </div>
          )}
          
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
            <label htmlFor="endMonth">End Month</label>
            <select 
              id="endMonth" 
              name="endMonth" 
              value={form.endMonth} 
              onChange={handleChange}
              required
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="form-row">
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
        </div>
        
        <div className="form-actions">
          <button type="submit" className="primary-button">
            {editStudent ? 'Save Changes' : 'Enroll Student'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EnrollStudent;
