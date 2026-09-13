import React, { useState, useEffect } from 'react';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const LearningModules = () => {
    const { user, refreshUser } = useAuth();
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newModule, setNewModule] = useState({
        title: '',
        description: '',
        videoUrl: '',
        category: 'other'
    });

    useEffect(() => {
        fetchModules();
    }, []);

    const fetchModules = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/modules');
            setModules(response.data.data || []);
        } catch (error) {
            console.error('Error fetching modules:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddModule = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/modules', newModule);
            setShowAddModal(false);
            setNewModule({ title: '', description: '', videoUrl: '', category: 'other' });
            fetchModules();
            alert('Module added successfully!');
        } catch (error) {
            console.error('Error adding module:', error);
            alert('Error adding module. Please check the inputs.');
        }
    };

    const handleDeleteModule = async (id) => {
        if (window.confirm('Are you sure you want to delete this module?')) {
            try {
                await axios.delete(`/api/modules/${id}`);
                fetchModules();
                alert('Module deleted successfully!');
            } catch (error) {
                console.error('Error deleting module:', error);
                alert('Error deleting module.');
            }
        }
    };

    const [playingVideo, setPlayingVideo] = useState(null);
    const [completingId, setCompletingId] = useState(null);

    const handleCompleteModule = async (id) => {
        try {
            setCompletingId(id);
            const response = await axios.post(`/api/modules/${id}/complete`);
            if (response.data.success) {
                alert(response.data.message);
                await refreshUser(); // refresh user data to get updated points and completed modules
            }
        } catch (error) {
            console.error('Error completing module:', error);
            alert(error.response?.data?.message || 'Error completing module');
        } finally {
            setCompletingId(null);
        }
    };

    const getVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const getEmbedUrl = (url) => {
        const videoId = getVideoId(url);
        return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url;
    };

    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    return (
        <div className="dashboard">
            <div className="container">
                <div className="dashboard-header">
                    <h1 className="dashboard-title">Learning Modules</h1>
                    <p className="dashboard-subtitle">
                        Watch video sessions to enhance your environmental knowledge
                    </p>
                </div>

                <div className="card mb-6">
                    <div className="card-body flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-600">
                            <span className="text-2xl">📺</span>
                            <span className="font-medium">Library Collection</span>
                        </div>
                        {(user?.role === 'teacher' || user?.role === 'admin') && (
                            <button
                                className="btn btn-primary"
                                onClick={() => setShowAddModal(true)}
                            >
                                <span>➕</span> Add Module
                            </button>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap gap-6">
                    {modules.length === 0 ? (
                        <div className="col-span-3 text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="text-4xl mb-4">🎬</div>
                            <p className="text-gray-500 text-lg font-medium">No learning modules available yet.</p>
                            <p className="text-gray-400">Check back later for new content!</p>
                        </div>
                    ) : (
                        modules.map((module) => {
                            const videoId = getVideoId(module.videoUrl);
                            const isPlaying = playingVideo === module._id;

                            return (
                                <div key={module._id} className="card hover:shadow-lg transition-all duration-300 flex flex-col h-full overflow-hidden" style={{ flex: '1 1 320px', maxWidth: '560px' }}>
                                    <div className="bg-gray-900 relative group" style={{ aspectRatio: '16/9' }}>
                                        {isPlaying ? (
                                            <iframe
                                                src={getEmbedUrl(module.videoUrl)}
                                                title={module.title}
                                                className="w-full h-full object-cover"
                                                allowFullScreen
                                                frameBorder="0"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                            ></iframe>
                                        ) : (
                                            <div
                                                className="w-full h-full cursor-pointer relative"
                                                onClick={() => setPlayingVideo(module._id)}
                                            >
                                                <img
                                                    src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                                    alt={module.title}
                                                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://via.placeholder.com/640x360?text=Video+Thumbnail';
                                                    }}
                                                />
                                                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 group-hover:bg-opacity-30 transition-all">
                                                    <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-transform border-2 border-white">
                                                        <svg className="w-6 h-6 text-white fill-current ml-1" viewBox="0 0 24 24">
                                                            <path d="M8 5v14l11-7z" />
                                                        </svg>
                                                    </div>
                                                </div>
                                                <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                                                    Video
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="card-body flex-1 flex flex-col p-4">
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="badge badge-info capitalize text-xs font-bold tracking-wide">
                                                {module.category}
                                            </span>
                                            {(user?.role === 'teacher' || user?.role === 'admin') && (
                                                <button
                                                    className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                                                    onClick={() => handleDeleteModule(module._id)}
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>

                                        <h3 className="font-bold text-lg mb-2 leading-tight text-gray-800 line-clamp-2" title={module.title}>
                                            {module.title}
                                        </h3>

                                        <p className="text-gray-600 text-sm flex-1 line-clamp-3 mb-4">
                                            {module.description}
                                        </p>

                                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2 text-xs text-gray-500">
                                            <div className="flex items-center gap-2">
                                                <span>🎥</span>
                                                <span>Watch to learn more</span>
                                            </div>
                                            {user?.role === 'student' && (
                                                user?.completedModules?.includes(module._id) ? (
                                                    <span className="text-green-600 font-bold flex items-center gap-1">✓ Claimed</span>
                                                ) : (
                                                    <button 
                                                        className="btn btn-sm btn-primary py-1 px-3 text-xs" 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCompleteModule(module._id);
                                                        }}
                                                        disabled={completingId === module._id}
                                                    >
                                                        {completingId === module._id ? 'Claiming...' : 'Claim 20 Pts'}
                                                    </button>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Add Module Modal */}
                {showAddModal && (
                    <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h3>Add Learning Module</h3>
                                <button
                                    className="modal-close"
                                    onClick={() => setShowAddModal(false)}
                                >
                                    ×
                                </button>
                            </div>
                            <form onSubmit={handleAddModule}>
                                <div className="modal-body">
                                    <div className="form-group">
                                        <label className="form-label">Title</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newModule.title}
                                            onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                                            required
                                            placeholder="Enter video title"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Description</label>
                                        <textarea
                                            className="form-control"
                                            rows="3"
                                            value={newModule.description}
                                            onChange={(e) => setNewModule({ ...newModule, description: e.target.value })}
                                            required
                                            placeholder="What is this video about?"
                                        ></textarea>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Video URL (YouTube)</label>
                                        <input
                                            type="url"
                                            className="form-control"
                                            value={newModule.videoUrl}
                                            onChange={(e) => setNewModule({ ...newModule, videoUrl: e.target.value })}
                                            placeholder="https://www.youtube.com/watch?v=..."
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select
                                            className="form-select"
                                            value={newModule.category}
                                            onChange={(e) => setNewModule({ ...newModule, category: e.target.value })}
                                        >
                                            <option value="other">Other</option>
                                            <option value="recycling">Recycling</option>
                                            <option value="energy">Energy</option>
                                            <option value="water">Water</option>
                                            <option value="biodiversity">Biodiversity</option>
                                            <option value="climate">Climate</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        type="button"
                                        className="btn btn-secondary"
                                        onClick={() => setShowAddModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Add Module
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

export default LearningModules;
