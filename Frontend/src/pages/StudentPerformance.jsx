import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const StudentPerformance = () => {
  const { user } = useAuth();
  const [studentsData, setStudentsData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStudentPerformance();
    }
  }, [user]);

  const fetchStudentPerformance = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/students/performance');
      setStudentsData(response.data.data);
    } catch (error) {
      console.error('Error fetching student performance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'teacher' && user?.role !== 'student') {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="text-center py-8">
            <h2>Access Denied</h2>
            <p>You don't have permission to view this page.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="text-center py-8">
            <p>Loading student performance data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">
            {user?.role === 'student' ? 'My Performance' : 'Student Performance'}
          </h1>
          <p className="dashboard-subtitle">
            Track student progress and achievements
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">📊 Student Performance Overview</h3>
          </div>
          <div className="card-body">
            {studentsData.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No student data available.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Total Points</th>
                      <th>Tasks Completed</th>
                      <th>Quizzes Taken</th>
                      <th>Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsData.map((student) => (
                      <tr key={student.id}>
                        <td className="font-semibold">{student.name}</td>
                        <td>{student.email}</td>
                        <td>
                          <span className="badge badge-primary">
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
                          <div className="space-y-1">
                            {student.taskSubmissions.map((task, index) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium">{task.taskTitle}:</span>
                                <span className={`ml-1 badge ${task.status === 'approved' ? 'badge-success' :
                                  task.status === 'pending' ? 'badge-warning' : 'badge-danger'
                                  }`}>
                                  {task.status}
                                </span>
                                {task.pointsAwarded > 0 && (
                                  <span className="ml-1 text-green-600">
                                    +{task.pointsAwarded}pts
                                  </span>
                                )}
                              </div>
                            ))}
                            {student.quizAttempts.map((quiz, index) => (
                              <div key={index} className="text-xs">
                                <span className="font-medium">{quiz.quizTitle}:</span>
                                <span className="ml-1 badge badge-info">
                                  {quiz.score}%
                                </span>
                                <span className="ml-1 text-green-600">
                                  +{quiz.pointsEarned}pts
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          <div className="card">
            <div className="card-body text-center">
              <h4 className="text-2xl font-bold text-blue-600">
                {studentsData.length}
              </h4>
              <p className="text-gray-600">Total Students</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <h4 className="text-2xl font-bold text-green-600">
                {studentsData.reduce((sum, student) => sum + student.totalPoints, 0)}
              </h4>
              <p className="text-gray-600">Total Points Earned</p>
            </div>
          </div>
          <div className="card">
            <div className="card-body text-center">
              <h4 className="text-2xl font-bold text-purple-600">
                {studentsData.reduce((sum, student) => sum + student.completedTasks, 0)}
              </h4>
              <p className="text-gray-600">Tasks Completed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPerformance;
