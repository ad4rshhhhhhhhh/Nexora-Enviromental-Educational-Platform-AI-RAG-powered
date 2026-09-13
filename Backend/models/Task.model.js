const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  description: { type: String, required: true, minlength: 3 },
  file: {
    path: String,
    originalName: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
  submittedAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "recycling",
        "energy",
        "water",
        "biodiversity",
        "climate",
        "waste",
        "transport",
        "other",
      ],
      default: "other",
    },
    points: { type: Number, required: true, min: 1, max: 100 },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    dueDate: { type: Date, required: true },
    resourceFile: {
      path: String,
      originalName: String,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    submissions: [submissionSchema],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Task", taskSchema);
