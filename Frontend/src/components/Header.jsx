import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
            <div className="container-fluid">
                <a className="navbar-brand" href="/">🏠 SocietyHub</a>
                
                {user && (
                    <div className="d-flex">
                        <span className="navbar-text me-3">
                            Logged in as: **{user.name}** ({user.role.toUpperCase()})
                        </span>
                        <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Header;