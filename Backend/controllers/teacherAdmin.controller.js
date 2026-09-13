// Backend/controllers/teacherAdmin.controller.js
//
// Matches the real User schema:
// name, email, role, isApproved, points, tasksCompleted, quizzesTaken,
// completedModules (ref: "Module"), createdAt/updatedAt (timestamps: true)

const User = require("../models/User");

// ── ALL STUDENTS (roster with live stats) ─────
// GET /api/teacher/students
// Query params: ?sortBy=points&order=desc&search=parul&includePending=false
const getAllStudents = async (req, res) => {
  try {
    const {
      sortBy = "points",
      order = "desc",
      search = "",
      includePending = "false",
    } = req.query;

    const query = {
      role: "student",
      ...(includePending !== "true" && { isApproved: true }),
      ...(search && { name: { $regex: search, $options: "i" } }),
    };

    const sortOrder = order === "asc" ? 1 : -1;

    const students = await User.find(query)
      .select(
        "name email points tasksCompleted quizzesTaken completedModules isApproved createdAt updatedAt",
      )
      .sort({ [sortBy]: sortOrder })
      .lean();

    // completedModules is an array of ObjectIds — expose a plain count too,
    // since that's usually what a roster table wants to display
    const data = students.map((s) => ({
      ...s,
      modulesCompleted: s.completedModules?.length || 0,
    }));

    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── SINGLE STUDENT DETAIL ──────────────────────
// GET /api/teacher/students/:studentId
const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({
      _id: req.params.studentId,
      role: "student",
    })
      .select("-password")
      .populate("completedModules", "title category") // ⚠️ adjust fields to your Module schema
      .lean();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student nahi mila",
      });
    }

    res.json({ success: true, data: student });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── CLASS-WIDE STATS (for dashboard cards) ────
// GET /api/teacher/stats
const getClassStats = async (req, res) => {
  try {
    const [totalStudents, aggregate, topPerformer] = await Promise.all([
      User.countDocuments({ role: "student", isApproved: true }),

      User.aggregate([
        { $match: { role: "student", isApproved: true } },
        {
          $group: {
            _id: null,
            totalPoints: { $sum: "$points" },
            avgPoints: { $avg: "$points" },
            totalTasksCompleted: { $sum: "$tasksCompleted" },
            totalQuizzesTaken: { $sum: "$quizzesTaken" },
            avgModulesCompleted: { $avg: { $size: "$completedModules" } },
          },
        },
      ]),

      User.findOne({ role: "student", isApproved: true })
        .sort({ points: -1 })
        .select("name points")
        .lean(),
    ]);

    const stats = aggregate[0] || {
      totalPoints: 0,
      avgPoints: 0,
      totalTasksCompleted: 0,
      totalQuizzesTaken: 0,
      avgModulesCompleted: 0,
    };

    res.json({
      success: true,
      data: {
        totalStudents,
        totalPoints: stats.totalPoints,
        avgPoints: Math.round((stats.avgPoints || 0) * 10) / 10,
        totalTasksCompleted: stats.totalTasksCompleted,
        totalQuizzesTaken: stats.totalQuizzesTaken,
        avgModulesCompleted: Math.round((stats.avgModulesCompleted || 0) * 10) / 10,
        topPerformer: topPerformer
          ? { name: topPerformer.name, points: topPerformer.points }
          : null,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── LEADERBOARD ────────────────────────────────
// GET /api/teacher/leaderboard?limit=10
const getLeaderboard = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const topStudents = await User.find({ role: "student", isApproved: true })
      .select("name points tasksCompleted quizzesTaken")
      .sort({ points: -1 })
      .limit(limit)
      .lean();

    res.json({ success: true, data: topStudents });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── CHEAP POLLING ENDPOINT ─────────────────────
// GET /api/teacher/students/updates?since=2026-09-13T10:00:00.000Z
// Frontend polls this on an interval with the timestamp of its last
// successful fetch, and gets back only the students who actually changed
// since then — far lighter than re-fetching the whole roster every tick.
const getStudentUpdatesSince = async (req, res) => {
  try {
    const { since } = req.query;

    const query = {
      role: "student",
      isApproved: true,
      ...(since && { updatedAt: { $gt: new Date(since) } }),
    };

    const updatedStudents = await User.find(query)
      .select("name points tasksCompleted quizzesTaken completedModules updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    const data = updatedStudents.map((s) => ({
      ...s,
      modulesCompleted: s.completedModules?.length || 0,
    }));

    res.json({
      success: true,
      serverTime: new Date().toISOString(), // client stores this as its next "since"
      count: data.length,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  getClassStats,
  getLeaderboard,
  getStudentUpdatesSince,
};
