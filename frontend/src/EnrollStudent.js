import React, { useState } from 'react';
import axios from 'axios';

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
        await axios.put(`/api/students/${editStudent._id}`, { ...form, monthlyFee: Number(form.monthlyFee) });
        setMessage('Student updated successfully!');
        if (onSave) onSave();
      } else {
        await axios.post('/api/students', { ...form, monthlyFee: Number(form.monthlyFee) });
        setMessage('Student enrolled successfully!');
        setForm({ name: '', parentNumber: '', class: '', monthlyFee: '' });
      }
    } catch (err) {
      setMessage('Error enrolling/updating student.');
    }
  };

  return (
    <div className="container">
      <h2>{editStudent ? 'Edit Student' : 'Enroll Student'}</h2>
      <form onSubmit={handleSubmit}>
        {editStudent && editStudent._id && (
          <input value={editStudent._id} readOnly style={{ background: '#f0f0f0', color: '#888', marginBottom: 8 }} placeholder="Student ID" />
        )}
        <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
        <input name="parentNumber" value={form.parentNumber} onChange={handleChange} placeholder="Parent Contact Number" required />
        <input name="class" value={form.class} onChange={handleChange} placeholder="Class" required />
        <input name="monthlyFee" value={form.monthlyFee} onChange={handleChange} placeholder="Monthly Fee" type="number" required />
        <button type="submit">{editStudent ? 'Save Changes' : 'Enroll Student'}</button>
      </form>
      {message && <div className="success">{message}</div>}
    </div>
  );
};

export default EnrollStudent; 