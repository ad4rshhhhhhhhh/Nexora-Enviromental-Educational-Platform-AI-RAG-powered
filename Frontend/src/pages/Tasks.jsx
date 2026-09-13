import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/constants';

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [submissionData, setSubmissionData] = useState({ description: '', file: null });
  const [newTask, setNewTask] = useState({ title: '', description: '', category: 'recycling', points: 10, difficulty: 'easy', dueDate: '' });

  const location = useLocation();

  useEffect(() => {
    fetchTasks();
  }, []);

  // Check for deep link from dashboard
  useEffect(() => {
    if (location.state?.taskId && tasks.length > 0) {
      const taskToAttempt = tasks.find(t => t._id === location.state.taskId || t.id === location.state.taskId);
      if (taskToAttempt) {
        handleSubmitTask(taskToAttempt);
        // Clear state to prevent reopening on refresh (optional, but React Router handles this by default on new nav)
        window.history.replaceState({}, document.title);
      }
    }
  }, [tasks, location.state]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/tasks');
      setTasks(response.data.data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('title', newTask.title);
      formData.append('description', newTask.description);
      formData.append('category', newTask.category);
      formData.append('points', newTask.points);
      formData.append('difficulty', newTask.difficulty);
      formData.append('dueDate', newTask.dueDate);

      if (newTask.resourceFile) {
        formData.append('resourceFile', newTask.resourceFile);
      }

      console.log('Creating task with data:', newTask);
      const response = await axios.post('/api/tasks', formData);
      console.log('Task created successfully:', response.data);
      setShowCreateModal(false);
      setNewTask({ title: '', description: '', category: 'recycling', points: 10, difficulty: 'easy', dueDate: '', resourceFile: null });
      fetchTasks(); // Refresh the list
    } catch (error) {
      console.error('Error creating task:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || error.response?.data?.errors?.[0]?.msg || 'Error creating task. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask({
      ...task,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const handleUpdateTask = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/tasks/${editingTask._id}`, editingTask);
      if (response.data.success) {
        setShowEditModal(false);
        setEditingTask(null);
        fetchTasks();
        alert('Task updated successfully!');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      const errorMessage = error.response?.data?.message || 'Error updating task. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await axios.delete(`/api/tasks/${taskId}`);
        fetchTasks(); // Refresh the list
        alert('Task deleted successfully!');
      } catch (error) {
        console.error('Error deleting task:', error);
        const errorMessage = error.response?.data?.message || 'Error deleting task. Please try again.';
        alert(errorMessage);
      }
    }
  };

  const handleSubmitTask = async (task) => {
    setSelectedTask(task);
    setShowSubmissionModal(true);
  };

  const handleSubmissionSubmit = async (e) => {
    e.preventDefault();
    try {
      const taskId = selectedTask._id || selectedTask.id;
      if (!taskId) {
        throw new Error('Task ID is missing. Please refresh the page and try again.');
      }

      const formData = new FormData();
      formData.append('description', taskDescription);
      formData.append('studentId', user.id);

      if (submissionData.file) {
        formData.append('file', submissionData.file);
      }

      const response = await axios.post(`/api/tasks/${taskId}/submit`, formData);

      console.log('Task submission response:', response.data);

      if (response.data.success) {
        alert('Task submitted successfully! It will be reviewed by a teacher.');
        setShowSubmissionModal(false);
        setTaskDescription('');
        setSubmissionData({ description: '', file: null });
        setSelectedTask(null);
        fetchTasks(); // Refresh the list
      }
    } catch (error) {
      console.error('Error submitting task:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.errors?.[0]?.msg || error.response?.data?.message || 'Error submitting task. Please try again.';
      alert(errorMessage);
    }
  };

  const getTaskStatus = (task) => {
    if (!user || !task.submissions) return 'not-started';
    const userSubmission = task.submissions.find(sub =>
      (sub.student._id || sub.student).toString() === user.id.toString()
    );
    if (userSubmission) {
      return userSubmission.status; // 'pending', 'approved', 'rejected'
    }
    return 'not-started';
  };

  const hasUserSubmittedTask = (task) => {
    if (!user || !task.submissions) return false;
    return task.submissions.some(sub =>
      (sub.student._id || sub.student).toString() === user.id.toString()
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Completed</span>;
      case 'pending':
        return <span className="badge badge-warning">Pending Review</span>;
      case 'rejected':
        return <span className="badge badge-danger">Rejected</span>;
      default:
        return <span className="badge badge-info">Not Started</span>;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'active') return task.isActive !== false;
    if (filter === 'inactive') return task.isActive === false;
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
          <h1 className="dashboard-title">Tasks Management</h1>
          <p className="dashboard-subtitle">
            Manage all environmental education tasks
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
                <option value="all">All Tasks</option>
                <option value="active">Active Tasks</option>
                <option value="inactive">Inactive Tasks</option>
              </select>
              {(user?.role === 'admin' || user?.role === 'teacher') && (
                <button
                  className="btn btn-primary ml-auto"
                  onClick={() => setShowCreateModal(true)}
                >
                  <span>➕</span> Create New Task
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="grid grid-3">
          {filteredTasks.length === 0 ? (
            <div className="col-span-3 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-gray-500 text-lg font-medium">No tasks found.</p>
              <p className="text-gray-400">Tasks will appear here once they are created.</p>
            </div>
          ) : (
            filteredTasks.map((task, index) => (
              <div key={task._id || `task-${index}`} className="card hover:shadow-lg transition-all duration-300 flex flex-col h-full">
                <div className="card-header flex justify-between items-start gap-4">
                  <h3 className="font-bold text-lg leading-tight text-gray-800">{task.title || 'Untitled Task'}</h3>
                  <span className="badge badge-warning shrink-0 flex items-center gap-1">
                    <span>★</span> {task.points || 0}
                  </span>
                </div>

                <div className="card-body flex-grow">
                  <div className="flex gap-2 mb-3 flex-wrap">
                    <span className={`badge ${task.difficulty === 'easy' ? 'badge-success' :
                      task.difficulty === 'medium' ? 'badge-warning' :
                        'badge-danger'
                      }`}>
                      {task.difficulty || 'N/A'}
                    </span>
                    <span className="badge badge-info capitalize">{task.category || 'General'}</span>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {task.description || 'No description available.'}
                  </p>

                  {task.resourceFile && (
                    <a
                      href={`${API_BASE_URL}/${task.resourceFile.path}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 mb-4"
                    >
                      <span>📎</span> Download Resource
                    </a>
                  )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 mt-auto rounded-b-lg">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs text-gray-500 font-medium">
                      Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                    </span>
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                      <span className={`text-xs font-bold ${task.isActive !== false ? 'text-green-600' : 'text-red-600'}`}>
                        {task.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {user?.role === 'student' ? (
                      <div className="w-full">
                        {(() => {
                          const status = getTaskStatus(task);
                          if (status === 'approved') {
                            return (
                              <button className="btn btn-success w-full" disabled>
                                ✓ Completed
                              </button>
                            );
                          } else if (status === 'pending') {
                            return (
                              <button className="btn btn-warning w-full" disabled>
                                ⏳ Pending Review
                              </button>
                            );
                          } else if (status === 'rejected') {
                            return (
                              <button
                                className="btn btn-primary w-full"
                                onClick={() => handleSubmitTask(task)}
                              >
                                ↻ Resubmit
                              </button>
                            );
                          } else {
                            return (
                              <button
                                className="btn btn-primary w-full"
                                onClick={() => handleSubmitTask(task)}
                              >
                                ▶ Start Task
                              </button>
                            );
                          }
                        })()}
                      </div>
                    ) : (
                      (user?.role === 'admin' || (user?.role === 'teacher' && task.createdBy?._id === user.id)) && (
                        <div className="flex gap-2 w-full">
                          <button
                            className="btn btn-secondary btn-sm flex-1"
                            onClick={() => handleEditTask(task)}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task._id)}
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

        {/* Create Task Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Create New Task</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateTask}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={newTask.description}
                      onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-control"
                      value={newTask.category}
                      onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
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
                      value={newTask.points}
                      onChange={(e) => setNewTask({ ...newTask, points: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      className="form-control"
                      value={newTask.difficulty}
                      onChange={(e) => setNewTask({ ...newTask, difficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={newTask.dueDate}
                      onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Resource File (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      onChange={(e) => setNewTask({ ...newTask, resourceFile: e.target.files[0] })}
                    />
                    <small className="text-gray-500">Upload PDF notes or questions</small>
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
                    Create Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Task Submission Modal */}
        {showSubmissionModal && selectedTask && (
          <div className="modal-overlay" onClick={() => setShowSubmissionModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Submit Task: {selectedTask.title}</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowSubmissionModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleSubmissionSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Task Description</label>
                    <p className="text-gray-600">{selectedTask.description}</p>
                  </div>
                  <div className="form-group">
                    <label>Your Submission Description</label>
                    <textarea
                      className="form-control"
                      rows="4"
                      placeholder="Describe what you did to complete this task..."
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      required
                      minLength="3"
                    />
                    <small className="text-gray-500">Minimum 3 characters</small>
                  </div>
                  <div className="form-group">
                    <label>Upload File (Optional)</label>
                    <input
                      type="file"
                      className="form-control"
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => setSubmissionData({ ...submissionData, file: e.target.files[0] })}
                    />
                    <small className="text-gray-500">Upload photos, documents, or other proof of completion</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowSubmissionModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Task Modal */}
        {showEditModal && editingTask && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Edit Task</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowEditModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleUpdateTask}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingTask.title}
                      onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={editingTask.description}
                      onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      className="form-control"
                      value={editingTask.category}
                      onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value })}
                    >
                      <option value="recycling">Recycling</option>
                      <option value="energy">Energy Conservation</option>
                      <option value="water">Water Conservation</option>
                      <option value="climate">Climate Action</option>
                      <option value="biodiversity">Biodiversity</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="100"
                      value={editingTask.points}
                      onChange={(e) => setEditingTask({ ...editingTask, points: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Difficulty</label>
                    <select
                      className="form-control"
                      value={editingTask.difficulty}
                      onChange={(e) => setEditingTask({ ...editingTask, difficulty: e.target.value })}
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Due Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={editingTask.dueDate}
                      onChange={(e) => setEditingTask({ ...editingTask, dueDate: e.target.value })}
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
                    Update Task
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

export default Tasks;
