// routes/departmentRoutes.js
const express = require("express");
const router = express.Router();
const { listDepartments } = require("../controllers/departmentController");

router.get("/", listDepartments);

module.exports = router;
