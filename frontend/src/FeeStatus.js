import React, { useEffect, useState } from 'react';
import api from './api';
import Loader from './components/Loader';

const months = [
  'June 2025', 'July 2025', 'August 2025', 'September 2025', 'October 2025',
  'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026', 'April 2026'
];

const FeeStatus = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [selectedMonth]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading fee data...');
      const studentsRes = await api.get('/api/students');
      const paymentsRes = await api.get('/api/fees?month=' + encodeURIComponent(selectedMonth));
      setStudents(studentsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (studentId, status) => {
    try {
      setLoading(true);
      setLoadingMessage(`Marking as ${status.toLowerCase()}...`);
      const student = students.find(s => s._id === studentId);
      await api.post('/api/fees', {
        studentId,
        month: selectedMonth,
        status,
        amountPaid: status === 'Paid' ? student.monthlyFee : 0
      });
      setMessage('Status updated!');
      await fetchData();
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Error updating status!');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (studentId) => {
    const payment = payments.find(p => p.studentId === studentId);
    return payment ? payment.status : 'Unpaid';
  };

  const getBalance = (studentId) => {
    const payment = payments.find(p => p.studentId === studentId);
    return payment && payment.status === 'Paid' ? 0 : students.find(s => s._id === studentId)?.monthlyFee || 0;
  };

  // Calculate pagination
  const totalPages = Math.ceil(students.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentStudents = students.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Reset to first page when month changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth]);

  return (
    <div className="container">
      {loading && <Loader message={loadingMessage} />}
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
            {currentStudents.map(student => (
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
      
      {/* Pagination Controls */}
      {students.length > rowsPerPage && (
        <div className="pagination-controls">
          <button 
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}
      
      {/* Show total count */}
      <div className="pagination-summary">
        Showing {startIndex + 1}-{Math.min(endIndex, students.length)} of {students.length} students
      </div>
      
      {message && <div className="success">{message}</div>}
    </div>
  );
};

export default FeeStatus; 