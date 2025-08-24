import React, { useEffect, useState, useCallback } from 'react';
import api from './api';
import Loader from './components/Loader';
import { useDataRefresh } from './contexts/DataRefreshContext';
import './Summary.css';

const Summary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const { refreshFlag } = useDataRefresh();

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      const [summaryRes, studentsRes, paymentsRes] = await Promise.all([
        api.get('/api/summary'),
        api.get('/api/students'),
        api.get('/api/fees')
      ]);
      
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching summary:', error);
      setMessage('Error loading summary data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (refreshFlag) {
      fetchSummary();
    }
  }, [refreshFlag, fetchSummary]);

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student?')) {
      return;
    }

    try {
      setLoading(true);
      await api.delete(`/api/students/${studentId}`);
      setMessage('Student removed successfully!');
      fetchSummary();
    } catch (error) {
      console.error('Error deleting student:', error);
      setMessage('Error removing student. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loader message="Loading summary data..." />;
  }

  if (!summary) {
    return (
      <div className="container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Unable to load summary</h3>
          <p>Please check your connection and try again.</p>
        </div>
      </div>
    );
  }

  // Calculate additional statistics
  const totalStudents = summary.studentStats?.length || 0;
  const activeStudents = summary.studentStats?.filter(s => s.status === 'Active').length || 0;
  const leftStudents = summary.studentStats?.filter(s => s.status === 'Left').length || 0;
  const totalRevenue = summary.totalRevenue || 0;
  const totalPending = summary.totalPending || 0;
  const collectionRate = totalRevenue > 0 ? ((totalRevenue - totalPending) / totalRevenue * 100).toFixed(1) : 0;

  return (
    <div className="container">
      <div className="page-header">
        <h2>Financial Summary</h2>
        <p>Overview of student fees, payments, and financial status</p>
      </div>

      {message && (
        <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
          {message}
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">👥</div>
          <div className="metric-content">
            <h3>Total Students</h3>
            <div className="metric-value">{totalStudents}</div>
            <div className="metric-label">Enrolled students</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">💰</div>
          <div className="metric-content">
            <h3>Total Revenue</h3>
            <div className="metric-value">₹{totalRevenue.toLocaleString()}</div>
            <div className="metric-label">Total collected</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Pending Amount</h3>
            <div className="metric-value">₹{totalPending.toLocaleString()}</div>
            <div className="metric-label">Outstanding fees</div>
          </div>
        </div>
        
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Active Students</h3>
            <div className="metric-value">{activeStudents}</div>
            <div className="metric-label">Currently enrolled</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📈</div>
          <div className="metric-content">
            <h3>Collection Rate</h3>
            <div className="metric-value">{collectionRate}%</div>
            <div className="metric-label">Success rate</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🚪</div>
          <div className="metric-content">
            <h3>Left Students</h3>
            <div className="metric-value">{leftStudents}</div>
            <div className="metric-label">Discontinued</div>
          </div>
        </div>
      </div>

      {/* Student Statistics Table */}
      <div className="table-section">
        <div className="section-header">
          <h3>Student Details</h3>
          <p>Comprehensive view of all students and their fee status</p>
        </div>
        
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th className="hide-mobile">Class</th>
                <th className="hide-mobile">Status</th>
                <th className="hide-mobile">Enrollment Month</th>
                <th>Fee Type</th>
                <th className="hide-mobile">Amount Paid</th>
                <th className="hide-mobile">Amount Pending</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {summary.studentStats?.map(student => {
                const studentPayments = summary.payments?.filter(p => 
                  p.studentId.toString() === student._id.toString()
                ) || [];
                
                const totalPaid = studentPayments.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
                const totalPending = (student.pending || 0) - totalPaid;
                
                // Calculate applicable months display
                let applicableMonthsDisplay = '';
                if (student.class === '10' || student.class === 'Class 10') {
                  // For Class 10, show enrollment to end month
                  const enrollmentMonth = student.enrollmentMonth || 'June 2025';
                  const endMonth = student.endMonth || 'March 2026';
                  applicableMonthsDisplay = `${enrollmentMonth} - ${endMonth}`;
                } else {
                  // For other classes, show X months
                  const months = student.applicableMonths || 0;
                  applicableMonthsDisplay = `${months} months`;
                }

                return (
                  <tr key={student._id}>
                    <td data-label="Student Name">
                      <div className="student-info">
                        <strong>{student.name}</strong>
                        <div className="mobile-info hide-desktop">
                          <span className="mobile-class">{student.class}</span>
                          <span className="mobile-status">{student.status}</span>
                        </div>
                      </div>
                    </td>
                    <td data-label="Class" className="hide-mobile">{student.class}</td>
                    <td data-label="Status" className="hide-mobile">
                      <span className={`status-badge ${student.status.toLowerCase()}`}>
                        {student.status}
                      </span>
                    </td>
                    <td data-label="Enrollment Month" className="hide-mobile">
                      {student.enrollmentMonth || 'N/A'}
                    </td>
                    <td data-label="Fee Type">
                      <div className="fee-info">
                        <span className={`fee-type-badge ${student.feeType || 'monthly'}`}>
                          {student.feeType || 'Monthly'}
                        </span>
                        <div className="applicable-months hide-desktop">
                          {applicableMonthsDisplay}
                        </div>
                      </div>
                    </td>
                    <td data-label="Amount Paid" className="hide-mobile">
                      <span className="balance-positive">₹{totalPaid.toLocaleString()}</span>
                    </td>
                    <td data-label="Amount Pending" className="hide-mobile">
                      <span className={totalPending > 0 ? 'balance-negative' : 'balance-positive'}>
                        ₹{Math.max(0, totalPending).toLocaleString()}
                      </span>
                    </td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleDelete(student.studentId)}
                          className="delete-btn"
                          title="Remove Student"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(!summary.studentStats || summary.studentStats.length === 0) && (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>No student data available</h3>
          <p>Student statistics will appear here once students are enrolled.</p>
        </div>
      )}

      {/* Financial Insights */}
      <div className="insights-section">
        <div className="section-header">
          <h3>Financial Insights</h3>
          <p>Key insights about your institution's financial performance</p>
        </div>
        
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <h4>Revenue Growth</h4>
            <p>
              Total revenue of ₹{totalRevenue.toLocaleString()} with 
              {activeStudents} active students contributing to steady income.
            </p>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <h4>Collection Rate</h4>
            <p>
              {collectionRate}% collection rate with ₹{totalPending.toLocaleString()} pending.
              {collectionRate >= 80 ? ' Excellent performance!' : collectionRate >= 60 ? ' Good progress.' : ' Needs improvement.'}
            </p>
          </div>
          
          <div className="insight-card">
            <div className="insight-icon">📋</div>
            <h4>Student Retention</h4>
            <p>
              {totalStudents ? Math.round((activeStudents / totalStudents) * 100) : 0}% 
              student retention rate with {activeStudents} active students.
              {activeStudents > leftStudents ? ' Great retention!' : ' Consider engagement strategies.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Summary;