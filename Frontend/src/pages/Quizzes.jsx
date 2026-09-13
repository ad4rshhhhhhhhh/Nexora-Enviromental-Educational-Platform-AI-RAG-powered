import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const Quizzes = () => {
  const { user } = useAuth();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizStartTime, setQuizStartTime] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [newQuiz, setNewQuiz] = useState({
    title: '',
    description: '',
    category: 'recycling',
    points: 25,
    timeLimit: 10,
    questions: [{ question: '', options: ['', ''], correctAnswer: 0, explanation: '' }]
  });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/quizzes');
      setQuizzes(response.data.data || []);
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const createData = {
        title: newQuiz.title.trim(),
        description: newQuiz.description.trim(),
        category: newQuiz.category,
        points: parseInt(newQuiz.points),
        timeLimit: parseInt(newQuiz.timeLimit),
        questions: newQuiz.questions.map(q => ({
          question: q.question.trim(),
          options: q.options.map(o => o.trim()).filter(o => o !== ''),
          correctAnswer: parseInt(q.correctAnswer),
          explanation: q.explanation ? q.explanation.trim() : ''
        }))
      };

      console.log('Creating quiz with data:', createData);
      const response = await axios.post('/api/quizzes', createData);
      console.log('Quiz created successfully:', response.data);
      setShowCreateModal(false);
      setNewQuiz({
        title: '',
        description: '',
        category: 'recycling',
        points: 25,
        timeLimit: 10,
        questions: [{ question: '', options: ['', ''], correctAnswer: 0, explanation: '' }]
      });
      fetchQuizzes(); // Refresh the list
    } catch (error) {
      console.error('Error creating quiz:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Error creating quiz. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditQuiz = (quiz) => {
    setEditingQuiz({
      ...quiz,
      questions: quiz.questions || [{ question: '', options: ['', ''], correctAnswer: 0, explanation: '' }]
    });
    setShowEditModal(true);
  };

  const handleUpdateQuiz = async (e) => {
    e.preventDefault();
    try {
      const updateData = {
        title: editingQuiz.title.trim(),
        description: editingQuiz.description.trim(),
        category: editingQuiz.category,
        points: parseInt(editingQuiz.points),
        timeLimit: parseInt(editingQuiz.timeLimit),
        questions: editingQuiz.questions.map(q => ({
          question: q.question.trim(),
          options: q.options.map(o => o.trim()).filter(o => o !== ''),
          correctAnswer: parseInt(q.correctAnswer),
          explanation: q.explanation ? q.explanation.trim() : ''
        }))
      };

      const response = await axios.put(`/api/quizzes/${editingQuiz._id}`, updateData);
      if (response.data.success) {
        setShowEditModal(false);
        setEditingQuiz(null);
        fetchQuizzes();
        alert('Quiz updated successfully!');
      }
    } catch (error) {
      console.error('Error updating quiz:', error);
      const errorMessage = error.response?.data?.message || 'Error updating quiz. Please try again.';
      const validationErrors = error.response?.data?.errors?.map(err => err.msg).join('\n');
      alert(`${errorMessage}\n${validationErrors || ''}`);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (window.confirm('Are you sure you want to delete this quiz?')) {
      try {
        await axios.delete(`/api/quizzes/${quizId}`);
        fetchQuizzes(); // Refresh the list
        alert('Quiz deleted successfully!');
      } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz. Please try again.');
      }
    }
  };

  const handleTakeQuiz = (quiz) => {
    setSelectedQuiz(quiz);
    setQuizAnswers({});
    setQuizStartTime(new Date());
    setShowQuizModal(true);
  };

  const handleQuizSubmit = async () => {
    try {
      // Convert answers object to array matching questions order
      const answersArray = selectedQuiz.questions.map((_, index) =>
        quizAnswers[index] !== undefined ? quizAnswers[index] : -1
      );

      console.log('Submitting quiz:', {
        quizId: selectedQuiz._id,
        answers: answersArray,
        timeTaken: Math.floor((Date.now() - quizStartTime) / 1000),
        studentId: user.id
      });

      const response = await axios.post(`/api/quizzes/${selectedQuiz._id}/attempt`, {
        answers: answersArray,
        timeTaken: Math.floor((Date.now() - quizStartTime) / 1000)
      });


      console.log('Quiz submission response:', response.data);

      if (response.data.success) {
        alert(`Quiz completed! Score: ${response.data.data.score}% | Points earned: ${response.data.data.pointsEarned}`);
        setShowQuizModal(false);
        setSelectedQuiz(null);
        setQuizAnswers({});
        setQuizStartTime(null);
        fetchQuizzes(); // Refresh the list
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Error submitting quiz. Please try again.';
      alert(errorMessage);
    }
  };

  const getQuizStatus = (quiz) => {
    if (!user || !quiz.attempts) return 'not-attempted';
    const userAttempt = quiz.attempts.find(attempt => attempt.student === user.id);
    return userAttempt ? 'completed' : 'not-attempted';
  };

  const hasUserCompletedQuiz = (quiz) => {
    if (!user || !quiz.attempts) return false;
    return quiz.attempts.some(attempt => attempt.student === user.id);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <span className="badge badge-success">Completed</span>;
      default:
        return <span className="badge badge-info">Not Attempted</span>;
    }
  };

  const filteredQuizzes = quizzes.filter(quiz => {
    if (filter === 'all') return true;
    if (filter === 'active') return quiz.isActive !== false;
    if (filter === 'inactive') return quiz.isActive === false;
    return true;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Quizzes Management</h1>
          <p className="dashboard-subtitle">
            Manage all environmental education quizzes
          </p>
        </div>

        {/* Filter Controls */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex gap-4 items-center">
              <label className="font-semibold">Filter:</label>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-select"
                style={{ width: 'auto' }}
              >
                <option value="all">All Quizzes</option>
                <option value="active">Active Quizzes</option>
                <option value="inactive">Inactive Quizzes</option>
              </select>
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <button
                  className="btn btn-primary ml-auto"
                  onClick={() => setShowCreateModal(true)}
                >
                  <span>➕</span> Create New Quiz
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        <div className="grid grid-3">
          {filteredQuizzes.length === 0 ? (
            <div className="col-span-3 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">🧠</div>
              <p className="text-gray-500 text-lg font-medium">No quizzes found.</p>
              <p className="text-gray-400">Quizzes will appear here once they are created.</p>
            </div>
          ) : (
            filteredQuizzes.map((quiz, index) => (
              <div key={quiz._id || `quiz-${index}`} className="card hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                <div className="card-header flex justify-between items-start gap-4">
                  <h3 className="font-bold text-lg leading-tight text-gray-800">{quiz.title || 'Untitled Quiz'}</h3>
                  <span className="badge badge-warning shrink-0 flex items-center gap-1">
                    <span>★</span> {quiz.points || 0}
                  </span>
                </div>

                <div className="card-body flex-grow">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className={`badge ${quiz.difficulty === 'easy' ? 'badge-success' :
                      quiz.difficulty === 'medium' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                      {quiz.difficulty || 'N/A'}
                    </span>
                    <span className="badge badge-info">{quiz.questions?.length || 0} questions</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {quiz.description || 'No description available.'}
                  </p>

                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                    <span>⏱️</span> {quiz.timeLimit || 10} minutes
                  </div>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto rounded-b-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500 font-medium">
                      Created: {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                      <span className={`text-xs font-bold ${quiz.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                        {quiz.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {user?.role === 'student' ? (
                      <div className="w-full">
                        {hasUserCompletedQuiz(quiz) ? (
                          <button className="btn btn-success w-full" disabled>
                            ✓ Completed
                          </button>
                        ) : (
                          <button
                            className="btn btn-primary w-full"
                            onClick={() => handleTakeQuiz(quiz)}
                          >
                            ▶ Take Quiz
                          </button>
                        )}
                      </div>
                    ) : (
                      (user?.role === 'admin' || user?.role === 'teacher') && (
                        <div className="flex gap-2 w-full">
                          <button
                            className="btn btn-secondary btn-sm flex-1"
                            onClick={() => handleEditQuiz(quiz)}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteQuiz(quiz._id)}
                            className="btn btn-danger btn-sm flex-1"
                          >
                            Delete
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Quiz Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Quiz</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateQuiz}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newQuiz.title}
                      onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newQuiz.description}
                      onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-control"
                      value={newQuiz.category}
                      onChange={(e) => setNewQuiz({ ...newQuiz, category: e.target.value })}
                      required
                    >
                      <option value="recycling">Recycling</option>
                      <option value="energy">Energy</option>
                      <option value="water">Water</option>
                      <option value="biodiversity">Biodiversity</option>
                      <option value="climate">Climate</option>
                      <option value="waste">Waste</option>
                      <option value="transport">Transport</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newQuiz.points}
                      onChange={(e) => setNewQuiz({ ...newQuiz, points: parseInt(e.target.value) })}
                      min="1"
                      max="50"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Limit (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={newQuiz.timeLimit}
                      onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: parseInt(e.target.value) })}
                      min="1"
                      max="60"
                      required
                    />
                  </div>
                  <div className="space-y-6">
                    {newQuiz.questions.map((question, qIndex) => (
                      <div key={qIndex} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Question {qIndex + 1}</h4>
                          {newQuiz.questions.length > 1 && (
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                const updatedQuestions = newQuiz.questions.filter((_, i) => i !== qIndex);
                                setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Question Text</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={question.question}
                            onChange={(e) => {
                              const updatedQuestions = [...newQuiz.questions];
                              updatedQuestions[qIndex].question = e.target.value;
                              setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                            }}
                            placeholder="Enter your question here..."
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>Option 1</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[0]}
                              onChange={(e) => {
                                const updatedQuestions = [...newQuiz.questions];
                                updatedQuestions[qIndex].options[0] = e.target.value;
                                setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                              }}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Option 2</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[1]}
                              onChange={(e) => {
                                const updatedQuestions = [...newQuiz.questions];
                                updatedQuestions[qIndex].options[1] = e.target.value;
                                setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                              }}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Option 3 (Optional)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[2] || ''}
                              onChange={(e) => {
                                const updatedQuestions = [...newQuiz.questions];
                                updatedQuestions[qIndex].options[2] = e.target.value;
                                setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label>Option 4 (Optional)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[3] || ''}
                              onChange={(e) => {
                                const updatedQuestions = [...newQuiz.questions];
                                updatedQuestions[qIndex].options[3] = e.target.value;
                                setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                              }}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Correct Answer</label>
                          <select
                            className="form-control"
                            value={question.correctAnswer}
                            onChange={(e) => {
                              const updatedQuestions = [...newQuiz.questions];
                              updatedQuestions[qIndex].correctAnswer = parseInt(e.target.value);
                              setNewQuiz({ ...newQuiz, questions: updatedQuestions });
                            }}
                            required
                          >
                            <option value={0}>Option 1</option>
                            <option value={1}>Option 2</option>
                            {question.options[2] && <option value={2}>Option 3</option>}
                            {question.options[3] && <option value={3}>Option 4</option>}
                          </select>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      onClick={() => {
                        setNewQuiz({
                          ...newQuiz,
                          questions: [
                            ...newQuiz.questions,
                            { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
                          ]
                        });
                      }}
                    >
                      + Add Another Question
                    </button>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Quiz
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quiz Taking Modal */}
        {showQuizModal && selectedQuiz && (
          <div className="modal-overlay" onClick={() => setShowQuizModal(false)}>
            <div className="modal-content quiz-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Quiz: {selectedQuiz.title}</h3>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Time Limit: {selectedQuiz.timeLimit} minutes
                  </span>
                  <button
                    className="modal-close"
                    onClick={() => setShowQuizModal(false)}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="modal-body">
                <p className="text-gray-600 mb-4">{selectedQuiz.description}</p>

                {selectedQuiz.questions && selectedQuiz.questions.map((question, qIndex) => (
                  <div key={qIndex} className="form-group">
                    <label className="font-semibold">
                      Question {qIndex + 1}: {question.question}
                    </label>
                    <div className="mt-2 space-y-2">
                      {question.options && question.options.map((option, oIndex) => (
                        <label key={oIndex} className="flex items-center">
                          <input
                            type="radio"
                            name={`question-${qIndex}`}
                            value={oIndex}
                            checked={quizAnswers[qIndex] === oIndex}
                            onChange={(e) => setQuizAnswers({
                              ...quizAnswers,
                              [qIndex]: parseInt(e.target.value)
                            })}
                            className="mr-2"
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowQuizModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleQuizSubmit}
                >
                  Submit Quiz
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Quiz Modal */}
        {showEditModal && editingQuiz && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Quiz</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateQuiz}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingQuiz.title}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editingQuiz.description}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-control"
                      value={editingQuiz.category}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, category: e.target.value })}
                    >
                      <option value="recycling">Recycling</option>
                      <option value="energy">Energy Conservation</option>
                      <option value="water">Water Conservation</option>
                      <option value="climate">Climate Action</option>
                      <option value="biodiversity">Biodiversity</option>
                    </select>
                  </div>
                  <div className="space-y-6">
                    {editingQuiz.questions.map((question, qIndex) => (
                      <div key={qIndex} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold">Question {qIndex + 1}</h4>
                          {editingQuiz.questions.length > 1 && (
                            <button
                              type="button"
                              className="text-red-500 hover:text-red-700"
                              onClick={() => {
                                const updatedQuestions = editingQuiz.questions.filter((_, i) => i !== qIndex);
                                setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                              }}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Question Text</label>
                          <textarea
                            className="form-control"
                            rows="2"
                            value={question.question}
                            onChange={(e) => {
                              const updatedQuestions = [...editingQuiz.questions];
                              updatedQuestions[qIndex].question = e.target.value;
                              setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                            }}
                            placeholder="Enter your question here..."
                            required
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="form-group">
                            <label>Option 1</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[0]}
                              onChange={(e) => {
                                const updatedQuestions = [...editingQuiz.questions];
                                updatedQuestions[qIndex].options[0] = e.target.value;
                                setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                              }}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Option 2</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[1]}
                              onChange={(e) => {
                                const updatedQuestions = [...editingQuiz.questions];
                                updatedQuestions[qIndex].options[1] = e.target.value;
                                setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                              }}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>Option 3 (Optional)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[2] || ''}
                              onChange={(e) => {
                                const updatedQuestions = [...editingQuiz.questions];
                                updatedQuestions[qIndex].options[2] = e.target.value;
                                setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                              }}
                            />
                          </div>
                          <div className="form-group">
                            <label>Option 4 (Optional)</label>
                            <input
                              type="text"
                              className="form-control"
                              value={question.options[3] || ''}
                              onChange={(e) => {
                                const updatedQuestions = [...editingQuiz.questions];
                                updatedQuestions[qIndex].options[3] = e.target.value;
                                setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                              }}
                            />
                          </div>
                        </div>
                        <div className="form-group">
                          <label>Correct Answer</label>
                          <select
                            className="form-control"
                            value={question.correctAnswer}
                            onChange={(e) => {
                              const updatedQuestions = [...editingQuiz.questions];
                              updatedQuestions[qIndex].correctAnswer = parseInt(e.target.value);
                              setEditingQuiz({ ...editingQuiz, questions: updatedQuestions });
                            }}
                            required
                          >
                            <option value={0}>Option 1</option>
                            <option value={1}>Option 2</option>
                            {question.options[2] && <option value={2}>Option 3</option>}
                            {question.options[3] && <option value={3}>Option 4</option>}
                          </select>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary w-full"
                      onClick={() => {
                        setEditingQuiz({
                          ...editingQuiz,
                          questions: [
                            ...editingQuiz.questions,
                            { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
                          ]
                        });
                      }}
                    >
                      + Add Another Question
                    </button>
                  </div>
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="50"
                      value={editingQuiz.points}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, points: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Time Limit (minutes)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="60"
                      value={editingQuiz.timeLimit}
                      onChange={(e) => setEditingQuiz({ ...editingQuiz, timeLimit: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowEditModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Update Quiz
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Quizzes;
