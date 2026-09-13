const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  submitTask,
} = require("../controllers/task.controller");

const auth = require("../middleware/auth"); // adjust to your actual auth middleware name

// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.get("/", auth, getTasks);
router.post("/", auth, upload.single("resourceFile"), createTask);
router.put("/:id", auth, updateTask);
router.delete("/:id", auth, deleteTask);
router.post("/:id/submit", auth, upload.single("file"), submitTask);

module.exports = router;
