import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
    return (
        <div className="container text-center mt-5">
            <div className="alert alert-danger" role="alert">
                <h1 className="alert-heading">404 - Page Not Found 🧭</h1>
                <p>The page you are looking for does not exist or you do not have permission to access it.</p>
                <hr />
                <p className="mb-0">
                    <Link to="/" className="btn btn-primary">Go to Home/Login</Link>
                </p>
            </div>
        </div>
    );
};

export default NotFound;