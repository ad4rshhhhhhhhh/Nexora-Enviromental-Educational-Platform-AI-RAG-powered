import React, { useState, useEffect } from "react";
import axios from "../config/axios";
import { useAuth } from "../contexts/AuthContext";

const Games = () => {
  const { user, updateUser } = useAuth();
  const [activeGame, setActiveGame] = useState(null); // 'trivia', 'word', 'unscramble'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get("/api/users/leaderboard");
      if (response.data.success) {
        setLeaderboard(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
    } finally {
      setLoadingLeaderboard(false);
    }
  };

  const handleStartGame = async (gameType) => {
    console.log("Attempting to start game:", gameType);
    console.log("Current User Context:", user);

    if (!user) {
      alert("Please log in to play.");
      return;
    }

    const userIdToSend = user.id || user._id;
    console.log("Sending User ID:", userIdToSend);

    try {
      const response = await axios.post("/api/games/start", {
        gameType,
        userId: userIdToSend,
      });

      console.log("Start Game Response:", response.data);

      if (response.data.success) {
        // Streak logic removed per user request
        setActiveGame(gameType);
      }
    } catch (error) {
      console.error("Full Error Object:", error);
      if (error.response) {
        console.error("Error Response Data:", error.response.data);
        console.error("Error Response Status:", error.response.status);

        if (error.response.status === 403) {
          alert(error.response.data.message);
        } else if (error.response.status === 404) {
          alert("User session invalid. Please log out and log in again.");
        } else {
          alert(
            `Failed to start game: ${error.response.data.message || "Unknown error"}`,
          );
        }
      } else {
        console.error("Error starting game:", error);
        alert("Failed to start game. Network error or server down.");
      }
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🎮 Eco Arcade</h1>
          <p className="dashboard-subtitle">
            Play, learn, and earn points for a greener planet!
          </p>
          {user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-4 py-2 rounded-full font-bold shadow-sm animate-bounce">
              <span>🔥 Daily Streak: {user.streak || 0} Days</span>
            </div>
          )}
        </div>

        {activeGame ? (
          <div className="max-w-4xl mx-auto">
            <button
              className="btn btn-secondary mb-6 hover:scale-105 transition-transform"
              onClick={() => {
                setActiveGame(null);
                fetchLeaderboard(); // Refresh leaderboard on return
              }}
            >
              ← Back to Arcade
            </button>

            <div className="transform transition-all duration-500 ease-in-out">
              {activeGame === "trivia" && <AITriviaGame />}
              {activeGame === "word" && <CompleteWordGame />}
              {activeGame === "unscramble" && <UnscrambleGame />}
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Trivia Card */}
              <div
                className="card group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-400 transform hover:-translate-y-2"
                onClick={() => handleStartGame("trivia")}
              >
                <div className="card-body text-center p-8">
                  <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    ❓
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">
                    Eco Trivia
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Challenge your knowledge with AI-generated questions about
                    our planet.
                  </p>
                  <button className="btn btn-primary w-full rounded-full shadow-lg group-hover:shadow-blue-500/50">
                    Play Now
                  </button>
                </div>
              </div>

              {/* Word Completion Card */}
              <div
                className="card group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-400 transform hover:-translate-y-2"
                onClick={() => handleStartGame("word")}
              >
                <div className="card-body text-center p-8">
                  <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    📝
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">
                    Complete the Word
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Guess the missing letters to reveal key environmental terms.
                  </p>
                  <button className="btn btn-success w-full rounded-full shadow-lg group-hover:shadow-green-500/50">
                    Play Now
                  </button>
                </div>
              </div>

              {/* Unscramble Card */}
              <div
                className="card group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-400 transform hover:-translate-y-2"
                onClick={() => handleStartGame("unscramble")}
              >
                <div className="card-body text-center p-8">
                  <div className="text-7xl mb-6 transform group-hover:scale-110 transition-transform duration-300">
                    🔤
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-800">
                    Word Unscramble
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    Rearrange the jumbled letters to find the hidden eco-words.
                  </p>
                  <button
                    className="btn btn-info w-full rounded-full shadow-lg group-hover:shadow-purple-500/50"
                    style={{
                      background:
                        "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
                    }}
                  >
                    Play Now
                  </button>
                </div>
              </div>
            </div>

            {/* Leaderboard Section */}
            <div className="card max-w-4xl mx-auto border-t-4 border-orange-500">
              <div className="card-header flex justify-between items-center">
                <h3 className="card-title text-2xl">🔥 Top Streaks</h3>
                <span className="text-sm text-gray-500">Updated Real-time</span>
              </div>
              <div className="card-body p-0">
                {loadingLeaderboard ? (
                  <div className="p-8 text-center text-gray-500">
                    Loading leaderboard...
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-bold tracking-wider">
                        <tr>
                          <th className="p-4">Rank</th>
                          <th className="p-4">Student</th>
                          <th className="p-4 text-center">Streak</th>
                          <th className="p-4 text-right">Total Points</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {leaderboard.map((student, index) => (
                          <tr
                            key={student.id || student._id}
                            className={`hover:bg-orange-50 transition-colors ${(student.id || student._id) === (user.id || user._id) ? "bg-blue-50" : ""}`}
                          >
                            <td className="p-4 font-bold text-gray-500">
                              {index === 0
                                ? "🥇"
                                : index === 1
                                  ? "🥈"
                                  : index === 2
                                    ? "🥉"
                                    : `#${index + 1}`}
                            </td>
                            <td className="p-4 font-semibold text-gray-800">
                              {student.name}{" "}
                              {(student.id || student._id) ===
                                (user.id || user._id) && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-100 text-orange-800 font-bold text-sm">
                                {student.streak} Days 🔥
                              </span>
                            </td>
                            <td className="p-4 text-right font-mono font-medium text-gray-600">
                              {student.points} pts
                            </td>
                          </tr>
                        ))}
                        {leaderboard.length === 0 && (
                          <tr>
                            <td
                              colSpan="4"
                              className="p-8 text-center text-gray-500"
                            >
                              No streaks yet. Be the first!
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const CompleteWordGame = () => {
  const words = [
    {
      word: "SUSTAINABILITY",
      hint: "Meeting needs without compromising future generations",
      masked: "S_ST_IN_B_LITY",
    },
    {
      word: "ECOSYSTEM",
      hint: "Community of living organisms",
      masked: "EC_SY_T_M",
    },
    {
      word: "POLLUTION",
      hint: "Introduction of harmful materials into the environment",
      masked: "P_LL_T_ON",
    },
    {
      word: "BIODIVERSITY",
      hint: "Variety of life on Earth",
      masked: "B_OD_V_RS_TY",
    },
    {
      word: "CONSERVATION",
      hint: "Protection of natural resources",
      masked: "C_NS_RV_T_ON",
    },
  ];

  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const { updateUser } = useAuth();

  const currentWord = words[currentWordIndex];

  const checkAnswer = () => {
    if (input.toUpperCase() === currentWord.word) {
      setMessage("Correct! 🎉");
      setTimeout(async () => {
        if (currentWordIndex < words.length - 1) {
          setCurrentWordIndex(currentWordIndex + 1);
          setInput("");
          setMessage("");
        } else {
          setMessage("All words completed! 🏆 +5 Points!");
          try {
            const response = await axios.put("/api/users/add-points", {
              points: 5,
            });
            if (response.data.success) {
              updateUser(response.data.data);
            }
          } catch (error) {
            console.error("Error adding points:", error);
          }
        }
      }, 1500);
    } else {
      setMessage("Try Again! ❌");
    }
  };

  return (
    <div className="card max-w-2xl mx-auto border-t-4 border-green-500 shadow-xl">
      <div className="card-body text-center p-10">
        <div className="mb-8">
          <span className="badge badge-success mb-4 text-sm px-4 py-2">
            Word {currentWordIndex + 1} of {words.length}
          </span>
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Complete the Word
          </h2>
          <p className="text-gray-500">Fill in the missing letters</p>
        </div>

        <div className="bg-green-50 rounded-2xl p-8 mb-8 border border-green-100">
          <p className="text-green-800 font-medium mb-4 text-lg italic">
            "{currentWord.hint}"
          </p>
          <div className="text-4xl md:text-5xl font-mono tracking-[0.2em] font-bold text-green-600 break-all">
            {currentWord.masked}
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <input
            type="text"
            className="form-control text-center text-2xl uppercase py-4 font-bold tracking-widest border-2 focus:border-green-500 focus:ring-green-200"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="TYPE FULL WORD"
            onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
          />
          <button
            className="btn btn-success w-full text-lg py-4 rounded-xl shadow-lg hover:shadow-green-500/30 transform hover:-translate-y-1 transition-all"
            onClick={checkAnswer}
          >
            Check Answer
          </button>
        </div>

        {message && (
          <div
            className={`mt-6 p-4 rounded-xl text-lg font-bold animate-bounce ${message.includes("Correct") || message.includes("Completed") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

const UnscrambleGame = () => {
  const words = [
    {
      scrambled: "ELCCYRE",
      answer: "RECYCLE",
      hint: "Process of converting waste into new materials",
    },
    {
      scrambled: "ENREGY",
      answer: "ENERGY",
      hint: "Power derived from physical or chemical resources",
    },
    { scrambled: "WTARE", answer: "WATER", hint: "Essential liquid for life" },
    {
      scrambled: "PALSTIC",
      answer: "PLASTIC",
      hint: "Synthetic material made from polymers",
    },
    {
      scrambled: "CMLIATE",
      answer: "CLIMATE",
      hint: "Long-term weather patterns",
    },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState("");
  const [message, setMessage] = useState("");
  const { updateUser } = useAuth();

  const currentWord = words[currentIndex];

  const checkAnswer = () => {
    if (input.toUpperCase() === currentWord.answer) {
      setMessage("Correct! 🎉");
      setTimeout(async () => {
        if (currentIndex < words.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setInput("");
          setMessage("");
        } else {
          setMessage("You unscrambled all words! 🏆 +5 Points!");
          try {
            const response = await axios.put("/api/users/add-points", {
              points: 5,
            });
            if (response.data.success) {
              const userResponse = await axios.get("/api/auth/me");
              if (userResponse.data.success) {
                updateUser(userResponse.data.data.user);
              }
            }
          } catch (error) {
            console.error("Error adding points:", error);
          }
        }
      }, 1500);
    } else {
      setMessage("Try Again! ❌");
    }
  };

  return (
    <div className="card max-w-2xl mx-auto border-t-4 border-purple-500 shadow-xl">
      <div className="card-body text-center p-10">
        <div className="mb-8">
          <span
            className="badge badge-info mb-4 text-sm px-4 py-2"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            }}
          >
            Word {currentIndex + 1} of {words.length}
          </span>
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            Unscramble the Words
          </h2>
          <p className="text-gray-500">
            Rearrange the letters to form the correct word
          </p>
        </div>

        <div className="bg-purple-50 rounded-2xl p-8 mb-8 border border-purple-100">
          <p className="text-purple-800 font-medium mb-4 text-lg italic">
            "{currentWord.hint}"
          </p>
          <div className="text-4xl md:text-5xl font-mono tracking-[0.2em] font-bold text-purple-600 break-all">
            {currentWord.scrambled}
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-4">
          <input
            type="text"
            className="form-control text-center text-2xl uppercase py-4 font-bold tracking-widest border-2 focus:border-purple-500 focus:ring-purple-200"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="TYPE ANSWER"
            onKeyPress={(e) => e.key === "Enter" && checkAnswer()}
          />
          <button
            className="btn btn-primary w-full text-lg py-4 rounded-xl shadow-lg hover:shadow-purple-500/30 transform hover:-translate-y-1 transition-all"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
            }}
            onClick={checkAnswer}
          >
            Check Answer
          </button>
        </div>

        {message && (
          <div
            className={`mt-6 p-4 rounded-xl text-lg font-bold animate-bounce ${message.includes("Correct") || message.includes("unscrambled") ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

const AITriviaGame = () => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [result, setResult] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const { updateUser } = useAuth();

  const fetchQuestions = async () => {
    setLoading(true);
    setQuestions([]);
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameOver(false);
    setSelectedOption(null);
    setResult(null);
    try {
      const response = await axios.post("/api/games/trivia");
      if (response.data.success) {
        const data = response.data.data;
        if (Array.isArray(data)) {
          setQuestions(data);
        } else {
          setQuestions([data]);
        }
      }
    } catch (error) {
      console.error("Error fetching trivia:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = async (index) => {
    if (selectedOption !== null) return;
    setSelectedOption(index);

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = index === currentQuestion.correctAnswer;

    if (isCorrect) {
      setResult({ correct: true, message: "Correct! 🎉" });
      setScore((prev) => prev + 1);
    } else {
      setResult({
        correct: false,
        message: `Incorrect. The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswer]}`,
      });
    }
  };

  const handleNextQuestion = async () => {
    setSelectedOption(null);
    setResult(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      finishGame();
    }
  };

  const finishGame = async () => {
    setGameOver(true);
    const pointsEarned = score * 10;
    if (pointsEarned > 0) {
      try {
        const response = await axios.put("/api/users/add-points", {
          points: pointsEarned,
        });
        if (response.data.success) {
          updateUser(response.data.data);
        }
      } catch (error) {
        console.error("Error adding points:", error);
      }
    }
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="card max-w-3xl mx-auto border-t-4 border-blue-500 shadow-xl">
      <div className="card-body p-8 md:p-12">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2 text-gray-800">
            AI Environmental Trivia 🤖
          </h2>
          <p className="text-gray-500">Test your eco-knowledge!</p>
        </div>

        {!questions.length && !loading && !gameOver && (
          <div className="text-center py-12 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200">
            <div className="text-6xl mb-6">🧠</div>
            <p className="mb-8 text-xl text-gray-700 font-medium">
              Ready to challenge yourself with 10 AI-generated questions?
            </p>
            <button
              className="btn btn-primary btn-lg rounded-full px-10 shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all"
              onClick={fetchQuestions}
            >
              Start Trivia Challenge
            </button>
          </div>
        )}

        {loading && (
          <div className="py-20 text-center">
            <div className="spinner mx-auto w-16 h-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
            <h3 className="text-xl font-bold text-gray-800">
              Generating Questions...
            </h3>
            <p className="mt-2 text-gray-500">
              Our AI is crafting unique questions for you.
            </p>
          </div>
        )}

        {!loading && !gameOver && questions.length > 0 && currentQuestion && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-8 bg-gray-50 p-4 rounded-xl">
              <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Question {currentQuestionIndex + 1} / {questions.length}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-bold text-blue-600">{score}</span>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-800 leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-8">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`w-full p-6 text-left rounded-xl border-2 transition-all duration-200 relative overflow-hidden group ${
                    selectedOption === index
                      ? index === currentQuestion.correctAnswer
                        ? "bg-green-50 border-green-500 shadow-green-100"
                        : "bg-red-50 border-red-500 shadow-red-100"
                      : selectedOption !== null &&
                          index === currentQuestion.correctAnswer
                        ? "bg-green-50 border-green-500 shadow-green-100"
                        : "bg-white border-gray-200 hover:border-blue-400 hover:shadow-md"
                  }`}
                  onClick={() => handleOptionSelect(index)}
                  disabled={selectedOption !== null}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <span
                      className={`text-lg font-medium ${selectedOption === index ? "font-bold" : ""}`}
                    >
                      {option}
                    </span>
                    {selectedOption === index && (
                      <span className="text-2xl">
                        {index === currentQuestion.correctAnswer ? "✅" : "❌"}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {result && (
              <div
                className={`p-6 rounded-xl mb-8 animate-slideUp ${result.correct ? "bg-green-100 text-green-800 border border-green-200" : "bg-red-100 text-red-800 border border-red-200"}`}
              >
                <p className="font-bold text-lg mb-1">{result.message}</p>
                {!result.correct && (
                  <p className="text-md opacity-90">
                    {currentQuestion.explanation}
                  </p>
                )}
              </div>
            )}

            {result && (
              <button
                className="btn btn-primary w-full py-4 text-lg rounded-xl shadow-lg hover:shadow-blue-500/30"
                onClick={handleNextQuestion}
              >
                {currentQuestionIndex < questions.length - 1
                  ? "Next Question →"
                  : "Finish Game 🏆"}
              </button>
            )}
          </div>
        )}

        {gameOver && (
          <div className="text-center py-12 animate-fadeIn">
            <div className="text-8xl mb-6">🏆</div>
            <h3 className="text-4xl font-bold mb-4 text-gray-800">
              Game Over!
            </h3>
            <div className="bg-blue-50 rounded-2xl p-8 mb-8 inline-block w-full max-w-md">
              <p className="text-gray-600 mb-2 uppercase tracking-wide font-bold text-sm">
                Final Score
              </p>
              <p className="text-5xl font-black text-blue-600 mb-4">
                {score}{" "}
                <span className="text-2xl text-gray-400 font-normal">
                  / {questions.length}
                </span>
              </p>
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${(score / questions.length) * 100}%` }}
                ></div>
              </div>
            </div>
            <p className="text-green-600 font-bold text-xl mb-8 flex items-center justify-center gap-2">
              <span>+{score * 10} Points Earned!</span>
            </p>
            <button
              className="btn btn-primary btn-lg rounded-full px-12 shadow-xl"
              onClick={fetchQuestions}
            >
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Games;
