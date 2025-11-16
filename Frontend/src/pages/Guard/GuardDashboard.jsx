import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { FaUserCheck, FaSignOutAlt, FaCar, FaClock, FaCheckCircle } from 'react-icons/fa';

const GuardDashboard = () => {
    const [checkedInVisitors, setCheckedInVisitors] = useState([]);
    const [approvedVisitors, setApprovedVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            const [checkedInRes, approvedRes] = await Promise.all([
                api.get('/visitors/guard/checked-in'),
                api.get('/visitors/guard/approved')
            ]);
            setCheckedInVisitors(checkedInRes.data);
            setApprovedVisitors(approvedRes.data);
        } catch (err) {
            setError('Failed to fetch dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleCheckOut = async (visitorId) => {
        if (!window.confirm('Confirm visitor check-out?')) return;
        try {
            await api.post(`/visitors/guard/check-out/${visitorId}`);
            setCheckedInVisitors(prev => prev.filter(v => v._id !== visitorId));
        } catch (err) { alert('Failed to check out visitor.'); }
    };

    if (loading) return <div className="text-center mt-5 spinner-border text-primary"></div>;
    if (error) return <div className="alert alert-danger mt-5 mx-4 shadow-sm border-0">{error}</div>;

    return (
        <PageTransition>
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">Guard Station</h2>
                        <span className="text-muted small">Shift Active • {new Date().toLocaleDateString()}</span>
                    </div>
                    <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 rounded-pill border border-success">System Online</span>
                </div>

                {/* Quick Actions */}
                <div className="row mb-5">
                    <div className="col-md-6 mb-3">
                        <Link to="/guard/checkin" className="text-decoration-none">
                            <div className="card text-white border-0 shadow-lg h-100" 
                                 style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                                <div className="card-body d-flex align-items-center justify-content-between p-4">
                                    <div>
                                        <h4 className="fw-bold mb-1">Visitor Entry</h4>
                                        <p className="mb-0 opacity-75">Scan QR or Manual Entry</p>
                                    </div>
                                    <FaUserCheck size={40} className="opacity-50" />
                                </div>
                            </div>
                        </Link>
                    </div>
                    <div className="col-md-6 mb-3">
                        <Link to="/guard/checkout" className="text-decoration-none">
                            <div className="card text-white border-0 shadow-lg h-100" 
                                 style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                                <div className="card-body d-flex align-items-center justify-content-between p-4">
                                    <div>
                                        <h4 className="fw-bold mb-1">Visitor Exit</h4>
                                        <p className="mb-0 opacity-75">Process Check-outs</p>
                                    </div>
                                    <FaSignOutAlt size={40} className="opacity-50" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="row g-4">
                    {/* Pre-Approved List */}
                    <div className="col-lg-6">
                        {/* REMOVED bg-white here so it adapts to dark mode */}
                        <div className="card shadow-sm h-100 border-0">
                            <div className="card-header text-primary border-0 d-flex align-items-center gap-2">
                                <FaCheckCircle />
                                <span>Approved & Waiting ({approvedVisitors.length})</span>
                            </div>
                            <div className="card-body p-0">
                                {approvedVisitors.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <p className="mb-0">No expected visitors at the moment.</p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {approvedVisitors.map(v => (
                                            <div key={v._id} className="list-group-item border-0 border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                                <div>
                                                    {/* Removed text-dark */}
                                                    <h6 className="fw-bold mb-1">{v.name} <span className="badge bg-light text-dark border ms-1">{v.visitorType}</span></h6>
                                                    <div className="d-flex gap-3 text-muted small">
                                                        <span>Villa: <strong>{v.unitNumber}</strong></span>
                                                        <span><FaClock className="me-1"/> {new Date(v.expectedTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>
                                                <Link to="/guard/checkin" state={{ visitor: v }} className="btn btn-sm btn-primary rounded-pill px-3 shadow-sm">
                                                    Check In
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Checked-In List */}
                    <div className="col-lg-6">
                        <div className="card shadow-sm h-100 border-0">
                            <div className="card-header text-success border-0 d-flex align-items-center gap-2">
                                <FaUserCheck />
                                <span>Inside Premises ({checkedInVisitors.length})</span>
                            </div>
                            <div className="card-body p-0">
                                {checkedInVisitors.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <p className="mb-0">No visitors currently inside.</p>
                                    </div>
                                ) : (
                                    <div className="list-group list-group-flush">
                                        {checkedInVisitors.map(v => (
                                            <div key={v._id} className="list-group-item border-0 border-bottom py-3 px-4 d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6 className="fw-bold mb-1">{v.name}</h6>
                                                    <div className="d-flex gap-3 text-muted small">
                                                        <span>Villa: <strong>{v.unitNumber}</strong></span>
                                                        {v.vehicleNo && <span><FaCar className="me-1"/> {v.vehicleNo}</span>}
                                                    </div>
                                                    <small className="text-success d-block mt-1">In since: {new Date(v.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                                </div>
                                                <button className="btn btn-sm btn-outline-danger rounded-pill px-3" onClick={() => handleCheckOut(v._id)}>
                                                    Check Out
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageTransition>
    );
};

export default GuardDashboard;