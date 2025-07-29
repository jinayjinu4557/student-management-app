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
      console.log('Summary API Response:', res.data);
      console.log('Student stats array:', res.data.studentStats);
      
      // Debug each student object structure
      if (res.data.studentStats && res.data.studentStats.length > 0) {
        console.log('First student object structure:', res.data.studentStats[0]);
        console.log('Available keys in first student:', Object.keys(res.data.studentStats[0]));
      }
      
      setSummary(res.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      alert('Failed to load summary data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const handleDelete = async (student) => {
    console.log('=== DELETE OPERATION ===');
    console.log('Student object:', student);
    console.log('Student ID:', student.studentId);
    console.log('Student name:', student.name);
    
    // Backend now provides the correct numeric studentId
    const studentId = student.studentId;
    
    if (!studentId) {
      console.error('No studentId found in student object:', student);
      alert('Cannot delete student: No valid student ID found.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${student.name}?`)) {
      try {
        setLoading(true);
        setLoadingMessage('Removing student...');
        
        console.log('Making DELETE request to:', `/api/students/${studentId}`);
        const response = await api.delete(`/api/students/${studentId}`);
        console.log('Delete successful:', response.data);
        
        alert('Student deleted successfully!');
        await fetchSummary();
        
        // Reset to first page if current page becomes empty
        const totalPages = Math.ceil((summary.studentStats.length - 1) / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
        
      } catch (error) {
        console.error('Delete error:', error);
        
        let errorMessage = 'Failed to delete student';
        if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.response?.status === 404) {
          errorMessage = 'Student not found';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid student ID';
        }
        
        alert(errorMessage);
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
              <th>Student Name</th>
              <th>Class</th>
              <th>Status</th>
              <th>Enrollment Month</th>
              <th>Fee Type</th>
              <th>Applicable Months</th>
              <th>Amount Paid</th>
              <th>Amount Pending</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentStudents.map((stat, index) => (
              <tr key={stat.studentId || stat._id || index}>
                <td data-label="Student Name">{stat.name}</td>
                <td data-label="Class">{stat.class}</td>
                <td data-label="Status">
                  <span className={`status-badge ${stat.status?.toLowerCase()}`}>
                    {stat.status || 'Active'}
                  </span>
                </td>
                <td data-label="Enrollment Month">
                  <span className="enrollment-month">
                    {stat.enrollmentMonth || 'June 2025'}
                  </span>
                </td>
                <td data-label="Fee Type">
                  <span className={`fee-type-badge ${stat.isClass10 ? 'part-payment' : 'monthly'}`}>
                    {stat.isClass10 ? 'Part Payment' : 'Monthly'}
                  </span>
                </td>
                <td data-label="Applicable Months">
                  <span className="applicable-months">
                    {stat.applicableMonths} months
                    {stat.applicableMonths < 11 && stat.status === 'Active' && (
                      <span className="prorated-indicator"> (Prorated)</span>
                    )}
                    {stat.status === 'Left' && (
                      <span className="left-indicator"> (Until Left)</span>
                    )}
                  </span>
                </td>
                <td data-label="Amount Paid">₹{stat.paid}</td>
                <td data-label="Amount Pending">₹{stat.pending}</td>
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