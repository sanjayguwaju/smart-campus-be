const Department = require('../models/department.model');

// Create a new department
async function createDepartment(req, res) {
  try {
    const department = await Department.create({ name: req.body.name });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Get all departments
async function getDepartments(req, res) {
  try {
    const departments = await Department.find();
    res.json({ success: true, data: departments });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

// Get a department by ID
async function getDepartmentById(req, res) {
  const department = await Department.findById(req.params.id);
  if (!department) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: department });
}

// Update a department
async function updateDepartment(req, res) {
  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { name: req.body.name },
    { new: true, runValidators: true }
  );
  if (!department) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, data: department });
}

// Delete a department
async function deleteDepartment(req, res) {
  const department = await Department.findByIdAndDelete(req.params.id);
  if (!department) return res.status(404).json({ success: false, error: 'Not found' });
  res.json({ success: true, message: 'Department deleted' });
}

module.exports = {
  createDepartment,
  getDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
}; 