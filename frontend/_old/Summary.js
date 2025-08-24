import React, { useEffect, useState, useCallback } from 'react';
import api from './api';
import Loader from './components/Loader';
import './MobileResponsiveFix.css';
import './FeeStatus.css'; // Import the CSS for status badges
import { useDataRefresh } from './contexts/DataRefreshContext';

const Summary = () => {
  const [summary, setSummary] = useState({ totalEarnings: 0, totalPending: 0, studentStats: [] });
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading summary data...');
      const res = await api.get('/api/summary');
      const paymentsRes = await api.get('/api/fees');
      setPayments(paymentsRes.data);
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
  }, []);

  useEffect(() => {
    fetchSummary();
    
    // Set up an interval to refresh the summary data every 30 seconds
    const intervalId = setInterval(() => {
      fetchSummary();
    }, 30000);
    
    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [fetchSummary]);

  const { refreshFlag } = useDataRefresh();

  useEffect(() => {
    fetchSummary();
  }, [refreshFlag, fetchSummary]);

  // Functions were moved below

  const handleDelete = async (student) => {
    console.log('=== DELETE OPERATION DEBUG ===');
    console.log('Full student object:', JSON.stringify(student, null, 2));
    console.log('Student ID from object:', student.studentId);
    console.log('Student _id from object:', student._id);
    console.log('Student name:', student.name);
    console.log('Student status:', student.status);
    console.log('Student active flag:', student.active);
    
    // Try to get studentId from multiple possible fields
    const studentId = student.studentId || student.id || student._id;
    
    console.log('Final studentId to use:', studentId);
    console.log('StudentId type:', typeof studentId);
    
    if (!studentId) {
      console.error('❌ No valid studentId found in student object');
      console.error('Available keys in student object:', Object.keys(student));
      alert('Cannot delete student: No valid student ID found. Please check the console for details.');
      return;
    }
    
    // Convert to number if it's a string
    const numericStudentId = typeof studentId === 'string' ? parseInt(studentId, 10) : studentId;
    console.log('Numeric studentId:', numericStudentId);
    
    if (isNaN(numericStudentId)) {
      console.error('❌ StudentId is not a valid number:', studentId);
      alert('Cannot delete student: Invalid student ID format.');
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${student.name}?\n\nStudent ID: ${numericStudentId}`)) {
      try {
        setLoading(true);
        setLoadingMessage('Removing student...');
        
        const deleteUrl = `/api/students/${numericStudentId}`;
        console.log('🔄 Making DELETE request to:', deleteUrl);
        
        const response = await api.delete(deleteUrl);
        console.log('✅ Delete response:', response.data);
        console.log('✅ Delete status:', response.status);
        
        alert(`Student "${student.name}" has been successfully removed!`);
        
        // Refresh the summary data
        console.log('🔄 Refreshing summary data...');
        await fetchSummary();
        
        // Reset to first page if current page becomes empty
        const totalPages = Math.ceil((summary.studentStats.length - 1) / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          console.log('📄 Adjusting page from', currentPage, 'to', totalPages);
          setCurrentPage(totalPages);
        }
        
      } catch (error) {
        console.error('❌ DELETE ERROR DETAILS:');
        console.error('Error object:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Failed to delete student';
        
        if (error.response?.data?.error) {
          errorMessage = `Delete failed: ${error.response.data.error}`;
        } else if (error.response?.status === 404) {
          errorMessage = `Student not found (ID: ${numericStudentId}). The student may have already been deleted.`;
        } else if (error.response?.status === 400) {
          errorMessage = `Invalid student ID (${numericStudentId}). Please try refreshing the page.`;
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error occurred. Please try again or contact support.';
        } else if (!error.response) {
          errorMessage = 'Network error. Please check your connection and try again.';
        }
        
        alert(errorMessage);
        
        // Refresh data anyway in case the delete actually worked
        console.log('🔄 Refreshing data despite error...');
        await fetchSummary();
        
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
  
  // Pagination functions and other utility functions go here

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
                  <span className={`fee-type-badge ${stat.isClass10 || stat.feeType === 'yearly' ? 'yearly' : 'monthly'}`}>
                    {stat.isClass10 || stat.feeType === 'yearly' ? 'Yearly' : 'Monthly'}
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