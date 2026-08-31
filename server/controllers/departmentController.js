// controllers/departmentController.js
const Department = require("../models/Department");

// GET /api/departments
async function listDepartments(req, res, next) {
  try {
    const departments = await Department.find().sort("name");
    res.json(departments);
  } catch (err) {
    next(err);
  }
}

module.exports = { listDepartments };

