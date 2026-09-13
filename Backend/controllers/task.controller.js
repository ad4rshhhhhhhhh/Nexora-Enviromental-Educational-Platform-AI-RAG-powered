const Task = require("../models/task.model");

// GET /api/tasks
exports.getTasks = async (req, res) => {
  try {
    const tasks = await Task.find()
      .populate("createdBy", "name")
      .populate("submissions.student", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching tasks",
      error: error.message,
    });
  }
};

// POST /api/tasks
exports.createTask = async (req, res) => {
  try {
    const { title, description, category, points, difficulty, dueDate } =
      req.body;

    const task = new Task({
      title,
      description,
      category,
      points,
      difficulty,
      dueDate,
      createdBy: req.user.id,
      resourceFile: req.file
        ? {
            path: req.file.path.replace(/\\/g, "/"),
            originalName: req.file.originalname,
          }
        : undefined,
    });

    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error creating task",
      error: error.message,
    });
  }
};

// PUT /api/tasks/:id
exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error updating task",
      error: error.message,
    });
  }
};

// DELETE /api/tasks/:id
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    res.json({ success: true, message: "Task deleted" });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting task",
      error: error.message,
    });
  }
};

// POST /api/tasks/:id/submit
exports.submitTask = async (req, res) => {
  try {
    const { description, studentId } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task)
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });

    const existing = task.submissions.find(
      (s) => s.student.toString() === studentId,
    );
    if (existing) {
      existing.description = description;
      existing.status = "pending";
      existing.submittedAt = new Date();
      if (req.file) {
        existing.file = {
          path: req.file.path.replace(/\\/g, "/"),
          originalName: req.file.originalname,
        };
      }
    } else {
      task.submissions.push({
        student: studentId,
        description,
        file: req.file
          ? {
              path: req.file.path.replace(/\\/g, "/"),
              originalName: req.file.originalname,
            }
          : undefined,
      });
    }

    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Error submitting task",
      error: error.message,
    });
  }
};
