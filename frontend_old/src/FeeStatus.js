import React, { useEffect, useState, useCallback } from 'react';
import api from './api';
import Loader from './components/Loader';
import { useDataRefresh } from './contexts/DataRefreshContext';
import './FeeStatus.css';

const months = [
  'June 2025', 'July 2025', 'August 2025', 'September 2025',
  'October 2025', 'November 2025', 'December 2025', 'January 2026', 'February 2026', 'March 2026',
  'April 2026'];

// Helper function to calculate fees based on student's enrollment months
const calculateFeeBasedOnMonths = (student, selectedMonth) => {
  if (!student || !student.monthlyFee) return 0;
  
  // Get the index of the selected month in our months array
  const selectedMonthIndex = months.indexOf(selectedMonth);
  if (selectedMonthIndex === -1) return student.monthlyFee; // Default to full fee if month not found
  
  // Get the index of the student's enrollment month (if available)
  const enrollmentMonth = student.enrollmentMonth || 'June 2025'; // Default to first month if not specified
  const enrollmentMonthIndex = months.indexOf(enrollmentMonth);
  
  // Special case: If the selected month is the month immediately before enrollment,
  // still show the fee (this handles cases like July students showing in June)
  if (enrollmentMonthIndex === selectedMonthIndex + 1) {
    return student.monthlyFee;
  }
  
  // If student enrolled after the selected month, no fee is due
  if (enrollmentMonthIndex > selectedMonthIndex) return 0;
  
  // Otherwise, return the full monthly fee
  return student.monthlyFee;
};

// Helper function to check if student is in class 10
const isClass10Student = (studentClass) => {
  return studentClass === '10' || studentClass === 'Class 10' || studentClass.toLowerCase().includes('10');
};

const FeeStatus = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Loading fee data...');
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'yearly'
  const { refreshFlag } = useDataRefresh();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading fee data...');
      const studentsRes = await api.get('/api/students');
      
      // Get all payments for the selected month
      let paymentsRes;
      if (viewMode === 'monthly') {
        paymentsRes = await api.get('/api/fees?month=' + encodeURIComponent(selectedMonth));
      } else {
        // For yearly view, we need to get all payments to filter installments
        paymentsRes = await api.get('/api/fees');
      }
      
      setStudents(studentsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, viewMode]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (refreshFlag) {
      fetchData();
    }
  }, [refreshFlag, fetchData]);

  const handleStatusChange = async (studentId, status, paymentId, isInstallment = false, installmentNumber = null) => {
    try {
      setLoading(true);
      setLoadingMessage(`Marking as ${status.toLowerCase()}...`);
      
      // Consistently find student using studentId
      const student = students.find(s => s.studentId === studentId);
      
      if (!student) {
        console.error('Student not found:', studentId);
        setMessage('Error: Student not found!');
        setLoading(false);
        return;
      }
      
      // Always use _id for API calls for consistency
      const apiStudentId = student._id;
      
      // If we have a payment ID, update that specific payment
      if (paymentId) {
        console.log('Updating existing payment:', paymentId);
        let amountPaid = 0;
        
        if (status === 'Paid') {
          if (isInstallment) {
            // Make sure yearlyFee is not 0 or null
            const yearlyFee = student.yearlyFee || (student.monthlyFee * 12) || 12000;
            amountPaid = Math.round(yearlyFee / (student.installments || 3));
          } else {
            // Calculate fee based on enrollment month
            amountPaid = calculateFeeBasedOnMonths(student, selectedMonth);
          }
        }
        
        // Update local state to reflect the change immediately before API call
        setPayments(prevPayments => 
          prevPayments.map(p => {
            if (p._id === paymentId) {
              return { ...p, status, amountPaid };
            }
            return p;
          })
        );
        
        // Make the API call
        const response = await api.put(`/api/fees/${paymentId}`, {
          status,
          amountPaid
        });
        
        // Update with the response data to ensure consistency
        if (response && response.data) {
          setPayments(prevPayments => 
            prevPayments.map(p => {
              if (p._id === paymentId) {
                return response.data;
              }
              return p;
            })
          );
          
          // Force refresh to update all calculations
          await fetchData();
        }
        
        setMessage(`Payment marked as ${status}!`);
      } else {
        // Otherwise create a new payment
        if (isInstallment && installmentNumber !== null) {
          // Create a new installment payment
          console.log('Creating new installment payment:', {
            studentId: apiStudentId,
            installmentNumber,
            totalInstallments: student.installments || 3
          });
          
          // Make sure yearlyFee is not 0 or null
          const yearlyFee = student.yearlyFee || (student.monthlyFee * 12) || 12000;
          const amountPaid = status === 'Paid' ? Math.round(yearlyFee / (student.installments || 3)) : 0;
          
          // Create a temporary payment object for immediate UI update
          const tempPayment = {
            _id: 'temp_' + Date.now(), // Temporary ID
            studentId: apiStudentId,
            month: `Installment ${installmentNumber} (${selectedMonth})`,
            status,
            amountPaid,
            isInstallment: true,
            installmentNumber,
            totalInstallments: student.installments || 3
          };
          
          // Add the temporary payment to local state immediately
          setPayments(prevPayments => [...prevPayments, tempPayment]);
          
          // Make the API call
          const response = await api.post('/api/fees', {
            studentId: apiStudentId,
            month: `Installment ${installmentNumber} (${selectedMonth})`,
            status,
            amountPaid,
            isInstallment: true,
            installmentNumber,
            totalInstallments: student.installments || 3
          });
          
          // Replace temporary payment with real one
          if (response && response.data) {
            setPayments(prevPayments => 
              prevPayments.map(p => 
                p._id === tempPayment._id ? response.data : p
              )
            );
          }
          
          setMessage(`Installment ${installmentNumber} marked as ${status}!`);
        } else {
          // Create a new monthly payment
          const amountPaid = status === 'Paid' ? calculateFeeBasedOnMonths(student, selectedMonth) : 0;
          
          // Create a temporary payment object for immediate UI update
          const tempPayment = {
            _id: 'temp_' + Date.now(), // Temporary ID
            studentId: apiStudentId,
            month: selectedMonth,
            status,
            amountPaid
          };
          
          // Add the temporary payment to local state immediately
          setPayments(prevPayments => [...prevPayments, tempPayment]);
          
          // Make the API call
          const response = await api.post('/api/fees', {
            studentId: apiStudentId,
            month: selectedMonth,
            status,
            amountPaid
          });
          
          // Replace temporary payment with real one
          if (response && response.data) {
            setPayments(prevPayments => 
              prevPayments.map(p => 
                p._id === tempPayment._id ? response.data : p
              )
            );
          }
          
          setMessage(`Payment for ${selectedMonth} marked as ${status}!`);
        }
        
        // Force refresh to update all calculations
        await fetchData();
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      setMessage('Error updating payment status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStatus = (studentId, month, installmentNumber = null) => {
    // Find the student by studentId
    const student = students.find(s => s.studentId === studentId);
    if (!student) return 'Unpaid';
    
    // Use student._id for comparison with payment.studentId
    const compareId = student._id;
    
    if (installmentNumber !== null) {
      // For installment-based payments
      const payment = payments.find(p => {
        // Extract studentId from payment if it's an object
        const paymentStudentId = p.studentId && typeof p.studentId === 'object' ? p.studentId._id : p.studentId;
        return (
          (paymentStudentId && paymentStudentId.toString() === compareId.toString()) &&
          p.isInstallment === true && 
          p.installmentNumber === installmentNumber
        );
      });
      return payment ? payment.status : 'Unpaid';
    } else if (month) {
      // For monthly payments
      const payment = payments.find(p => {
        // Extract studentId from payment if it's an object
        const paymentStudentId = p.studentId && typeof p.studentId === 'object' ? p.studentId._id : p.studentId;
        return (
          (paymentStudentId && paymentStudentId.toString() === compareId.toString()) &&
          p.month === month && 
          !p.isInstallment
        );
      });
      return payment ? payment.status : 'Unpaid';
    } else {
      // Handle the case when month is null or undefined
      return 'Unpaid';
    }
  };

  const getPaymentId = (studentId, month, installmentNumber = null) => {
    // Find the student by studentId
    const student = students.find(s => s.studentId === studentId);
    if (!student) return null;
    
    // Use student._id for comparison with payment.studentId
    const compareId = student._id;
    
    if (installmentNumber !== null) {
      // For installment-based payments
      const payment = payments.find(p => {
        // Extract studentId from payment if it's an object
        const paymentStudentId = p.studentId && typeof p.studentId === 'object' ? p.studentId._id : p.studentId;
        return (
          (paymentStudentId && paymentStudentId.toString() === compareId.toString()) &&
          p.isInstallment === true && 
          p.installmentNumber === installmentNumber
        );
      });
      return payment ? payment._id : null;
    } else if (month) {
      // For monthly payments
      const payment = payments.find(p => {
        // Extract studentId from payment if it's an object
        const paymentStudentId = p.studentId && typeof p.studentId === 'object' ? p.studentId._id : p.studentId;
        return (
          (paymentStudentId && paymentStudentId.toString() === compareId.toString()) &&
          p.month === month && 
          !p.isInstallment
        );
      });
      return payment ? payment._id : null;
    } else {
      // Handle the case when month is null or undefined
      return null;
    }
  };

  const getBalance = (studentId, isInstallment = false, installmentNumber = null) => {
    if (!studentId) return 0;
    
    // Find the student by studentId
    const student = students.find(s => s.studentId === studentId);
    if (!student) return 0;
    
    // Use student._id for comparison with payment.studentId
    const compareId = student._id;
    
    // For installment-based payments
    if (isInstallment) {
      const payment = payments.find(p => {
        // Extract studentId from payment if it's an object
        const paymentStudentId = p.studentId && typeof p.studentId === 'object' ? p.studentId._id : p.studentId;
        
        return (
          paymentStudentId && paymentStudentId.toString() === compareId.toString() &&
          p.isInstallment === true && 
          p.installmentNumber === installmentNumber
        );
      });
      
      if (payment && payment.status === 'Paid') {
        return 0;
      } else {
        // Calculate the installment amount
        const yearlyFee = student.yearlyFee || (student.monthlyFee * 12) || 12000;
        return Math.round(yearlyFee / (student.installments || 3));
      }
    } else {
      // For monthly payments
      const payment = payments.find(p => {
        // Extract studentId from payment if it's an object
        const paymentStudentId = p.studentId && typeof p.studentId === 'object' ? p.studentId._id : p.studentId;
        
        return (
          paymentStudentId && paymentStudentId.toString() === compareId.toString() &&
          p.month === selectedMonth && 
          !p.isInstallment
        );
      });
      
      if (payment && payment.status === 'Paid') {
        return 0;
      } else {
        return calculateFeeBasedOnMonths(student, selectedMonth);
      }
    }
  };

  const refreshBalance = (studentId) => {
    // This function can be used to refresh the balance display
    // For now, we'll just trigger a re-render by updating the state
    setStudents([...students]);
  };

  // Filter students based on view mode
  const filteredStudents = students.filter(student => {
    const isYearlyStudent = isClass10Student(student.class) || student.feeType === 'yearly';
    
    if (viewMode === 'monthly') {
      // Show only monthly students (not class 10 and not yearly fee type)
      return !isYearlyStudent;
    } else if (viewMode === 'yearly') {
      // Show only yearly students (class 10 or yearly fee type)
      return isYearlyStudent;
    }
    
    return false;
  });

  if (loading) {
    return <Loader message={loadingMessage} />;
  }

  return (
    <div className="container">
      <h2>Fee Status</h2>
      
      {/* Month Selection - Only show for monthly view */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        {viewMode === 'monthly' && (
          <>
            <label style={{ fontWeight: 500 }}>Select Month:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
            >
              {months.map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </>
        )}
        
        <label style={{ fontWeight: 500, marginLeft: viewMode === 'monthly' ? 20 : 0 }}>View Mode:</label>
        <select 
          value={viewMode} 
          onChange={(e) => setViewMode(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-primary)' }}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {message && (
        <div style={{ 
          padding: '12px 16px', 
          borderRadius: 6, 
          marginBottom: 16,
          background: message.includes('Error') ? 'var(--error-light)' : 'var(--success-light)',
          color: message.includes('Error') ? 'var(--error)' : 'var(--success)',
          border: `1px solid ${message.includes('Error') ? 'var(--error)' : 'var(--success)'}`
        }}>
          {message}
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Class</th>
              <th>Fee Type</th>
              <th>Status</th>
              <th>Amount Due</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStudents.map(student => {
              const isYearly = isClass10Student(student.class) || student.feeType === 'yearly';
              
              if (viewMode === 'yearly' && isYearly) {
                // Show installments for yearly students
                const installments = student.installments || 3;
                return Array.from({ length: installments }, (_, i) => {
                  const installmentNumber = i + 1;
                  const status = getStatus(student.studentId, null, installmentNumber);
                  const paymentId = getPaymentId(student.studentId, null, installmentNumber);
                  const balance = getBalance(student.studentId, true, installmentNumber);
                  
                  return (
                    <tr key={`${student.studentId}-installment-${installmentNumber}`}>
                      <td data-label="Student Name">
                        {installmentNumber === 1 ? student.name : ''}
                      </td>
                      <td data-label="Class">
                        {installmentNumber === 1 ? student.class : ''}
                      </td>
                      <td data-label="Fee Type">
                        {installmentNumber === 1 ? (
                          <span className="fee-type-badge yearly">
                            Yearly (Installment {installmentNumber}/{installments})
                          </span>
                        ) : ''}
                      </td>
                      <td data-label="Status">
                        <span className={`status-badge ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>
                      <td data-label="Amount Due">₹{balance.toLocaleString()}</td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button 
                            onClick={() => handleStatusChange(
                              student.studentId, 
                              status === 'Paid' ? 'Unpaid' : 'Paid', 
                              paymentId, 
                              true, 
                              installmentNumber
                            )}
                            style={{ 
                              background: status === 'Paid' ? 'var(--error)' : 'var(--success)', 
                              color: 'white' 
                            }}
                          >
                            {status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                });
              } else if (viewMode === 'monthly' && !isYearly) {
                // Show monthly payments for regular students
                const status = getStatus(student.studentId, selectedMonth);
                const paymentId = getPaymentId(student.studentId, selectedMonth);
                const balance = getBalance(student.studentId, false);
                
                return (
                  <tr key={student.studentId}>
                    <td data-label="Student Name">{student.name}</td>
                    <td data-label="Class">{student.class}</td>
                    <td data-label="Fee Type">
                      <span className="fee-type-badge monthly">
                        Monthly
                      </span>
                    </td>
                    <td data-label="Status">
                      <span className={`status-badge ${status.toLowerCase()}`}>
                        {status}
                      </span>
                    </td>
                    <td data-label="Amount Due">₹{balance.toLocaleString()}</td>
                    <td data-label="Actions">
                      <div className="action-buttons">
                        <button 
                          onClick={() => handleStatusChange(
                            student.studentId, 
                            status === 'Paid' ? 'Unpaid' : 'Paid', 
                            paymentId
                          )}
                          style={{ 
                            background: status === 'Paid' ? 'var(--error)' : 'var(--success)', 
                            color: 'white' 
                          }}
                        >
                          {status === 'Paid' ? 'Mark Unpaid' : 'Mark Paid'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }
              
              return null; // Don't render anything for students that don't match the view mode
            })}
          </tbody>
        </table>
      </div>
      
      {filteredStudents.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          {viewMode === 'monthly' ? 'No monthly fee students found.' : 'No yearly fee students found.'}
        </div>
      )}
    </div>
  );
};

export default FeeStatus;