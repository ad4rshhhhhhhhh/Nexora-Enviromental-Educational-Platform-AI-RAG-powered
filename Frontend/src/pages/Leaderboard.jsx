import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const Leaderboard = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const [leaderboardRes, tasksRes] = await Promise.all([
        axios.get('/api/users/leaderboard'),
        axios.get('/api/tasks')
      ]);

      const totalTasksCount = tasksRes.data.count || 0;

      // Map backend data to frontend structure
      const mappedStudents = leaderboardRes.data.data.map(student => ({
        id: student._id,
        name: student.name,
        email: student.email,
        totalPoints: student.points || 0,
        completedTasks: student.tasksCompleted || 0,
        totalTasks: totalTasksCount,
        totalQuizzes: student.quizzesTaken || 0
      }));

      // Sort students by total points in descending order
      const sortedStudents = mappedStudents.sort((a, b) => b.totalPoints - a.totalPoints);
      setStudents(sortedStudents);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'text-yellow-600 font-bold';
    if (rank === 2) return 'text-gray-500 font-bold';
    if (rank === 3) return 'text-orange-600 font-bold';
    return 'text-gray-700';
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="text-center py-8">
            <p>Loading leaderboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">🏆 Leaderboard</h1>
          <p className="dashboard-subtitle">
            See how you rank among your peers in environmental activities
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Top Environmental Champions</h3>
          </div>
          <div className="card-body">
            {students.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No student data available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student</th>
                      <th>Total Points</th>
                      <th>Tasks Completed</th>
                      <th>Quizzes Taken</th>
                      <th>Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => {
                      const rank = index + 1;
                      const completionRate = student.totalTasks > 0
                        ? Math.round((student.completedTasks / student.totalTasks) * 100)
                        : 0;
                      const isCurrentUser = user?.id === student.id;

                      return (
                        <tr
                          key={student.id}
                          className={isCurrentUser ? 'bg-blue-50 border-blue-200' : ''}
                        >
                          <td>
                            <span className={`text-2xl ${getRankClass(rank)}`}>
                              {getRankBadge(rank)}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center">
                              <div>
                                <div className={`font-semibold ${isCurrentUser ? 'text-blue-600' : ''}`}>
                                  {student.name}
                                  {isCurrentUser && <span className="ml-2 text-sm text-blue-500">(You)</span>}
                                </div>
                                <div className="text-sm text-gray-500">{student.email}</div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-primary text-lg ${rank <= 3 ? 'badge-lg' : ''}`}>
                              {student.totalPoints} pts
                            </span>
                          </td>
                          <td>
                            <span className="text-sm">
                              {student.completedTasks} / {student.totalTasks}
                            </span>
                          </td>
                          <td>
                            <span className="text-sm">
                              {student.totalQuizzes}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div
                                  className="bg-green-500 h-2 rounded-full"
                                  style={{ width: `${completionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm">{completionRate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Achievement Stats */}
        {students.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="card">
              <div className="card-body text-center">
                <div className="text-3xl mb-2">🌟</div>
                <h4 className="text-xl font-bold text-green-600">
                  {Math.max(...students.map(s => s.totalPoints))}
                </h4>
                <p className="text-gray-600">Highest Score</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-3xl mb-2">📈</div>
                <h4 className="text-xl font-bold text-blue-600">
                  {Math.round(students.reduce((sum, s) => sum + s.totalPoints, 0) / students.length)}
                </h4>
                <p className="text-gray-600">Average Score</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <div className="text-3xl mb-2">🎯</div>
                <h4 className="text-xl font-bold text-purple-600">
                  {students.reduce((sum, s) => sum + s.completedTasks, 0)}
                </h4>
                <p className="text-gray-600">Total Tasks Completed</p>
              </div>
            </div>
          </div>
        )}

        {/* User's Position Highlight */}
        {user?.role === 'student' && students.length > 0 && (
          <div className="card mt-6 border-blue-200">
            <div className="card-body">
              <h4 className="text-lg font-semibold text-blue-600 mb-3">Your Performance</h4>
              {(() => {
                const userIndex = students.findIndex(s => s.id === user.id);
                if (userIndex === -1) {
                  return <p className="text-gray-500">Complete some tasks to appear on the leaderboard!</p>;
                }

                const userRank = userIndex + 1;
                const userStudent = students[userIndex];

                return (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{getRankBadge(userRank)}</div>
                      <div className="text-sm text-gray-600">Your Rank</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{userStudent.totalPoints}</div>
                      <div className="text-sm text-gray-600">Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{userStudent.completedTasks}</div>
                      <div className="text-sm text-gray-600">Tasks Done</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{userStudent.totalQuizzes}</div>
                      <div className="text-sm text-gray-600">Quizzes</div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
