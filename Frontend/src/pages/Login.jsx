import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { motion } from 'framer-motion';
import { FaLock, FaEnvelope, FaUser, FaPhone, FaBuilding } from 'react-icons/fa';

const getDashboardPath = (role) => {
    switch (role) {
        case 'resident': return '/resident/dashboard';
        case 'guard': return '/guard/dashboard';
        case 'admin': return '/admin/dashboard';
        default: return '/';
    }
};

const LoginComponent = ({ role = 'resident' }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            const data = await login(email, password);
            navigate(getDashboardPath(data.role));
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100" 
             style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                transition={{ duration: 0.4 }}
                className="card p-5 shadow-lg border-0 auth-card" 
                style={{ maxWidth: '420px', width: '90%', borderRadius: '24px', backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
            >
                <div className="text-center mb-4">
                    <h1 className="display-4 mb-2">🚀</h1>
                    <h3 className="fw-bold text-dark">SocietyHub</h3>
                    <span className="badge bg-primary px-3 py-2 rounded-pill text-uppercase">{role} Login</span>
                </div>

                {error && <div className="alert alert-danger py-2 text-center small shadow-sm border-0">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="mb-3 input-group shadow-sm rounded">
                        <span className="input-group-text bg-white border-0 text-primary ps-3"><FaEnvelope /></span>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="form-control border-0 py-2" placeholder="Email Address" />
                    </div>
                    <div className="mb-4 input-group shadow-sm rounded">
                        <span className="input-group-text bg-white border-0 text-primary ps-3"><FaLock /></span>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="form-control border-0 py-2" placeholder="Password" />
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary w-100 py-2 fw-bold shadow-md">
                        Login
                    </motion.button>
                </form>

                {role === 'resident' && (
                    <div className="mt-4 text-center small">
                        <Link to="/signup" className="text-decoration-none fw-bold text-primary">Create Resident Account</Link>
                        <div className="mt-3 d-flex justify-content-center gap-3 opacity-75">
                            <Link to="/guard-login" className="text-secondary text-decoration-none">Guard Login</Link>
                            <span>|</span>
                            <Link to="/admin-login" className="text-secondary text-decoration-none">Admin Login</Link>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

const SignupComponent = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '', unitNumber: '', phone: '', phoneSecondary: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage(''); setError('');
        try {
            const res = await api.post('/auth/signup', formData);
            setMessage(res.data.message);
            setTimeout(() => navigate('/login'), 4000);
        } catch (err) {
            setError(err.response?.data?.message || 'Signup failed.');
        }
    };

    return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 py-5" 
             style={{ background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)' }}>
            <motion.div 
                initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} 
                className="card p-4 shadow-lg border-0 auth-card" 
                style={{ maxWidth: '500px', width: '90%', borderRadius: '20px', backgroundColor: 'rgba(255, 255, 255, 0.95)' }}
            >
                <h3 className="text-center fw-bold mb-4 text-dark">Join SocietyHub</h3>
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    <div className="row g-2">
                        <div className="col-12 mb-2 input-group">
                            <span className="input-group-text border-0 bg-light"><FaUser className="text-muted"/></span>
                            <input type="text" name="name" placeholder="Full Name" onChange={handleChange} required className="form-control border-0 bg-light" />
                        </div>
                        <div className="col-12 mb-2 input-group">
                            <span className="input-group-text border-0 bg-light"><FaEnvelope className="text-muted"/></span>
                            <input type="email" name="email" placeholder="Email" onChange={handleChange} required className="form-control border-0 bg-light" />
                        </div>
                        <div className="col-12 mb-2 input-group">
                            <span className="input-group-text border-0 bg-light"><FaLock className="text-muted"/></span>
                            <input type="password" name="password" placeholder="Password" onChange={handleChange} required className="form-control border-0 bg-light" />
                        </div>
                        <div className="col-12 mb-2 input-group">
                            <span className="input-group-text border-0 bg-light"><FaBuilding className="text-muted"/></span>
                            <input type="text" name="unitNumber" placeholder="Villa No." onChange={handleChange} required className="form-control border-0 bg-light" />
                        </div>
                        <div className="col-6 mb-3 input-group">
                            <span className="input-group-text border-0 bg-light"><FaPhone className="text-muted"/></span>
                            <input type="text" name="phone" placeholder="Primary" onChange={handleChange} required className="form-control border-0 bg-light" />
                        </div>
                        <div className="col-6 mb-3 input-group">
                             <span className="input-group-text border-0 bg-light"><FaPhone className="text-muted"/></span>
                            <input type="text" name="phoneSecondary" placeholder="Secondary" onChange={handleChange} className="form-control border-0 bg-light" />
                        </div>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} type="submit" className="btn btn-success w-100 fw-bold shadow-sm">Sign Up</motion.button>
                </form>
                <div className="mt-3 text-center"><Link to="/login" className="text-decoration-none">Already have an account? Login</Link></div>
            </motion.div>
        </div>
    );
};

export const Login = LoginComponent;
export const ResidentSignup = SignupComponent;
export const GuardLogin = () => <LoginComponent role="guard" />;
export const AdminLogin = () => <LoginComponent role="admin" />;