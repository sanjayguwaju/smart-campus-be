const express = require('express');
const router = express.Router();
const departmentController = require('../controllers/department.controller');
const { getDepartments } = require('../controllers/department.controller');

router.post('/', departmentController.createDepartment);
router.get('/', getDepartments);
router.get('/:id', departmentController.getDepartmentById);
router.put('/:id', departmentController.updateDepartment);
router.delete('/:id', departmentController.deleteDepartment);

module.exports = router; 