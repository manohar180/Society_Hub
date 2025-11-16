import React, { useState, useEffect } from 'react';
import api from '../../api/api';

const VisitorLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/visitors/logs');
                setLogs(res.data);
            } catch (err) {
                setError('Failed to fetch visitor logs.');
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div className="text-center mt-5">Loading Visitor Logs...</div>;
    if (error) return <div className="alert alert-danger mt-5">{error}</div>;

    return (
        <div className="container mt-4">
            <h2>All Visitor Logs</h2>
            <p>Showing {logs.length} entries (latest first).</p>
            <table className="table table-striped table-sm">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Unit</th>
                        <th>Pre-Approved</th>
                        <th>Check-In</th>
                        <th>Check-Out</th>
                    </tr>
                </thead>
                <tbody>
                    {logs.map(log => (
                        <tr key={log._id}>
                            <td>{log.name}</td>
                            <td>{log.unitNumber}</td>
                            <td>{log.preApproved ? 'Yes' : 'No'}</td>
                            <td>{log.checkInTime ? new Date(log.checkInTime).toLocaleString() : '-'}</td>
                            <td>{log.checkOutTime ? new Date(log.checkOutTime).toLocaleString() : 'Active'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default VisitorLogs;