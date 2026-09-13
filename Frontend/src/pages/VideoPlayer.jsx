import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../config/axios';
import { useAuth } from '../contexts/AuthContext';

const VideoPlayer = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { updateUser } = useAuth();
    const [message, setMessage] = useState('');
    const playerRef = useRef(null);

    // Environmental video data
    const videos = {
        1: { title: 'Introduction to Sustainability', videoId: 'gTamhx_8_Xc' }, // What is Sustainability
        2: { title: 'Climate Change Basics', videoId: 'G4H1N_yXBiA' }, // Climate Change 101
        3: { title: 'Renewable Energy Sources', videoId: '1kUE0BZtTRc' }, // Renewable Energy 101
    };

    const video = videos[id] || { title: 'Unknown Video', videoId: '' };

    useEffect(() => {
        // Load YouTube IFrame Player API code asynchronously
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

        // Initialize player when API is ready
        window.onYouTubeIframeAPIReady = () => {
            playerRef.current = new window.YT.Player('youtube-player', {
                height: '100%',
                width: '100%',
                videoId: video.videoId,
                playerVars: {
                    'playsinline': 1
                },
                events: {
                    'onStateChange': onPlayerStateChange
                }
            });
        };

        return () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }
            window.onYouTubeIframeAPIReady = null;
        };
    }, [video.videoId]);

    const onPlayerStateChange = async (event) => {
        // YT.PlayerState.ENDED is 0
        if (event.data === 0) {
            setMessage('Video Completed! 🏆 +10 Points!');
            try {
                const response = await axios.put('/api/users/add-points', { points: 10 });
                if (response.data.success) {
                    console.log('Points added, updating user...');
                    updateUser(response.data.data);
                }
            } catch (error) {
                console.error('Error adding points:', error);
            }
        }
    };

    return (
        <div className="dashboard">
            <div className="container">
                <button className="btn btn-secondary mb-4" onClick={() => navigate(-1)}>
                    &larr; Back to Dashboard
                </button>
                <div className="card">
                    <div className="card-header">
                        <h2 className="card-title">{video.title}</h2>
                    </div>
                    <div className="card-body">
                        <div className="video-container" style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden' }}>
                            <div id="youtube-player" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}></div>
                        </div>
                        {message && (
                            <div className="mt-4 p-3 bg-green-100 text-green-800 rounded font-bold text-center">
                                {message}
                            </div>
                        )}
                        <div className="mt-4">
                            <h3>Description</h3>
                            <p>
                                This is a dummy video lecture for educational purposes. In a real application,
                                this would be a real educational video about {video.title}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
