import React, { useEffect, useState } from 'react';
import axios from 'axios';

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
    const studentsRes = await axios.get('/api/students');
    const paymentsRes = await axios.get('/api/fees?month=' + encodeURIComponent(selectedMonth));
    setStudents(studentsRes.data);
    setPayments(paymentsRes.data);
  };

  const handleStatusChange = async (studentId, status) => {
    const student = students.find(s => s._id === studentId);
    await axios.post('/api/fees', {
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
              <td>{student.name}</td>
              <td>{student.class}</td>
              <td>{student.monthlyFee}</td>
              <td>{getStatus(student._id)}</td>
              <td>{getBalance(student._id)}</td>
              <td>
                <button onClick={() => handleStatusChange(student._id, 'Paid')} style={{ background: 'green', color: '#fff', padding: '4px 8px', borderRadius: 4, border: 'none', marginRight: 8 }}>Mark Paid</button>
                <button onClick={() => handleStatusChange(student._id, 'Unpaid')} style={{ background: 'red', color: '#fff', padding: '4px 8px', borderRadius: 4, border: 'none' }}>Mark Unpaid</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {message && <div className="success">{message}</div>}
    </div>
  );
};

export default FeeStatus; 