import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/api';
import PageTransition from '../../components/PageTransition';
import { motion } from 'framer-motion';
import { FaUsers, FaFileInvoiceDollar, FaCheckCircle, FaBell } from 'react-icons/fa';

const ResidentDashboard = () => {
    const { user } = useAuth();
    const [upcomingVisitors, setUpcomingVisitors] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]); 
    const [unpaidInvoices, setUnpaidInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const prevRequestCountRef = useRef(0);

    const fetchData = async () => {
        try {
            const visitorRes = await api.get('/visitors/resident');
            const upcoming = visitorRes.data.filter(v => v.approvalStatus === 'approved' && !v.checkInTime && v.preApproved).slice(0, 3);
            setUpcomingVisitors(upcoming);

            const requestRes = await api.get('/visitors/resident/pending-requests');
            const currentRequests = requestRes.data;
            setPendingRequests(currentRequests);

            if (currentRequests.length > prevRequestCountRef.current) { /* notify logic */ }
            prevRequestCountRef.current = currentRequests.length;

            const invoiceRes = await api.get('/invoices/my');
            const unpaid = invoiceRes.data.filter(i => i.status === 'pending' || i.status === 'overdue');
            setUnpaidInvoices(unpaid);
        } catch (err) { } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); 
        return () => clearInterval(interval);
    }, []);

    const handleResponse = async (id, status) => {
        try {
            await api.put(`/visitors/resident/respond-request/${id}`, { status });
            setPendingRequests(prev => prev.filter(req => req._id !== id));
            prevRequestCountRef.current = Math.max(0, prevRequestCountRef.current - 1);
            fetchData(); 
        } catch (err) { alert('Failed.'); }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.15, delayChildren: 0.2 }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
    };

    const cardHoverVariants = {
        rest: { scale: 1, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' },
        hover: { scale: 1.02, boxShadow: '0 20px 40px rgba(99,102,241,0.15)', transition: { duration: 0.3 } }
    };

    if (loading) {
        return (
            <div className="d-flex align-items-center justify-content-center min-vh-100">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                    <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <PageTransition>
            <div className="resident-dashboard-container">
                {/* Header Section */}
                <motion.div 
                    className="dashboard-header mb-5"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="container">
                        <div className="d-flex justify-content-between align-items-end">
                            <div>
                                <h1 className="fw-bold mb-1">Welcome back, <span className="text-primary">{user.name}</span>!</h1>
                                <p className="text-muted mb-0">Villa <strong>{user.unitNumber}</strong></p>
                            </div>
                            <motion.div
                                animate={{ y: [0, -5, 0] }}
                                transition={{ duration: 2, repeat: Infinity }}
                            >
                                <div className="fs-1">👋</div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>

                {/* Pending Requests Alert */}
                {pendingRequests.length > 0 && (
                    <motion.div 
                        className="container mb-5"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="alert-visitor-request p-4 rounded-lg border-start border-5 border-warning bg-light">
                            <div className="d-flex align-items-start mb-3">
                                <motion.div 
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="fs-3 me-3"
                                >
                                    🔔
                                </motion.div>
                                <div className="flex-grow-1">
                                    <h5 className="fw-bold mb-2 text-dark">Visitor at Gate</h5>
                                    <p className="text-muted mb-3">You have {pendingRequests.length} pending visitor request{pendingRequests.length > 1 ? 's' : ''}.</p>
                                </div>
                            </div>
                            <motion.div 
                                className="visitor-requests-list"
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                            >
                                {pendingRequests.map((req, idx) => (
                                    <motion.div 
                                        key={req._id} 
                                        variants={itemVariants}
                                        className="d-flex justify-content-between align-items-center p-3 bg-white rounded mb-2 border"
                                    >
                                        <div>
                                            <h6 className="fw-bold mb-1">{req.name}</h6>
                                            <div className="d-flex gap-2 align-items-center">
                                                <span className="badge bg-secondary small">{req.visitorType}</span>
                                                <small className="text-muted">{new Date(req.createdAt).toLocaleTimeString()}</small>
                                            </div>
                                        </div>
                                        <div className="d-flex gap-2">
                                            <motion.button 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn btn-sm btn-success rounded-pill px-3"
                                                onClick={() => handleResponse(req._id, 'approved')}
                                            >
                                                Allow
                                            </motion.button>
                                            <motion.button 
                                                whileHover={{ scale: 1.05 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn btn-sm btn-danger rounded-pill px-3"
                                                onClick={() => handleResponse(req._id, 'denied')}
                                            >
                                                Deny
                                            </motion.button>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* Main Cards Grid */}
                <motion.div 
                    className="container"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    <div className="row g-4">
                        {/* Upcoming Visitors Card */}
                        <div className="col-lg-6">
                            <motion.div 
                                variants={itemVariants}
                                whileHover="hover"
                                initial="rest"
                                animate="rest"
                                className="dashboard-card"
                            >
                                <motion.div 
                                    variants={cardHoverVariants}
                                    className="card h-100 border-0 shadow-sm"
                                >
                                    <div className="card-header bg-gradient-visitor border-0 p-4">
                                        <div className="d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-3">
                                                <div className="icon-circle bg-primary bg-opacity-10">
                                                    <FaUsers className="text-primary fs-5" />
                                                </div>
                                                <div>
                                                    <h5 className="mb-0 fw-bold dashboard-title">Upcoming Visitors</h5>
                                                    <small className="text-muted">Next 30 days</small>
                                                </div>
                                            </div>
                                            <motion.a 
                                                href="/resident/visitors"
                                                whileHover={{ scale: 1.1 }}
                                                whileTap={{ scale: 0.95 }}
                                                className="btn btn-sm btn-primary rounded-pill"
                                            >
                                                + Add
                                            </motion.a>
                                        </div>
                                    </div>
                                    <div className="card-body p-4">
                                        {upcomingVisitors.length === 0 ? (
                                            <motion.div 
                                                className="text-center py-5"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: 0.3 }}
                                            >
                                                <div className="fs-1 mb-2">📭</div>
                                                <p className="text-muted mb-0">No visitors scheduled.</p>
                                            </motion.div>
                                        ) : (
                                            <motion.ul 
                                                className="list-group list-group-flush"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                {upcomingVisitors.map((v, idx) => (
                                                    <motion.li 
                                                        key={v._id}
                                                        variants={itemVariants}
                                                        className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom"
                                                    >
                                                        <div>
                                                            <h6 className="mb-1 fw-bold">{v.name}</h6>
                                                            <small className="text-muted">{v.visitorType}</small>
                                                        </div>
                                                        <motion.span 
                                                            className="badge bg-primary-subtle text-primary rounded-pill px-3 py-2"
                                                            animate={{ y: [0, -2, 0] }}
                                                            transition={{ duration: 2, repeat: Infinity, delay: idx * 0.2 }}
                                                        >
                                                            {new Date(v.expectedTime).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                                        </motion.span>
                                                    </motion.li>
                                                ))}
                                            </motion.ul>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>

                        {/* Unpaid Invoices Card */}
                        <div className="col-lg-6">
                            <motion.div 
                                variants={itemVariants}
                                whileHover="hover"
                                initial="rest"
                                animate="rest"
                                className="dashboard-card"
                            >
                                <motion.div 
                                    variants={cardHoverVariants}
                                    className="card h-100 border-0 shadow-sm"
                                >
                                    <div className={`card-header bg-gradient-invoice border-0 p-4 ${unpaidInvoices.length > 0 ? 'bg-danger-light' : 'bg-success-light'}`}>
                                        <div className="d-flex align-items-center gap-3">
                                            <div className={`icon-circle ${unpaidInvoices.length > 0 ? 'bg-danger bg-opacity-10' : 'bg-success bg-opacity-10'}`}>
                                                <FaFileInvoiceDollar className={unpaidInvoices.length > 0 ? 'text-danger' : 'text-success'} />
                                            </div>
                                            <div>
                                                <h5 className="mb-0 fw-bold dashboard-title">Billing & Payments</h5>
                                                <small className="text-muted">{unpaidInvoices.length === 0 ? 'All paid' : `${unpaidInvoices.length} pending`}</small>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="card-body p-4">
                                        {unpaidInvoices.length === 0 ? (
                                            <motion.div 
                                                className="text-center py-5"
                                                animate={{ scale: [1, 1.05, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                            >
                                                <motion.div 
                                                    className="fs-1 mb-2"
                                                    animate={{ rotate: [0, 10, -10, 0] }}
                                                    transition={{ duration: 1.5, repeat: Infinity }}
                                                >
                                                    🎉
                                                </motion.div>
                                                <h6 className="text-success fw-bold mb-0">All Clear!</h6>
                                                <p className="text-muted small mb-0">No pending payments</p>
                                            </motion.div>
                                        ) : (
                                            <motion.ul 
                                                className="list-group list-group-flush"
                                                variants={containerVariants}
                                                initial="hidden"
                                                animate="visible"
                                            >
                                                {unpaidInvoices.map((i, idx) => (
                                                    <motion.li 
                                                        key={i._id}
                                                        variants={itemVariants}
                                                        className="list-group-item d-flex justify-content-between align-items-center px-0 py-3 border-bottom"
                                                    >
                                                        <div>
                                                            <h6 className="mb-1 fw-bold dashboard-title">
                                                                { (i.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }) }
                                                                <small className="text-muted ms-2">{i.lineItems && i.lineItems.length ? i.lineItems[0].description : 'Maintenance'}</small>
                                                            </h6>
                                                            <small className={i.status === 'overdue' ? 'text-danger' : 'text-warning'}>
                                                                {i.status === 'overdue' ? '⚠️ Overdue' : '⏰ Pending'} • Due: {new Date(i.dueDate).toLocaleDateString()}
                                                            </small>
                                                        </div>
                                                        <motion.a 
                                                            href="/resident/payments"
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                                                        >
                                                            Pay
                                                        </motion.a>
                                                    </motion.li>
                                                ))}
                                            </motion.ul>
                                        )}
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </PageTransition>
    );
};

export default ResidentDashboard;