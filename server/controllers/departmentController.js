// controllers/departmentController.js
const Department = require("../models/Department");

// GET /api/departments
async function listDepartments(req, res) {
  const departments = await Department.find().sort("name");
  res.json(departments);
}

module.exports = { listDepartments };
