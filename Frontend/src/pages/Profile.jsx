import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import api from '../api/api';

const Profile = () => {
    // 1. Removed 'login' from here as it was unused
    const { user } = useAuth(); 
    const { theme, toggleTheme } = useTheme();
    
    const [formData, setFormData] = useState({
        name: user.name || '',
        phone: user.phone || '',
        phoneSecondary: user.phoneSecondary || '',
        password: ''
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 2. Removed 'const res =' since we aren't using the response variable
            await api.put('/auth/profile', formData);
            
            setMessage('Profile updated successfully!');
            
            // Optional: Since we aren't updating the global context immediately, 
            // you might want to remind them to refresh to see changes in the Header.
            // In a production app, we would expose 'setUser' from AuthContext to update this instantly.
        } catch (err) {
            setMessage('Failed to update profile.');
        }
    };

    return (
        <div className="container mt-4">
            <h2>User Settings</h2>
            <div className="row">
                <div className="col-md-6">
                    <div className="card mb-4">
                        <div className="card-header">Appearance</div>
                        <div className="card-body d-flex justify-content-between align-items-center">
                            <span>Current Theme: <strong>{theme.toUpperCase()}</strong></span>
                            <button className="btn btn-secondary" onClick={toggleTheme}>
                                {theme === 'light' ? '🌙 Switch to Dark Mode' : '☀️ Switch to Light Mode'}
                            </button>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">Edit Profile</div>
                        <div className="card-body">
                            {message && <div className={`alert ${message.includes('Success') ? 'alert-success' : 'alert-danger'}`}>{message}</div>}
                            <form onSubmit={handleSubmit}>
                                <div className="mb-3">
                                    <label className="form-label">Full Name</label>
                                    <input type="text" name="name" value={formData.name} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Primary Phone</label>
                                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Secondary Phone</label>
                                    <input type="text" name="phoneSecondary" value={formData.phoneSecondary} onChange={handleChange} className="form-control" />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">New Password (leave blank to keep current)</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} className="form-control" />
                                </div>
                                <button className="btn btn-primary">Save Changes</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;