const mongoose = require("mongoose");

<<<<<<< HEAD
const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: {
    type: [String],
    required: true,
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length >= 2,
      message: "Each question needs at least 2 options",
    },
  },
  correctAnswerIndex: { type: Number, required: true },
  explanation: { type: String, default: "" },
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    category: { type: String, default: "General" },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
    },
    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "A quiz needs at least 1 question",
      },
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
=======
const quizSchema = new mongoose.Schema(
  {
    title: String,
    questions: [
      {
        question: String,
        options: [String],
        correctAnswer: Number, // index of correct option
      },
    ],
    points: { type: Number, default: 20 },
>>>>>>> 24e8a0340e41676e48680d1b7e928e58979821f4
  },
  { timestamps: true },
);

module.exports = mongoose.model("Quiz", quizSchema);
