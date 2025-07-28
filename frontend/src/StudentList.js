import React, { useEffect, useState } from 'react';
import api from './api';

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [filter, setFilter] = useState('');
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', class: '', parentNumber: '', monthlyFee: '' });

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    const res = await api.get('/api/students');
    setStudents(res.data);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this student?')) {
      await api.delete(`/api/students/${id}`);
      fetchStudents();
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
    await api.put(`/api/students/${id}`, {
      ...editForm,
      monthlyFee: Number(editForm.monthlyFee)
    });
    setEditId(null);
    fetchStudents();
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.class.toLowerCase().includes(filter.toLowerCase()) ||
    s.parentNumber.includes(filter)
  );

  return (
    <div className="container">
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
                  <td><input name="name" value={editForm.name} onChange={handleEditChange} /></td>
                  <td><input name="class" value={editForm.class} onChange={handleEditChange} /></td>
                  <td><input name="monthlyFee" value={editForm.monthlyFee} onChange={handleEditChange} type="number" /></td>
                  <td><input name="parentNumber" value={editForm.parentNumber} onChange={handleEditChange} /></td>
                  <td>
                    <button onClick={() => handleEditSave(student.studentId)} style={{ background: '#2196f3', color: '#fff', marginRight: 8 }}>Save</button>
                    <button onClick={() => setEditId(null)} style={{ background: '#e0e0e0', color: '#333' }}>Cancel</button>
                  </td>
                </>
              ) : (
                <>
                  {/* <td>{student.studentId}</td> */}
                  <td>{student.name}</td>
                  <td>{student.class}</td>
                  <td>{student.monthlyFee}</td>
                  <td>{student.parentNumber}</td>
                  <td>
                    <button onClick={() => handleEdit(student)} style={{ background: '#00bcd4', color: '#fff', marginRight: 8 }}>Edit</button>
                    <button onClick={() => handleDelete(student.studentId)} style={{ background: '#e53935', color: '#fff' }}>Remove</button>
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