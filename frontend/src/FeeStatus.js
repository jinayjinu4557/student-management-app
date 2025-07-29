import React, { useEffect, useState } from 'react';
import api from './api';

const months = [
  'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
  'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
];

const FeeStatus = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    const studentsRes = await api.get('/api/students');
    const paymentsRes = await api.get('/api/fees?month=' + encodeURIComponent(selectedMonth));
    setStudents(studentsRes.data);
    setPayments(paymentsRes.data);
  };

  const handleStatusChange = async (studentId, status) => {
    const student = students.find(s => s._id === studentId);
    await api.post('/api/fees', {
      studentId,
      month: selectedMonth,
      status,
      amountPaid: status === 'Paid' ? student.monthlyFee : 0
    });
    setMessage('Status updated!');
    fetchData();
  };

  const getStatus = (studentId) => {
    const payment = payments.find(p => p.studentId === studentId);
    return payment ? payment.status : 'Unpaid';
  };

  const getBalance = (studentId) => {
    const payment = payments.find(p => p.studentId === studentId);
    return payment && payment.status === 'Paid' ? 0 : students.find(s => s._id === studentId)?.monthlyFee || 0;
  };

  return (
    <div className="container">
      <h2>Monthly Fee Tracker</h2>
      <div style={{ marginBottom: 16 }}>
        <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
          {months.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              <th>Fee</th>
              <th>Status</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map(student => (
              <tr key={student._id}>
                <td data-label="Name">{student.name}</td>
                <td data-label="Class">{student.class}</td>
                <td data-label="Fee">{student.monthlyFee}</td>
                <td data-label="Status">{getStatus(student._id)}</td>
                <td data-label="Balance">{getBalance(student._id)}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleStatusChange(student._id, 'Paid')} 
                      style={{ background: 'green', color: '#fff' }}>
                      Mark Paid
                    </button>
                    <button 
                      onClick={() => handleStatusChange(student._id, 'Unpaid')} 
                      style={{ background: 'red', color: '#fff' }}>
                      Mark Unpaid
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <div className="success">{message}</div>}
    </div>
  );
};

export default FeeStatus; 