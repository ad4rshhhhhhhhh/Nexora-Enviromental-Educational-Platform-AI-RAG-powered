import React, { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import axios from "../config/axios";
import { useAuth } from "../contexts/AuthContext";

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalTasks: 0,
    totalQuizzes: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch users
      const usersResponse = await axios.get("/api/users");
      const users = usersResponse.data.data;

      // Fetch tasks
      const tasksResponse = await axios.get("/api/tasks");
      const tasks = tasksResponse.data.data;

      // Fetch quizzes
      const quizzesResponse = await axios.get("/api/quizzes");
      const quizzes = quizzesResponse.data.data;

      // Calculate stats
      const totalUsers = users.length;
      const totalStudents = users.filter((u) => u.role === "student").length;
      const totalTeachers = users.filter((u) => u.role === "teacher").length;

      setStats({
        totalUsers,
        totalStudents,
        totalTeachers,
        totalTasks: tasks.length,
        totalQuizzes: quizzes.length,
      });

      setRecentUsers(users.slice(0, 5));
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (window.confirm("Are you sure you want to deactivate this user?")) {
      try {
        await axios.put(`/api/users/${userId}/deactivate`);
        fetchDashboardData(); // Refresh data
      } catch (error) {
        console.error("Error deactivating user:", error);
      }
    }
  };

  // Admin dashboard protection

  if (!user || user.role !== "admin") {
    return <Navigate to="/login" />;
  }

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
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage the entire Nexora platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalStudents}</div>
            <div className="stat-label">Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalTeachers}</div>
            <div className="stat-label">Teachers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalTasks}</div>
            <div className="stat-label">Tasks</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{stats.totalQuizzes}</div>
            <div className="stat-label">Quizzes</div>
          </div>
        </div>

        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">👥 Recent Users</h3>
          </div>
          <div className="card-body">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Points</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user, index) => (
                      <tr key={user._id || `user-${index}`}>
                        <td className="font-semibold">{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <select
                            value={user.role == "admin" ? "admin" : user.role}
                            onChange={(e) =>
                              handleRoleChange(user._id, e.target.value)
                            }
                            className="form-select"
                            style={{ width: "auto", minWidth: "100px" }}
                          >
                            <option value="student">Student</option>
                            <option value="teacher">Teacher</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>{user.points || 0}</td>
                        <td>
                          <span
                            className={`badge ${user.isActive !== false ? "badge-success" : "badge-danger"}`}
                          >
                            {user.isActive !== false ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeactivateUser(user._id)}
                              className="btn btn-danger btn-sm"
                              disabled={
                                user.isActive === false || user.role === "admin"
                              }
                            >
                              Deactivate
                            </button>
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

        {/* Quick Actions */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">🚀 Quick Actions</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-4">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/users")}
              >
                Manage Users
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate("/tasks")}
              >
                View All Tasks
              </button>
              <button
                className="btn btn-success"
                onClick={() => navigate("/quizzes")}
              >
                View All Quizzes
              </button>
              <button
                className="btn btn-danger"
                onClick={() =>
                  alert("System Settings functionality coming soon!")
                }
              >
                System Settings
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
