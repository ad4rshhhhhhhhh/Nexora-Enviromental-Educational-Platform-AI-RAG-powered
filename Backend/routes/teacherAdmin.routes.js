// Backend/routes/teacherAdmin.routes.js

const express = require("express");
const router = express.Router();

const {
  getAllStudents,
  getStudentById,
  getClassStats,
  getLeaderboard,
  getStudentUpdatesSince,
} = require("../controllers/teacherAdmin.controller");

const isTeacher = require("../middleware/isTeacher");
const auth = require("../middleware/auth");

router.use(auth, isTeacher);

// NOTE: /students/updates must be registered before /students/:studentId,
// otherwise Express will match "updates" as a :studentId param.
router.get("/students/updates", getStudentUpdatesSince);
router.get("/students/:studentId", getStudentById);
router.get("/students", getAllStudents);

router.get("/stats", getClassStats);
router.get("/leaderboard", getLeaderboard);

module.exports = router;
