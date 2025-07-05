require('dotenv').config();
const mongoose = require('mongoose');
const Department = require('./src/models/department.model');
const connectDB = require('./src/config/db.config');

const departmentsToAdd = [
  'Computer Engineering',
  'Electrical Engineering',
  'Civil'
];

async function addDepartments() {
  await connectDB();
  try {
    for (const name of departmentsToAdd) {
      const existing = await Department.findOne({ name });
      if (existing) {
        console.log('Department already exists:', name);
      } else {
        const department = await Department.create({ name });
        console.log('Department created:', department.name);
      }
    }
  } catch (err) {
    console.error('Error creating departments:', err.message);
  } finally {
    mongoose.connection.close();
  }
}

addDepartments(); 