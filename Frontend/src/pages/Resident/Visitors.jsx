import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import VisitorForm from '../../components/VisitorForm';

const ResidentVisitors = () => {
    const [visitors, setVisitors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchVisitors = async () => {
        try {
            const res = await api.get('/visitors/resident');
            setVisitors(res.data);
        } catch (err) {
            setError('Failed to fetch visitor list.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVisitors();
    }, []);

    const handlePreApprove = () => {
        fetchVisitors(); // Refresh list after successful approval
    };

    if (loading) return <div className="text-center mt-5">Loading Visitors...</div>;

    return (
        <div className="container mt-4">
            <h2>Visitor Management</h2>
            {error && <div className="alert alert-danger">{error}</div>}
            
            <div className="row">
                <div className="col-md-5">
                    <h4 className="mt-3">Pre-Approve New Visitor</h4>
                    <VisitorForm onSubmissionSuccess={handlePreApprove} />
                </div>

                <div className="col-md-7">
                    <h4 className="mt-3">Your Visitor History & Approvals</h4>
                    <table className="table table-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Expected</th>
                                <th>Status</th>
                                <th>Checked In</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visitors.map(v => (
                                <tr key={v._id}>
                                    <td>{v.name}</td>
                                    <td>{v.visitorType}</td>
                                    <td>{v.expectedTime ? new Date(v.expectedTime).toLocaleString() : 'N/A'}</td>
                                    <td>
                                        <span className={`badge bg-${v.preApproved ? 'success' : 'secondary'}`}>
                                            {v.preApproved ? 'Approved' : 'Manual'}
                                        </span>
                                    </td>
                                    <td>{v.checkInTime ? new Date(v.checkInTime).toLocaleString() : 'Pending'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ResidentVisitors;