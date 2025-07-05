const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  title: { type: String },
  code: { type: String, required: true },
  program: { type: mongoose.Schema.Types.ObjectId, ref: 'Program', required: true },
  department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  semester: { type: Number, required: true },
  semesterTerm: { type: String, enum: ['Fall', 'Spring', 'Summer', 'Winter'], required: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: { type: String },
  creditHours: { type: Number, required: true },
  year: { type: Number, required: true },
  maxStudents: { type: Number, required: true }
}, { timestamps: true });

// Middleware to always set 'name' from 'title'
courseSchema.pre('validate', function(next) {
  if (this.title) {
    this.name = this.title;
  }
  next();
});

module.exports = mongoose.model('Course', courseSchema); 