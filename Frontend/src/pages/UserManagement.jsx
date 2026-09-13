import React, { useState, useEffect } from 'react';
import axios from '../config/axios';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [stats, setStats] = useState({ totalStudents: 0, totalTeachers: 0 });
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student'
    });
    const [createError, setCreateError] = useState('');
    const [createSuccess, setCreateSuccess] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersRes, statsRes] = await Promise.all([
                axios.get('/api/users'),
                axios.get('/api/users/stats')
            ]);
            setUsers(usersRes.data.data || []);
            setStats(statsRes.data.data || { totalStudents: 0, totalTeachers: 0 });
        } catch (error) {
            console.error('Error fetching user data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreateError('');
        setCreateSuccess('');

        try {
            await axios.post('/api/users', formData);
            setCreateSuccess('User created successfully!');
            setFormData({
                name: '',
                email: '',
                password: '',
                role: 'student'
            });
            setShowCreateForm(false);
            fetchData(); // Refresh list
        } catch (error) {
            setCreateError(error.response?.data?.message || 'Error creating user');
        }
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="container mx-auto p-4">
            <div className="dashboard-header mb-6 flex justify-between items-center">
                <div>
                    <h1 className="dashboard-title">User Management</h1>
                    <p className="dashboard-subtitle">Overview of all registered users</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setShowCreateForm(!showCreateForm)}
                >
                    {showCreateForm ? 'Cancel' : 'Create New User'}
                </button>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
                <div className="card mb-6 border-primary">
                    <div className="card-header">
                        <h3 className="card-title">Add New User</h3>
                    </div>
                    <div className="card-body">
                        {createError && <div className="alert alert-danger mb-4">{createError}</div>}
                        {createSuccess && <div className="alert alert-success mb-4">{createSuccess}</div>}

                        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-group">
                                <label className="form-label">Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    minLength="2"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Password</label>
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className="form-input"
                                    required
                                    minLength="6"
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Role</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="form-select"
                                >
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                            <div className="md:col-span-2">
                                <button type="submit" className="btn btn-success w-full">
                                    Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="card bg-blue-50 border-blue-200">
                    <div className="card-body text-center">
                        <h3 className="text-xl font-semibold text-blue-800">Total Students</h3>
                        <p className="text-4xl font-bold text-blue-600 mt-2">{stats.totalStudents}</p>
                    </div>
                </div>
                <div className="card bg-green-50 border-green-200">
                    <div className="card-body text-center">
                        <h3 className="text-xl font-semibold text-green-800">Total Teachers</h3>
                        <p className="text-4xl font-bold text-green-600 mt-2">{stats.totalTeachers}</p>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">👥 All Users</h3>
                </div>
                <div className="card-body">
                    <div className="overflow-x-auto">
                        <table className="table w-full">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Joined Date</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user._id}>
                                        <td className="font-medium">{user.name}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge ${user.role === 'admin' ? 'badge-danger' :
                                                user.role === 'teacher' ? 'badge-success' : 'badge-primary'
                                                }`}>
                                                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <span className={`badge ${user.isActive ? 'badge-success' : 'badge-secondary'}`}>
                                                    {user.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                                {!user.isApproved && (
                                                    <span className="badge badge-warning">Pending Approval</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            {!user.isApproved && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await axios.put(`/api/users/${user._id}/approve`);
                                                            fetchData();
                                                        } catch (error) {
                                                            console.error('Error approving user:', error);
                                                            alert('Failed to approve user');
                                                        }
                                                    }}
                                                    className="btn btn-sm btn-success"
                                                >
                                                    Approve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManagement;
