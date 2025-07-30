import React, { useEffect, useState, useCallback } from 'react';
import api from './api';
import Loader from './components/Loader';
import { useDataRefresh } from './contexts/DataRefreshContext';
import EnrollStudent from './EnrollStudent';
import './FeeStatus.css'; // Import the CSS for status badges

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('');
  
  // We don't need the getFeeStatus function anymore since we removed the Fee Status column
  // We don't need these states anymore since we're using the modal approach
  // const [editId, setEditId] = useState(null);
  // const [editForm, setEditForm] = useState({ name: '', class: '', parentNumber: '', monthlyFee: '' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showEditModal, setShowEditModal] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState(null);
  const rowsPerPage = 10;

  const { refreshFlag } = useDataRefresh();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading students...');
      const studentsRes = await api.get('/api/students');
      setStudents(studentsRes.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [refreshFlag, fetchStudents]);

  const handleDelete = async (student) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      try {
        setLoading(true);
        setLoadingMessage('Removing student...');
        // Always use studentId for API calls to the backend
        await api.delete(`/api/students/${student.studentId}`);
        await fetchStudents();
        // Reset to first page if current page becomes empty
        // Consistently use studentId for filtering
        const remainingStudents = students.filter(s => s.studentId !== student.studentId);
        const totalPages = Math.ceil(remainingStudents.length / rowsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      } catch (error) {
        console.error('Error deleting student:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = async (student) => {
    try {
      setLoading(true);
      setLoadingMessage('Loading student details...');
      
      // We already have the student data, so we can use it directly
      // This ensures we have all the necessary fields for editing
      setStudentToEdit(student);
      setShowEditModal(true);
    } catch (error) {
      console.error('Error preparing student for edit:', error);
    } finally {
      setLoading(false);
    }
  };

  // These functions are no longer needed as we're using EnrollStudent component for editing
  // They have been completely removed to avoid any reference errors

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.class.toLowerCase().includes(filter.toLowerCase()) ||
    s.parentNumber.includes(filter)
  );

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentStudents = filtered.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  // Reset to first page when filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  // Handle closing the edit modal and refreshing data
  const handleEditSuccess = () => {
    setShowEditModal(false);
    fetchStudents();
  };

  return (
    <div className="container">
      {loading && <Loader message={loadingMessage} />}
      <h2>Student List</h2>
      <input
        type="text"
        placeholder="Filter by name, class, or parent number"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: 16, width: '100%', padding: 8, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
      />
      
      {/* Edit Student Modal */}
      {showEditModal && studentToEdit && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Student</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <EnrollStudent 
                editStudent={studentToEdit} 
                onSuccess={handleEditSuccess} 
                onSave={() => {
                  // This will be called when the form is submitted but before the modal is closed
                  // We can use this to refresh the student list
                  fetchStudents();
                }}
              />
            </div>
          </div>
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Class</th>
            <th>Fee Type</th>
            <th>Parent Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentStudents.map(student => {
            const isYearly = student.feeType === 'yearly';
            // We don't need feeStatus anymore since we removed the Fee Status column
            
            return (
              <tr key={student.studentId}>
                <td data-label="Name">{student.name}</td>
                <td data-label="Class">{student.class}</td>
                <td data-label="Fee Type">
                  {isYearly ? (
                    <span className="fee-type-badge yearly">
                      Yearly: ₹{student.yearlyFee}
                    </span>
                  ) : (
                    <span className="fee-type-badge monthly">
                      Monthly: ₹{student.monthlyFee}
                    </span>
                  )}
                </td>
                <td data-label="Parent Contact">{student.parentNumber}</td>
                <td>
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEdit(student)} 
                      style={{ background: 'var(--primary)', color: '#fff' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(student)} 
                      style={{ background: 'var(--error)', color: '#fff' }}
                    >
                      Remove
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {/* Pagination Controls */}
      {filtered.length > rowsPerPage && (
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
        Showing {startIndex + 1}-{Math.min(endIndex, filtered.length)} of {filtered.length} students
        {filter && ` (filtered from ${students.length} total)`}
      </div>
    </div>
  );
};

export default StudentList;