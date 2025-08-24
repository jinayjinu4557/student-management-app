import React, { useEffect, useState, useCallback } from 'react';
import api from './api';
import Loader from './components/Loader';
import { useDataRefresh } from './contexts/DataRefreshContext';
import './StudentList.css';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { refreshFlag } = useDataRefresh();

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      console.error('Error fetching students:', error);
      setMessage('Error loading students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (refreshFlag) {
      fetchStudents();
    }
  }, [refreshFlag, fetchStudents]);

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/api/students/${studentId}`);
      setMessage('Student deleted successfully!');
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      setMessage('Error deleting student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (student) => {
    // This will be handled by the parent component
    console.log('Edit student:', student);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parentNumber.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <Loader message="Loading students..." />;
  }

  return (
    <div className="container">
      <div className="page-header">
        <h2>Student Management</h2>
        <p>Manage all enrolled students and their information</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-filter">
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <div className="status-filter">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="status-select"
          >
            <option value="all">All Status</option>
            <option value="Active">Active</option>
            <option value="Left">Left</option>
          </select>
        </div>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th className="hide-mobile">Class</th>
              <th className="hide-mobile">Parent Number</th>
              <th className="hide-mobile">Monthly Fee</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => (
              <tr key={student._id}>
                <td data-label="Student ID">
                  <span className="student-id">#{student.studentId}</span>
                </td>
                <td data-label="Name">
                  <div className="student-name">
                    <strong>{student.name}</strong>
                    <div className="mobile-info hide-desktop">
                      <span className="mobile-class">{student.class}</span>
                      <span className="mobile-fee">₹{student.monthlyFee}</span>
                    </div>
                  </div>
                </td>
                <td data-label="Class" className="hide-mobile">{student.class}</td>
                <td data-label="Parent Number" className="hide-mobile">{student.parentNumber}</td>
                <td data-label="Monthly Fee" className="hide-mobile">₹{student.monthlyFee}</td>
                <td data-label="Status">
                  <span className={`status-badge ${student.status.toLowerCase()}`}>
                    {student.status}
                  </span>
                </td>
                <td data-label="Actions">
                  <div className="action-buttons">
                    <button 
                      onClick={() => handleEdit(student)}
                      className="edit-btn"
                      title="Edit Student"
                    >
                      ✏️
                    </button>
                    <button 
                      onClick={() => handleDelete(student.studentId)}
                      className="delete-btn"
                      title="Delete Student"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📚</div>
          <h3>No students found</h3>
          <p>
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filter criteria.' 
              : 'No students have been enrolled yet.'}
          </p>
        </div>
      )}

      <div className="stats-footer">
        <div className="stat-item">
          <span className="stat-label">Total Students:</span>
          <span className="stat-value">{students.length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Active:</span>
          <span className="stat-value">{students.filter(s => s.status === 'Active').length}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Left:</span>
          <span className="stat-value">{students.filter(s => s.status === 'Left').length}</span>
        </div>
      </div>
    </div>
  );
};

export default StudentList;