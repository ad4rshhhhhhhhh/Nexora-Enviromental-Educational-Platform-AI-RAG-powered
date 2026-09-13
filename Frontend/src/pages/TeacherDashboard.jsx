import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/constants';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalStudents: 0,
    pendingSubmissions: 0,
    totalApprovedSubmissions: 0,
    totalQuizzes: 0,
    studentProgress: []
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch tasks
      const tasksResponse = await axios.get('/api/tasks/my-tasks');
      const tasks = tasksResponse.data.data;

      // Fetch students
      const studentsResponse = await axios.get('/api/users/students');
      const students = studentsResponse.data.data;

      // Calculate stats
      const totalTasks = tasks.length;
      const totalStudents = students.length;
      const pendingSubmissions = tasks.reduce((count, task) =>
        count + task.submissions.filter(sub => sub.status === 'pending').length, 0
      );
      const totalApprovedSubmissions = tasks.reduce((count, task) =>
        count + task.submissions.filter(sub => sub.status === 'approved').length, 0
      );

      // Calculate student progress
      const studentProgress = students.map(student => {
        const studentId = student.id || student._id;
        const tasksDone = tasks.reduce((count, task) => {
          if (!task.submissions) return count;
          return count + (task.submissions.some(sub => {
            const subStudentId = sub.student?._id || sub.student?.id || sub.student;
            return subStudentId.toString() === studentId.toString() && sub.status === 'approved';
          }) ? 1 : 0);
        }, 0);

        return {
          id: studentId,
          name: student.name,
          points: student.points,
          tasksDone
        };
      }).sort((a, b) => b.points - a.points); // Sort by points

      // Fetch quizzes
      const quizzesResponse = await axios.get('/api/quizzes/my-quizzes');
      const quizzes = quizzesResponse.data.data;

      setStats({
        totalTasks,
        totalStudents,
        pendingSubmissions,
        totalApprovedSubmissions,
        totalQuizzes: quizzes.length,
        studentProgress
      });

      setRecentTasks(tasks.slice(0, 5));

      // Get all pending submissions
      const allPendingSubmissions = [];
      tasks.forEach(task => {
        task.submissions
          .filter(sub => sub.status === 'pending')
          .forEach(sub => {
            allPendingSubmissions.push({
              ...sub,
              taskTitle: task.title,
              taskId: task.id || task._id,
              taskPoints: task.points
            });
          });
      });
      setPendingSubmissions(allPendingSubmissions.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmission = async (taskId, submissionId, status, feedback, pointsAwarded) => {
    try {
      console.log('Reviewing submission:', { taskId, submissionId, status, feedback, pointsAwarded });

      const response = await axios.put(`/api/tasks/${taskId}/review`, {
        submissionId,
        status,
        feedback,
        pointsAwarded
      });

      console.log('Review response:', response.data);

      // Refresh data
      fetchDashboardData();
      alert(`Submission ${status} successfully!`);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Error reviewing submission. Please try again.';
      alert(errorMessage);
    }
  };



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
          <h1 className="dashboard-title">Teacher Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage your environmental education program
          </p>
        </div>


        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalTasks}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-label">Students</div>
          </div>
          <div className="stat-card bg-yellow-50 border border-yellow-200">
            <div className="stat-number text-yellow-800">{stats.pendingSubmissions}</div>
            <div className="stat-label text-yellow-800 font-bold">Pending Reviews</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalApprovedSubmissions}</div>
            <div className="stat-label">Tasks Done</div>
          </div>
        </div>

        {/* Performance Overview */}
        <div className="card mb-6">
          <div className="card-header">
            <h3 className="card-title">📈 Class Performance Overview</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-2 gap-6">
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-4">Task Completion Rate</h4>
                {(() => {
                  const totalPotential = (stats.totalTasks || 0) * (stats.totalStudents || 0);
                  const completedPct = totalPotential ? (stats.totalApprovedSubmissions / totalPotential) * 100 : 0;
                  const pendingPct = totalPotential ? (stats.pendingSubmissions / totalPotential) * 100 : 0;

                  return (
                    <div className="mb-6">
                      <div className="flex justify-between mb-2 text-sm">
                        <span className="font-medium text-gray-700">Overall Progress</span>
                        <span className="font-bold text-gray-900">{Math.round(completedPct + pendingPct)}%</span>
                      </div>
                      <div className="w-full h-8 bg-gray-200 rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-green-500 transition-all duration-500 flex items-center justify-center"
                          style={{ width: `${completedPct}%` }}
                          title={`Completed: ${Math.round(completedPct)}%`}
                        >
                          {completedPct > 10 && <span className="text-xs text-white font-bold">{Math.round(completedPct)}%</span>}
                        </div>
                        <div
                          className="h-full bg-yellow-500 transition-all duration-500 flex items-center justify-center"
                          style={{ width: `${pendingPct}%` }}
                          title={`Pending: ${Math.round(pendingPct)}%`}
                        >
                          {pendingPct > 10 && <span className="text-xs text-white font-bold">{Math.round(pendingPct)}%</span>}
                        </div>
                      </div>
                      <div className="flex gap-4 mt-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Completed ({stats.totalApprovedSubmissions})</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">Pending ({stats.pendingSubmissions})</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Overall Completion Rate Vertical Bar Chart */}
                <div className="mt-6 flex flex-col items-center">
                  <h4 className="text-sm font-bold text-blue-800 mb-4">Overall Completion Rate</h4>
                  <div className="relative h-64 w-32 bg-gray-100 rounded-lg border border-gray-200 flex flex-col justify-end p-2 shadow-inner">
                    {/* Y-axis lines */}
                    <div className="absolute inset-0 flex flex-col justify-between p-2 pointer-events-none">
                      <div className="border-t border-gray-300 w-full h-0"></div>
                      <div className="border-t border-gray-300 w-full h-0"></div>
                      <div className="border-t border-gray-300 w-full h-0"></div>
                      <div className="border-t border-gray-300 w-full h-0"></div>
                      <div className="border-t border-gray-300 w-full h-0"></div>
                    </div>

                    {/* Bar */}
                    <div
                      className="w-full bg-blue-600 rounded-t-md transition-all duration-1000 relative group"
                      style={{
                        height: `${stats.totalTasks && stats.totalStudents ? (stats.totalApprovedSubmissions / (stats.totalTasks * stats.totalStudents)) * 100 : 0}%`
                      }}
                    >
                      {/* Tooltip */}

                    </div>
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-2xl font-bold text-blue-600">
                      {stats.totalTasks && stats.totalStudents ? Math.round((stats.totalApprovedSubmissions / (stats.totalTasks * stats.totalStudents)) * 100) : 0}%
                    </span>
                    <p className="text-xs text-gray-500">Class Average</p>
                  </div>

                  {/* Top Performers Highlight */}
                  <div className="mt-6 w-full bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <h5 className="text-xs font-bold text-blue-800 uppercase tracking-wide mb-3 text-center">🏆 Top Performers</h5>
                    {stats.studentProgress && stats.studentProgress.length > 0 ? (
                      <div className="space-y-3">
                        {stats.studentProgress.slice(0, 3).map((student, index) => (
                          <div key={student.id} className="flex items-center justify-between border-b border-blue-100 last:border-0 pb-2 last:pb-0">
                            <div className="flex items-center">
                              <span className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-2
                                ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                  index === 1 ? 'bg-gray-300 text-gray-800' :
                                    'bg-orange-300 text-orange-900'}
                              `}>
                                {index + 1}
                              </span>
                              <span className="font-semibold text-gray-900 text-sm">{student.name}</span>
                            </div>
                            <span className="text-sm text-blue-600 font-bold">{student.points} pts</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500 text-center">No data available</div>
                    )}
                  </div>
                </div>

              </div>

              {/* Student Progress Table */}
              <div>
                <h4 className="text-sm font-semibold text-gray-600 mb-4">Student Progress</h4>
                <div className="overflow-y-auto h-96 border rounded">
                  <table className="table w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Points</th>
                        <th className="p-2">Tasks Done</th>
                        <th className="p-2">Progress</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.studentProgress && stats.studentProgress.map(student => (
                        <tr key={student.id} className="border-t">
                          <td className="p-2">{student.name}</td>
                          <td className="p-2 font-semibold text-blue-600">{student.points}</td>
                          <td className="p-2 text-green-600">{student.tasksDone}</td>
                          <td className="p-2 w-1/3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-green-500 h-2.5 rounded-full"
                                style={{ width: `${stats.totalTasks ? (student.tasksDone / stats.totalTasks) * 100 : 0}%` }}
                              ></div>
                            </div>

                            <div className="text-xs text-right mt-1 text-gray-500">
                              {stats.totalTasks ? Math.round((student.tasksDone / stats.totalTasks) * 100) : 0}%
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-2">
          {/* Recent Tasks */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">📋 Recent Tasks</h3>
            </div>
            <div className="card-body">
              {recentTasks.length === 0 ? (
                <p className="text-gray-500">No tasks created yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentTasks.map((task) => (
                    <div key={task._id} className="border rounded p-3">
                      <h4 className="font-semibold mb-2">{task.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="badge badge-info">{task.category}</span>
                        <span className="font-semibold">{task.points} points</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm text-gray-500">
                          {task.submissions.length} submissions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Submissions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">⏳ Pending Reviews</h3>
            </div>
            <div className="card-body">
              {pendingSubmissions.length === 0 ? (
                <p className="text-gray-500">No pending submissions.</p>
              ) : (
                <div className="space-y-3">
                  {pendingSubmissions.map((submission) => (
                    <div key={`${submission.taskId}-${submission._id}`} className="border rounded p-3">
                      <h4 className="font-semibold mb-1">{submission.taskTitle}</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Student: {submission.student?.name || 'Unknown'}
                      </p>
                      <p className="text-sm mb-3">{submission.description}</p>
                      {submission.file && (
                        <div className="mb-3">
                          <a
                            href={`${API_BASE_URL}/${submission.file.path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                          >
                            📎 View Attachment
                          </a>
                        </div>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReviewSubmission(
                            submission.taskId,
                            submission.id || submission._id,
                            'approved',
                            'Great work!',
                            submission.taskPoints || 20
                          )}
                          className="btn btn-success btn-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReviewSubmission(
                            submission.taskId,
                            submission.id || submission._id,
                            'rejected',
                            'Please resubmit with more detail.',
                            0
                          )}
                          className="btn btn-danger btn-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">🚀 Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-3">
              <button
                className="btn btn-primary"
                onClick={() => navigate('/tasks')}
              >
                Create New Task
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/quizzes')}
              >
                Create Quiz
              </button>
              <button
                className="btn btn-success"
                onClick={() => navigate('/users')}
              >
                View All Students
              </button>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
};

export default TeacherDashboard;

