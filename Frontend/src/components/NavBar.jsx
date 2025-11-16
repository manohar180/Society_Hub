import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NavBar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    if (!user) return null; 

    const handleLogout = () => { logout(); navigate('/login'); };

    let navLinks = [];
    let baseRoute = '';

    if (user.role === 'resident') {
        baseRoute = '/resident';
        navLinks = [ { path: '/dashboard', label: 'Home' }, { path: '/visitors', label: 'Visitors' }, { path: '/payments', label: 'Payments' } ];
    } else if (user.role === 'guard') {
        baseRoute = '/guard';
        navLinks = [ { path: '/dashboard', label: 'Home' }, { path: '/checkin', label: 'Check-In' } ];
    } else if (user.role === 'admin') {
        baseRoute = '/admin';
        navLinks = [ { path: '/dashboard', label: 'Home' }, { path: '/residents', label: 'Users' }, { path: '/invoices/create', label: 'Billing' } ];
    }

    const commonLinks = [ { path: '/community', label: 'Community' }, { path: '/profile', label: 'Profile' } ];

    return (
        <nav className="navbar navbar-expand-lg sticky-top">
            <div className="container-fluid">
                <NavLink className="navbar-brand" to="/">SocietyHub 🚀</NavLink>
                
                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarNav">
                    <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                        {[...navLinks.map(l => ({...l, to: baseRoute + l.path})), ...commonLinks.map(l => ({...l, to: l.path}))].map((link) => (
                            <li className="nav-item" key={link.to}>
                                <NavLink 
                                    to={link.to}
                                    className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
                                    end={link.to.includes('dashboard')} // precise matching for home
                                >
                                    {link.label}
                                </NavLink>
                            </li>
                        ))}
                    </ul>

                    <div className="d-flex align-items-center gap-3">
                        <small className="fw-bold text-muted d-none d-lg-block">{user.name}</small>
                        <button onClick={handleLogout} className="btn btn-sm btn-danger">Logout</button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default NavBar;