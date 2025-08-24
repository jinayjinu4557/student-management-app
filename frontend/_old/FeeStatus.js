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

const FeeStatus = () => {
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState(months[0]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('monthly'); // 'monthly', 'yearly'
  const rowsPerPage = 10;

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
          
          // Replace the temporary payment with the real one from the response
          if (response && response.data) {
            setPayments(prevPayments => 
              prevPayments.map(p => {
                if (p._id === tempPayment._id) {
                  return response.data;
                }
                return p;
              })
            );
          }
          
          setMessage(`Installment ${installmentNumber} marked as ${status}!`);
        } else {
          // Skip creating payment if fee is not applicable (student enrolled after selected month)
          const calculatedFee = calculateFeeBasedOnMonths(student, selectedMonth);
          if (calculatedFee === 0) {
            setMessage('No fee applicable for this month based on enrollment date.');
            setLoading(false);
            return;
          }
          
          // Create a regular monthly payment
          console.log('Creating new monthly payment');
          
          // Calculate fee based on enrollment month
          const amountPaid = status === 'Paid' ? calculatedFee : 0;
          
          // Create a temporary payment object for immediate UI update
          const tempPayment = {
            _id: 'temp_' + Date.now(), // Temporary ID
            studentId: apiStudentId,
            month: selectedMonth,
            status,
            amountPaid,
            isInstallment: false
          };
          
          // Add the temporary payment to local state immediately
          setPayments(prevPayments => [...prevPayments, tempPayment]);
          
          // Make the API call
          const response = await api.post('/api/fees', {
            studentId: apiStudentId,
            month: selectedMonth,
            status,
            amountPaid,
            isInstallment: false
          });
          
          // Replace the temporary payment with the real one from the response
          if (response && response.data) {
            setPayments(prevPayments => 
              prevPayments.map(p => {
                if (p._id === tempPayment._id) {
                  return response.data;
                }
                return p;
              })
            );
          }
          
          setMessage('Monthly payment created!');
        }
      }
      
      // Refresh data immediately to ensure we have the latest information
      await fetchData();
      
      // Refresh balance calculation for this specific student
      refreshBalance(studentId);
      
      // Set a timeout to refresh data again after a delay to ensure backend processing completes
      setTimeout(() => {
        fetchData();
      }, 2000); // Increased delay to ensure backend processing completes
    } catch (error) {
      console.error('Error updating status:', error);
      setMessage('Error updating status: ' + (error.response?.data?.error || error.message));
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
        // Calculate installment amount
        const yearlyFee = student.yearlyFee || (student.monthlyFee * 12) || 12000;
        return Math.round(yearlyFee / (student.installments || 3));
      }
    }
    
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
    
    // Calculate the appropriate fee based on student's enrollment month
    const calculatedFee = calculateFeeBasedOnMonths(student, selectedMonth);
    
    // If calculated fee is 0 (student enrolled after selected month), always return 0
    if (calculatedFee === 0) {
      return 0;
    }
    
    // If payment exists and is paid, return 0, otherwise return the calculated fee
    if (payment && payment.status === 'Paid') {
      return 0;
    } else {
      // Either payment is unpaid or no payment record exists yet
      return calculatedFee;
    }
  };

  // Import the data refresh context
  const { triggerRefresh } = useDataRefresh();
  
  // Refresh balance immediately after fee status changes
  const refreshBalance = (studentId) => {
    // Find the student by studentId
    const student = students.find(s => s.studentId === studentId);
    if (!student) return;
    
    // Force UI update by triggering a state change
    setMessage(prev => {
      setTimeout(() => setMessage(''), 2000);
      return 'Balance updated';
    });
    
    // Trigger refresh for other components
    triggerRefresh();
  };

  // Pagination is now handled in the render section with filteredStudents

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

  // View mode is now limited to 'monthly' or 'yearly'

  // Filter students based on view mode and enrollment month
  const filteredStudents = students.filter(student => {
    // Check if student is in 10th class
    const classValue = student.class ? student.class.toString().toLowerCase() : '';
    const is10thClass = (
      classValue === '10' || 
      classValue === '10th' || 
      classValue.includes('10th') || 
      classValue.includes('10 ') || 
      classValue === 'x' || 
      classValue === 'class x' || 
      classValue === 'class 10'
    );
    
    // For monthly view
    if (viewMode === 'monthly') {
      // First check if student should be shown based on enrollment month
      if (student.enrollmentMonth) {
        // Get the index of the selected month in our months array
        const selectedMonthIndex = months.indexOf(selectedMonth);
        
        // Get the index of the student's enrollment month
        const enrollmentMonth = student.enrollmentMonth || 'June 2025'; // Default to first month if not specified
        const enrollmentMonthIndex = months.indexOf(enrollmentMonth);
        
        // Only show students whose enrollment month is on or before the selected month
        // This ensures we only show students for months from their enrollment onwards
        if (enrollmentMonthIndex > selectedMonthIndex) {
          return false; // Don't show student for this month
        }
      }
      
      // For monthly view, exclude yearly fee type students AND 10th class students
      return student.feeType !== 'yearly' && !is10thClass;
    }
    
    // For yearly view
    if (viewMode === 'yearly') {
      // For yearly view, include yearly fee type OR 10th class students
      return student.feeType === 'yearly' || is10thClass;
    }
    
    return false; // Don't show any students for unrecognized view modes
  });

  // Calculate pagination based on filtered students
  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const currentStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <div className="fee-status-container">
      {loading && <Loader message={loadingMessage} />}
      <h2>Fee Status Tracker</h2>
      
      <div className="fee-type-selector">
        <div>
          <button 
            className={viewMode === 'monthly' ? 'active' : ''}
            onClick={() => setViewMode('monthly')}
          >
            Monthly Fee
          </button>
          <button 
            className={viewMode === 'yearly' ? 'active' : ''}
            onClick={() => setViewMode('yearly')}
          >
            Yearly Fee (10th)
          </button>
        </div>
        
        {viewMode !== 'yearly' && (
          <div>
            <label htmlFor="month-select">Select Month: </label>
            <select 
              id="month-select"
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
            >
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Class</th>
              {viewMode !== 'yearly' && (
                <>
                  <th>Monthly Fee</th>
                  <th>Status</th>
                  <th>Balance</th>
                  <th>Action</th>
                </>
              )}
              {viewMode === 'yearly' && (
                <>
                  <th>Yearly Fee</th>
                  <th>Installment</th>
                  <th>Status</th>
                  <th>Action</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {currentStudents.map(student => {
              // Check if student is in 10th class
              const classValue = student.class.toString().toLowerCase();
              const is10thClass = 
                classValue === '10' || 
                classValue === '10th' || 
                classValue.includes('10th') || 
                classValue.includes('10 ') || 
                classValue === 'x' || 
                classValue === 'class x' || 
                classValue === 'class 10';
              
              // For yearly fee students (10th class)
              if (student.feeType === 'yearly' || (is10thClass && viewMode === 'yearly')) {
                if (viewMode === 'monthly') return null; // Skip in monthly view
                
                // Calculate installment details
                const installments = parseInt(student.installments) || 3;
                
                // If student is in 10th class but doesn't have yearly fee set,
                // use a default yearly fee based on monthly fee
                let yearlyFee = student.yearlyFee;
                if ((!yearlyFee || yearlyFee === 0 || yearlyFee === null) && is10thClass) {
                  // Default yearly fee calculation: monthly fee * 12 months
                  yearlyFee = (student.monthlyFee || 1000) * 12;
                  console.log('Setting default yearly fee for 10th class student:', student.name, yearlyFee);
                  
                  // If this is the first time we're showing this student in yearly view,
                  // we should update their record to have the correct fee type
                  if (student.feeType !== 'yearly') {
                    // We'll update this via API in the background
                    // Always use studentId for API calls to the backend
                    const studentId = student.studentId;
                    console.log('Updating student ID:', studentId);
                    
                    api.put(`/api/students/${studentId}`, {
                      feeType: 'yearly',
                      yearlyFee: yearlyFee,
                      installments: installments
                    }).then(() => {
                      console.log('Successfully updated student fee type to yearly');
                      // Update the student in our local state
                      const updatedStudents = students.map(s => {
                        // Consistently check for student match using studentId
                        if (s.studentId === student.studentId) {
                          return { ...s, feeType: 'yearly', yearlyFee: yearlyFee, installments: installments };
                        }
                        return s;
                      });
                        setStudents(updatedStudents);
                        // Refresh data to ensure we have the latest information
                        fetchData();
                    }).catch(err => console.error('Error updating student fee type:', err));
                  }
                }
                
                // Ensure yearlyFee is never 0
                if (!yearlyFee || yearlyFee === 0 || yearlyFee === null) {
                  yearlyFee = (student.monthlyFee || 1000) * 12;
                }
                
                const installmentAmount = Math.round(yearlyFee / installments);
                
                // Create separate rows for each installment to make the table consistent
                // Create an array to hold all installment rows
                const installmentRows = [];
                
                // Generate each installment row
                for (let i = 0; i < installments; i++) {
                  const installmentNumber = i + 1;
                  // Consistently use studentId for all operations
                  const status = getStatus(student.studentId, null, installmentNumber);
                  const paymentId = getPaymentId(student.studentId, null, installmentNumber);
                  
                  // Find the payment to get the month
                  const payment = payments.find(p => {
                    // Extract studentId from payment if it's an object
                    const paymentStudentId = p.studentId && typeof p.studentId === 'object' ? p.studentId._id : p.studentId;
                    // Use student._id for comparison
                    const compareId = student._id;
                    return (
                      paymentStudentId && paymentStudentId.toString() === compareId.toString() &&
                      p.isInstallment === true && 
                      p.installmentNumber === installmentNumber
                    );
                  });
                  
                  // Extract month info from payment if available
                  let monthInfo = '';
                  if (payment && payment.month) {
                    if (payment.month.includes('Installment')) {
                      monthInfo = payment.month.replace(`Installment ${installmentNumber} (`, '').replace(')', '');
                    } else {
                      monthInfo = payment.month;
                    }
                  }
                  
                  // Create the row for this installment
                  installmentRows.push(
                    <tr key={`${student.studentId}-${installmentNumber}`} className="yearly-fee-row">
                      {i === 0 ? (
                        <>
                          <td data-label="Name" rowSpan={installments}>{student.name || '-'}</td>
                          <td data-label="Class" rowSpan={installments}>{student.class || '-'} <span className="yearly-fee-label">(Yearly)</span></td>
                          <td data-label="Yearly Fee" rowSpan={installments}>{yearlyFee > 0 ? `₹${yearlyFee}` : (student.yearlyFee > 0 ? `₹${student.yearlyFee}` : `₹${(student.monthlyFee || 1000) * 12}`)}</td>
                        </>
                      ) : null}
                      <td data-label="Installment">
                        <div className="installment-info-simple">
                          <span className="installment-badge">Installment {installmentNumber}</span>
                          <span className="installment-date">{monthInfo || '-'}</span>
                          <div className="installment-amount">{installmentAmount > 0 ? `₹${installmentAmount}` : '-'}</div>
                        </div>
                      </td>
                      <td data-label="Status">
                        <div className={`status-badge status-${status.toLowerCase()}`}>{status || 'Unpaid'}</div>
                      </td>
                      <td data-label="Actions">
                        <div className="action-buttons">
                          <button
                            onClick={() => handleStatusChange(student.studentId, 'Paid', paymentId, true, installmentNumber)}
                            className="action-button paid-button"
                            disabled={status === 'Paid'}
                          >
                            Mark Paid
                          </button>
                          <button
                            onClick={() => handleStatusChange(student.studentId, 'Unpaid', paymentId, true, installmentNumber)}
                            className="action-button unpaid-button"
                            disabled={status === 'Unpaid'}
                          >
                            Mark Unpaid
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }
                
                // Return all installment rows
                 return installmentRows;

              }
              
              // For monthly fee students (other classes)
              if (viewMode === 'yearly') return null; // Skip in yearly view
              
              // Consistently use studentId for all operations
              const status = getStatus(student.studentId, selectedMonth);
              const paymentId = getPaymentId(student.studentId, selectedMonth);
              const balance = getBalance(student.studentId);
      
              // Display calculated fee or placeholder if zero/missing
              // Only show fee if it's applicable
              const calculatedFee = calculateFeeBasedOnMonths(student, selectedMonth);
              const monthlyFeeDisplay = calculatedFee > 0 ? `₹${calculatedFee}` : '-';
              
              // Display enrollment month if available
              const enrollmentInfo = student.enrollmentMonth ? 
                `${student.enrollmentMonth}` : '';
              
              return (
                <tr key={student.studentId}>
                  <td data-label="Name">{student.name || '-'}</td>
                  <td data-label="Class">{student.class || '-'}</td>
                  <td data-label="Monthly Fee">
                    {monthlyFeeDisplay}
                    {enrollmentInfo && <div className="enrollment-month">{enrollmentInfo}</div>}
                  </td>
                  {/* Installment column removed from monthly fee view */}
                  <td data-label="Status">
                    <div className={`status-badge status-${status.toLowerCase()}`}>{status}</div>
                  </td>
                  <td data-label="Balance">{balance > 0 ? `₹${balance}` : '₹0'}</td>
                  <td data-label="Actions">
                    <div className="action-buttons">
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'Paid', paymentId)}
                        className="action-button paid-button"
                        disabled={status === 'Paid'}
                      >
                        Mark Paid
                      </button>
                      <button
                        onClick={() => handleStatusChange(student.studentId, 'Unpaid', paymentId)}
                        className="action-button unpaid-button"
                        disabled={status === 'Unpaid'}
                      >
                        Mark Unpaid
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {filteredStudents.length > rowsPerPage && (
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
        Showing {filteredStudents.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredStudents.length)} of {filteredStudents.length} students
      </div>
      
      {message && <div className="success">{message}</div>}
    </div>
  );
};

export default FeeStatus;