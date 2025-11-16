import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { Link } from 'react-router-dom';
import PageTransition from '../../components/PageTransition';
import { FaUsers, FaFileInvoiceDollar, FaUserShield, FaBell, FaClipboardList } from 'react-icons/fa';

const AdminDashboard = () => {
    const [stats, setStats] = useState({ residents: 0, pendingApprovals: 0, invoices: 0, checkedInVisitors: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const residentRes = await api.get('/admin/residents');
                const allUsers = residentRes.data;
                const residents = allUsers.filter(u => u.role === 'resident' && u.isApproved);
                const pending = allUsers.filter(u => !u.isApproved);
                const invoiceRes = await api.get('/invoices/all');
                const allInvoices = invoiceRes.data;
                const visitorLogRes = await api.get('/visitors/logs');
                const checkedIn = visitorLogRes.data.filter(v => v.checkInTime && !v.checkOutTime);

                setStats({ residents: residents.length, pendingApprovals: pending.length, invoices: allInvoices.length, checkedInVisitors: checkedIn.length });
            } catch (err) { console.error(err); } finally { setLoading(false); }
        };
        fetchData();
    }, []);

    if (loading) return <div className="text-center mt-5 spinner-border text-primary"></div>;

    const cards = [
        { title: "Total Residents", value: stats.residents, link: "/admin/residents", icon: <FaUsers/>, bg: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)" },
        { title: "Pending Approvals", value: stats.pendingApprovals, link: "/admin/residents", icon: <FaUserShield/>, bg: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)" },
        { title: "Generated Invoices", value: stats.invoices, link: "/admin/invoices/all", icon: <FaFileInvoiceDollar/>, bg: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" },
        { title: "Visitors Checked In", value: stats.checkedInVisitors, link: "/admin/visitor-logs", icon: <FaBell/>, bg: "linear-gradient(135deg, #10b981 0%, #059669 100%)" },
    ];

    return (
        <PageTransition>
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold">Admin Overview</h2>
                    {/* FIXED DATE VISIBILITY: Removed bg-white, added 'card' class so it adapts */}
                    <span className="card px-3 py-2 shadow-sm mb-0 border small fw-bold">
                        📅 {new Date().toDateString()}
                    </span>
                </div>

                <div className="row">
                    {cards.map((card, index) => (
                        <div className="col-md-3 mb-4" key={index}>
                            <div className="card text-white shadow h-100 border-0" style={{ background: card.bg }}>
                                <div className="card-body p-4">
                                    <div className="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h6 className="card-title opacity-75 text-uppercase small fw-bold">{card.title}</h6>
                                            <h2 className="display-5 fw-bold mb-0">{card.value}</h2>
                                        </div>
                                        <div className="fs-2 opacity-50">{card.icon}</div>
                                    </div>
                                    {card.link && (
                                        <Link to={card.link} className="btn btn-sm btn-light text-dark mt-3 px-3 fw-bold rounded-pill shadow-sm">
                                            View Details
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <h4 className="mt-4 mb-3 fw-bold">Quick Actions</h4>
                <div className="d-flex gap-3 flex-wrap">
                    <Link to="/admin/invoices/create" className="btn btn-primary py-2 px-4 shadow-sm d-flex align-items-center gap-2">
                        <FaFileInvoiceDollar /> Create Invoice
                    </Link>
                    <Link to="/admin/residents" className="btn btn-outline-primary py-2 px-4 d-flex align-items-center gap-2">
                        <FaUsers /> Manage Users
                    </Link>
                    <Link to="/community" className="btn btn-outline-secondary py-2 px-4 d-flex align-items-center gap-2">
                        <FaClipboardList /> Community Board
                    </Link>
                </div>
            </div>
        </PageTransition>
    );
};

export default AdminDashboard;