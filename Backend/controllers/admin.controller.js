// Backend/controllers/admin.controller.js
// YEH FILE BANAO

const User = require("../models/User");

// ── PENDING USERS ─────────────────────────────
const getPendingUsers = async (req, res) => {
  try {
    const users = await User.find({
      isApproved: false,
      role: { $ne: "admin" },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── ALL USERS ─────────────────────────────────
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: { $ne: "admin" },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── APPROVE USER ──────────────────────────────
const approveUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        isApproved: true,
        approvedAt: new Date(),
        approvedBy: req.user._id,
      },
      { new: true },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nahi mila",
      });
    }

    res.json({
      success: true,
      message: `${user.name} approve ho gaya!`,
      data: user,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── REJECT USER ───────────────────────────────
const rejectUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User nahi mila",
      });
    }

    await User.findByIdAndDelete(req.params.userId);

    res.json({
      success: true,
      message: `${user.name} reject ho gaya`,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ── DASHBOARD STATS ───────────────────────────
const getStats = async (req, res) => {
  try {
    const [
      totalUsers,
      pendingUsers,
      approvedUsers,
      totalStudents,
      totalTeachers,
    ] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({
        isApproved: false,
        role: { $ne: "admin" },
      }),
      User.countDocuments({
        isApproved: true,
        role: { $ne: "admin" },
      }),
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "teacher" }),
    ]);

    res.json({
      success: true,
      data: {
        totalUsers,
        pendingUsers,
        approvedUsers,
        totalStudents,
        totalTeachers,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  getPendingUsers,
  getAllUsers,
  approveUser,
  rejectUser,
  getStats,
};
