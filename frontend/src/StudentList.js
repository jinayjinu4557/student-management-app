import React, { useEffect, useState } from 'react';
import api from './api';
import Loader from './components/Loader';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', class: '', parentNumber: '', monthlyFee: '' });
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setLoadingMessage('Loading students...');
      const res = await api.get('/api/students');
      setStudents(res.data);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      try {
        setLoading(true);
        setLoadingMessage('Removing student...');
        await api.delete(`/api/students/${id}`);
        await fetchStudents();
      } catch (error) {
        console.error('Error deleting student:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEdit = (student) => {
    setEditId(student.studentId);
    setEditForm({
      name: student.name,
      class: student.class,
      parentNumber: student.parentNumber,
      monthlyFee: student.monthlyFee
    });
  };

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (id) => {
    try {
      setLoading(true);
      setLoadingMessage('Saving changes...');
      await api.put(`/api/students/${id}`, {
        ...editForm,
        monthlyFee: Number(editForm.monthlyFee)
      });
      setEditId(null);
      await fetchStudents();
    } catch (error) {
      console.error('Error updating student:', error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.class.toLowerCase().includes(filter.toLowerCase()) ||
    s.parentNumber.includes(filter)
  );

  return (
    <div className="container">
      {loading && <Loader message={loadingMessage} />}
      <h2>Student List</h2>
      <input
        type="text"
        placeholder="Filter by name, class, or parent number"
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{ marginBottom: 16, width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Class</th>
            <th>Monthly Fee</th>
            <th>Parent Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(student => (
            <tr key={student.studentId}>
              {editId === student.studentId ? (
                <>
                  {/* <td>{student.studentId}</td> */}
                  <td data-label="Name">
                    <input name="name" value={editForm.name} onChange={handleEditChange} />
                  </td>
                  <td data-label="Class">
                    <input name="class" value={editForm.class} onChange={handleEditChange} />
                  </td>
                  <td data-label="Monthly Fee">
                    <input name="monthlyFee" value={editForm.monthlyFee} onChange={handleEditChange} type="number" />
                  </td>
                  <td data-label="Parent Contact">
                    <input name="parentNumber" value={editForm.parentNumber} onChange={handleEditChange} />
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEditSave(student.studentId)} style={{ background: '#2196f3', color: '#fff' }}>Save</button>
                      <button onClick={() => setEditId(null)} style={{ background: '#e0e0e0', color: '#333' }}>Cancel</button>
                    </div>
                  </td>
                </>
              ) : (
                <>
                  {/* <td>{student.studentId}</td> */}
                  <td data-label="Name">{student.name}</td>
                  <td data-label="Class">{student.class}</td>
                  <td data-label="Monthly Fee">{student.monthlyFee}</td>
                  <td data-label="Parent Contact">{student.parentNumber}</td>
                  <td>
                    <div className="action-buttons">
                      <button onClick={() => handleEdit(student)} style={{ background: '#00bcd4', color: '#fff' }}>Edit</button>
                      <button onClick={() => handleDelete(student.studentId)} style={{ background: '#e53935', color: '#fff' }}>Remove</button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudentList; 