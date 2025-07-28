import React, { useEffect, useState } from 'react';
import api from './api';

const Summary = () => {
  const [summary, setSummary] = useState({ totalEarnings: 0, totalPending: 0, studentStats: [] });

  const fetchSummary = () => {
    api.get('/api/summary').then(res => setSummary(res.data));
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDelete = async (studentId) => {
    console.log('Deleting studentId:', studentId);
    if (window.confirm('Are you sure you want to remove this student?')) {
      await api.delete(`/api/students/${studentId}`);
      fetchSummary();
    }
  };

  // Only show students with a valid numeric studentId
  const validStats = summary.studentStats.filter(stat => typeof stat.studentId === 'number' && !isNaN(stat.studentId));

  return (
    <div className="container">
      <h2>Academic Year Summary (June 2025 – April 2026)</h2>
      <div style={{ marginBottom: 8 }}>Total Earnings: <span style={{ fontWeight: 'bold' }}>₹{summary.totalEarnings}</span></div>
      <div style={{ marginBottom: 16 }}>Total Pending: <span style={{ fontWeight: 'bold' }}>₹{summary.totalPending}</span></div>
      <table>
        <thead>
          <tr>
            {/* <th>Student ID</th> */}
            <th>Student</th>
            <th>Paid</th>
            <th>Pending</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {summary.studentStats.map(stat => (
            <tr key={stat.studentId}>
              {/* <td>{stat.studentId}</td> */}
              <td>{stat.name}</td>
              <td>₹{stat.paid}</td>
              <td>₹{stat.pending}</td>
              <td>
                <button onClick={() => handleDelete(stat.studentId)} style={{ background: '#e53935', color: '#fff', borderRadius: 6, padding: '4px 12px', border: 'none' }}>Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Summary; 