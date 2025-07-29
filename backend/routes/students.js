const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Counter = require('../models/Counter');

// Enroll a new student with auto-increment studentId
router.post('/', async (req, res) => {
  try {
    // Get next studentId
    let counter = await Counter.findByIdAndUpdate(
      { _id: 'studentId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    const { name, parentNumber, class: studentClass, monthlyFee, enrollmentMonth, status } = req.body;
    const student = new Student({
      studentId: counter.seq,
      name,
      parentNumber,
      class: studentClass,
      monthlyFee,
      enrollmentMonth: enrollmentMonth || 'June 2025',
      status: status || 'Active',
      active: true
    });
    await student.save();
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all active students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find({ active: { $ne: false } });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update student details by studentId
router.put('/:studentId', async (req, res) => {
  if (!req.params.studentId || isNaN(Number(req.params.studentId))) {
    return res.status(400).json({ error: 'Invalid studentId' });
  }
  try {
    const { name, parentNumber, class: studentClass, monthlyFee } = req.body;
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId },
      { name, parentNumber, class: studentClass, monthlyFee },
      { new: true }
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json(student);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Soft delete (mark inactive) a student by studentId
router.delete('/:studentId', async (req, res) => {
  if (!req.params.studentId || isNaN(Number(req.params.studentId))) {
    return res.status(400).json({ error: 'Invalid studentId' });
  }
  try {
    const student = await Student.findOneAndUpdate(
      { studentId: req.params.studentId },
      { active: false },
      { new: true }
    );
    if (!student) return res.status(404).json({ error: 'Student not found' });
    res.json({ message: 'Student marked as inactive', student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router; 