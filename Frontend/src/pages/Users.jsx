import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data.data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/api/users/${userId}/role`, { role: newRole });
      fetchUsers(); // Refresh data
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating user:', newUser);
      const response = await axios.post('/api/users', newUser);
      console.log('User created successfully:', response.data);
      setShowCreateModal(false);
      setNewUser({ name: '', email: '', password: '', role: 'student' });
      fetchUsers(); // Refresh the list
      alert(`User created successfully! They can login with email: ${newUser.email} and password: ${newUser.password || 'password123'}`);
    } catch (error) {
      console.error('Error creating user:', error);
      console.error('Error response:', error.response?.data);
      const errorMessage = error.response?.data?.message || 'Error creating user. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers(); // Refresh data
        alert('User deleted successfully');
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user');
      }
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.put(`/api/users/${userId}/approve`);
      fetchUsers(); // Refresh data
      alert('User approved successfully');
    } catch (error) {
      console.error('Error approving user:', error);
      alert('Error approving user');
    }
  };

  const filteredUsers = users.filter(userItem => {
    if (filter === 'all') return true;
    if (filter === 'students') return userItem.role === 'student';
    if (filter === 'teachers') return userItem.role === 'teacher';
    if (filter === 'admins') return userItem.role === 'admin';
    if (filter === 'active') return userItem.isActive !== false;
    if (filter === 'inactive') return userItem.isActive === false;
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
          <h1 className="dashboard-title">Users Management</h1>
          <p className="dashboard-subtitle">
            Manage all platform users
          </p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid mb-6">
          <div className="stat-card">
            <div className="stat-number">{users.length}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.role === 'student').length}</div>
            <div className="stat-label">Students</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.role === 'teacher').length}</div>
            <div className="stat-label">Teachers</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
            <div className="stat-label">Admins</div>
          </div>
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
                <option value="all">All Users</option>
                <option value="students">Students</option>
                <option value="teachers">Teachers</option>
                <option value="admins">Admins</option>
                <option value="active">Active Users</option>
                <option value="inactive">Inactive Users</option>
              </select>
              {user?.role === 'admin' && (
                <button
                  className="btn btn-primary ml-auto"
                  onClick={() => setShowCreateModal(true)}
                >
                  Add New User
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Users List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">👥 All Users ({filteredUsers.length})</h3>
          </div>
          <div className="card-body">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No users found.</p>
                <p className="text-gray-400">Users will appear here once they register.</p>
              </div>
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
                      <th>Joined</th>
                      {user?.role === 'admin' && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((userItem, index) => (
                      <tr key={userItem._id || `user-${index}`}>
                        <td className="font-semibold">{userItem.name || 'Unknown'}</td>
                        <td>{userItem.email || 'No email'}</td>
                        <td>
                          {user?.role === 'admin' ? (
                            <select
                              value={userItem.role || 'student'}
                              onChange={(e) => handleRoleChange(userItem._id, e.target.value)}
                              className="form-select"
                              style={{ width: 'auto', minWidth: '100px' }}
                            >
                              <option value="student">Student</option>
                              <option value="teacher">Teacher</option>
                              <option value="admin">Admin</option>
                            </select>
                          ) : (
                            <span className={`badge ${userItem.role === 'admin' ? 'badge-danger' :
                                userItem.role === 'teacher' ? 'badge-warning' :
                                  'badge-primary'
                              }`}>
                              {userItem.role || 'student'}
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge badge-success">{userItem.points || 0} pts</span>
                        </td>
                        <td>
                          {userItem.isApproved === false ? (
                            <span className="badge badge-warning">Pending</span>
                          ) : (
                            <span className={`badge ${userItem.isActive !== false ? 'badge-success' : 'badge-danger'}`}>
                              {userItem.isActive !== false ? 'Active' : 'Inactive'}
                            </span>
                          )}
                        </td>
                        <td>{userItem.createdAt ? new Date(userItem.createdAt).toLocaleDateString() : 'N/A'}</td>
                        {user?.role === 'admin' && (
                          <td>
                            <div className="flex gap-2">
                              {userItem.isApproved === false && (
                                <button
                                  onClick={() => handleApproveUser(userItem.id || userItem._id)}
                                  className="btn btn-success btn-sm"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteUser(userItem.id || userItem._id)}
                                className="btn btn-danger btn-sm"
                                disabled={userItem.role === 'admin'}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create User Modal */}
        {showCreateModal && (
          <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Add New User</h3>
                <button
                  className="modal-close"
                  onClick={() => setShowCreateModal(false)}
                >
                  ×
                </button>
              </div>
              <form onSubmit={handleCreateUser}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Password</label>
                    <input
                      type="password"
                      className="form-control"
                      value={newUser.password}
                      onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                      required
                      minLength="6"
                    />
                  </div>
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      className="form-control"
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
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
                    Create User
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

export default Users;
