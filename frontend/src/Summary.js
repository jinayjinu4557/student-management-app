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
    console.log('=== DELETE OPERATION DEBUG ===');
    console.log('Full student object received:', JSON.stringify(student, null, 2));
    console.log('Object keys:', Object.keys(student));
    console.log('Student name:', student.name);
    
    // More comprehensive ID extraction logic
    let studentId = null;
    
    // Try all possible ID field variations
    if (student.studentId) {
      studentId = student.studentId;
      console.log('Found studentId field:', studentId);
    } else if (student._id) {
      studentId = student._id;
      console.log('Found _id field:', studentId);
    } else if (student.id) {
      studentId = student.id;
      console.log('Found id field:', studentId);
    } else {
      // If no direct ID, try to find it in nested objects or other patterns
      console.log('No direct ID found, checking for alternative patterns...');
      
      // Check if there's a student object nested inside
      if (student.student && (student.student._id || student.student.id)) {
        studentId = student.student._id || student.student.id;
        console.log('Found nested student ID:', studentId);
      }
    }
    
    console.log('Final studentId to use:', studentId);
    console.log('StudentId type:', typeof studentId);
    
    if (!studentId) {
      console.error('=== NO VALID ID FOUND ===');
      console.error('Student object structure:', student);
      alert(`Cannot delete student: No valid ID found.\n\nDebug info:\nAvailable keys: ${Object.keys(student).join(', ')}\nStudent object: ${JSON.stringify(student, null, 2)}`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to remove ${student.name}?\n\nStudent ID: ${studentId}`)) {
      try {
        setLoading(true);
        setLoadingMessage('Removing student...');
        
        console.log('=== MAKING DELETE REQUEST ===');
        console.log('DELETE URL:', `/api/students/${studentId}`);
        console.log('Student ID being sent:', studentId);
        
        // First, let's try to get the student details to verify the ID exists
        try {
          const checkResponse = await api.get(`/api/students/${studentId}`);
          console.log('Student exists, proceeding with delete:', checkResponse.data);
        } catch (checkError) {
          console.error('Student verification failed:', checkError.response?.data);
          if (checkError.response?.status === 404) {
            alert('Student not found. The student may have already been deleted.');
            await fetchSummary(); // Refresh the data
            return;
          }
        }
        
        // Proceed with delete
        const response = await api.delete(`/api/students/${studentId}`);
        console.log('=== DELETE SUCCESS ===');
        console.log('Delete response:', response.data);
        
        alert('Student deleted successfully!');
        await fetchSummary();
        
        // Reset to first page if current page becomes empty
        const totalPages = Math.ceil((summary.studentStats.length - 1) / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
        
      } catch (error) {
        console.error('=== DELETE ERROR ===');
        console.error('Error object:', error);
        console.error('Error response:', error.response);
        console.error('Error status:', error.response?.status);
        console.error('Error data:', error.response?.data);
        console.error('Error message:', error.message);
        
        let errorMessage = 'Unknown error occurred';
        
        if (error.response) {
          // Server responded with error status
          const status = error.response.status;
          const data = error.response.data;
          
          switch (status) {
            case 400:
              errorMessage = `Bad Request: ${data?.message || 'Invalid student ID format'}`;
              break;
            case 404:
              errorMessage = 'Student not found. May have already been deleted.';
              break;
            case 500:
              errorMessage = 'Server error. Please try again later.';
              break;
            default:
              errorMessage = `Error ${status}: ${data?.message || error.message}`;
          }
        } else if (error.request) {
          // Network error
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = error.message;
        }
        
        alert(`Failed to delete student: ${errorMessage}\n\nDebug info:\nStudent ID used: ${studentId}\nURL: /api/students/${studentId}`);
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