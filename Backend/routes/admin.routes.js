const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");

// Tumhare existing auth middleware ka path check karo
// Yahan assume kar raha hoon ki middleware folder mein hai
const authMiddleware = require("../middleware/auth");
// YA ho sakta hai tumhara naam alag ho jaise:
// const { protect } = require('../middleware/auth');
const adminMiddleware = require("../middleware/admin.middleware");

// Dono middleware lagate hain — pehle auth, phir admin check
const protect = [authMiddleware, adminMiddleware];

// ── ROUTES ──────────────────────────────────
// GET  /api/admin/stats
router.get("/stats", protect, adminController.getStats);

// GET  /api/admin/users/pending
router.get("/users/pending", protect, adminController.getPendingUsers);

// GET  /api/admin/users
router.get("/users", protect, adminController.getAllUsers);

// PUT  /api/admin/users/:userId/approve
router.put("/users/:userId/approve", protect, adminController.approveUser);

// DELETE /api/admin/users/:userId
router.delete("/users/:userId", protect, adminController.rejectUser);

module.exports = router;
