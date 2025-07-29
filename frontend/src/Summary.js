import React, { useEffect, useState } from 'react';
import api from './api';
import Loader from './components/Loader';

const Summary = () => {
  const [summary, setSummary] = useState({ totalEarnings: 0, totalPending: 0, studentStats: [] });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading summary data...');
      const res = await api.get('/api/summary');
      console.log('Summary data received:', res.data);
      console.log('Student stats structure:', res.data.studentStats);
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDelete = async (student) => {
    console.log('Full student object:', student);
    console.log('Available keys:', Object.keys(student));
    
    // Try different possible ID fields from the student object
    const studentId = student.studentId || student._id || student.id;
    console.log('Using studentId:', studentId);
    
    if (!studentId) {
      console.error('No valid ID found in student data:', student);
      alert('Cannot delete student: Invalid student ID');
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${student.name}?`)) {
      try {
        setLoading(true);
        setLoadingMessage('Removing student...');
        console.log('Making DELETE request to:', `/api/students/${studentId}`);
        const response = await api.delete(`/api/students/${studentId}`);
        console.log('Delete response:', response);
        await fetchSummary();
        // Reset to first page if current page becomes empty
        const totalPages = Math.ceil((summary.studentStats.length - 1) / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } catch (error) {
        console.error('Error deleting student:', error);
        console.error('Error details:', error.response?.data);
        alert(`Failed to delete student: ${error.response?.data?.message || error.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(summary.studentStats.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentStudents = summary.studentStats.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  return (
    <div className="container">
      {loading && <Loader message={loadingMessage} />}
      <h2>Academic Year Summary (June 2025 – April 2026)</h2>
      <div style={{ marginBottom: 8 }}>Total Earnings: <span style={{ fontWeight: 'bold' }}>₹{summary.totalEarnings}</span></div>
      <div style={{ marginBottom: 16 }}>Total Pending: <span style={{ fontWeight: 'bold' }}>₹{summary.totalPending}</span></div>
      <div className="table-container">
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
            {currentStudents.map((stat, index) => (
              <tr key={stat.studentId || stat._id || index}>
                {/* <td>{stat.studentId}</td> */}
                <td data-label="Student">{stat.name}</td>
                <td data-label="Paid">₹{stat.paid}</td>
                <td data-label="Pending">₹{stat.pending}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleDelete(stat)} 
                      style={{ background: '#e53935', color: '#fff' }}>
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {summary.studentStats.length > rowsPerPage && (
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
        Showing {startIndex + 1}-{Math.min(endIndex, summary.studentStats.length)} of {summary.studentStats.length} students
      </div>
    </div>
  );
};

export default Summary; 