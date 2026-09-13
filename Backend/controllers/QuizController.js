const Quiz = require("../models/Quiz");
<<<<<<< HEAD
const QuizAttempt = require("../models/Quizattempt");

// @desc    Create a new quiz
// @route   POST /api/quizzes
// @access  Admin
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, category, difficulty, questions } = req.body;

    if (!title || !questions || !questions.length) {
      return res
        .status(400)
        .json({ message: "Title and at least one question are required" });
    }

    const quiz = await Quiz.create({
      title,
      description,
      category,
      difficulty,
      questions,
      createdBy: req.user?._id,
    });

    res.status(201).json(quiz);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to create quiz", error: err.message });
  }
};

// @desc    Get all quizzes. Supports ?status=active|inactive
// @route   GET /api/quizzes
// @access  Public / Student / Admin
exports.getQuizzes = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const quizzes = await Quiz.find(filter)
      .select("-questions.correctAnswerIndex -questions.explanation")
      .sort({ createdAt: -1 });

    res.json(quizzes);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch quizzes", error: err.message });
  }
};

// @desc    Get a single quiz. Admin sees full data, ?mode=play hides answers
// @route   GET /api/quizzes/:id
// @access  Public / Student / Admin
exports.getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (req.query.mode === "play") {
      const sanitized = quiz.toObject();
      sanitized.questions = sanitized.questions.map(
        ({ _id, questionText, options }) => ({ _id, questionText, options }),
      );
      return res.json(sanitized);
    }

    res.json(quiz);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch quiz", error: err.message });
  }
};

// @desc    Update a quiz's fields or questions
// @route   PUT /api/quizzes/:id
// @access  Admin
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json(quiz);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update quiz", error: err.message });
  }
};

// @desc    Toggle a quiz between active/inactive
// @route   PATCH /api/quizzes/:id/status
// @access  Admin
exports.toggleQuizStatus = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    quiz.isActive = !quiz.isActive;
    await quiz.save();

    res.json(quiz);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to update status", error: err.message });
  }
};

// @desc    Delete a quiz
// @route   DELETE /api/quizzes/:id
// @access  Admin
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });
    res.json({ message: "Quiz deleted" });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to delete quiz", error: err.message });
  }
};

// @desc    Submit answers for a quiz and get scored
// @route   POST /api/quizzes/:id/submit
// @access  Student (logged in)
exports.submitQuiz = async (req, res) => {
  try {
    const { answers } = req.body; // array of selected option indices, in question order
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    if (!Array.isArray(answers) || answers.length !== quiz.questions.length) {
      return res
        .status(400)
        .json({ message: "Answers array must match the number of questions" });
    }

    let score = 0;
    quiz.questions.forEach((q, i) => {
      if (q.correctAnswerIndex === answers[i]) score += 1;
    });

    const attempt = await QuizAttempt.create({
      quiz: quiz._id,
      user: req.user?._id,
      answers,
      score,
      totalQuestions: quiz.questions.length,
    });

    res.status(201).json({
      score,
      totalQuestions: quiz.questions.length,
      attemptId: attempt._id,
    });
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to submit quiz", error: err.message });
  }
};

// @desc    Get the logged-in user's past quiz attempts
// @route   GET /api/quizzes/attempts/me
// @access  Student (logged in)
exports.getMyAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.user?._id })
      .populate("quiz", "title category difficulty")
      .sort({ createdAt: -1 });

    res.json(attempts);
  } catch (err) {
    res
      .status(500)
      .json({ message: "Failed to fetch attempts", error: err.message });
=======
const User = require("../models/User");

exports.getQuizzes = async (req, res) => {
  const quizzes = await Quiz.find().select("-questions.correctAnswer"); // hide answers
  res.json(quizzes);
};

exports.getQuizById = async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).select(
    "-questions.correctAnswer",
  );
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  res.json(quiz);
};

exports.submitQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    const { answers } = req.body; // array of selected option indices

    let correctCount = 0;
    quiz.questions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correctCount++;
    });

    const scorePercent = Math.round(
      (correctCount / quiz.questions.length) * 100,
    );
    const pointsEarned = Math.round((scorePercent / 100) * quiz.points);

    const user = await User.findById(req.user._id);
    user.points += pointsEarned;
    await user.save();

    res.json({
      correctCount,
      total: quiz.questions.length,
      scorePercent,
      pointsEarned,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
>>>>>>> 24e8a0340e41676e48680d1b7e928e58979821f4
  }
};
