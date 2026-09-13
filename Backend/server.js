require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/admin.routes");
const chatRoutes = require("./routes/chat");
const taskRoutes = require("./routes/task.routes");
const quizRoutes = require("./routes/QuizRoutes");

/**const taskRoutes = require("./routes/task.routes");
const quizRoutes = require("./routes/quiz.routes");
const learningRoutes = require("./routes/learning.routes");
const gameRoutes = require("./routes/game.routes");
const leaderboardRoutes = require("./routes/leaderboard.routes");
const userRoutes = require("./routes/user.routes");*/

const app = express();

// middlewares
app.use(cors());
app.use(express.json()); // JSON body parse karne ke liye

// database connect karo
connectDB();

// routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/quizzes", quizRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
