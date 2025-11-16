import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const ResidentList = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [staffData, setStaffData] = useState({ name: '', email: '', password: '', role: 'guard', phone: '' });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/residents');
            setUsers(res.data);
        } catch (err) {
            setError('Failed to fetch user list.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleApprove = async (userId) => {
        try {
            await api.put(`/admin/approve-user/${userId}`);
            setMessage(`User ID ${userId} approved successfully.`);
            fetchUsers();
        } catch (err) {
            setError('Failed to approve user.');
        }
    };

    const handleDelete = async (userId, userName) => {
        if (!window.confirm(`Are you sure you want to delete user ${userName}? This action is irreversible.`)) {
            return;
        }
        try {
            const res = await api.delete(`/admin/user/${userId}`);
            setMessage(res.data.message);
            fetchUsers(); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete user.');
        }
    };

    const handleStaffChange = (e) => {
        setStaffData({ ...staffData, [e.target.name]: e.target.value });
    };

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await api.post('/admin/create-staff', staffData);
            setMessage(res.data.message);
            setStaffData({ name: '', email: '', password: '', role: 'guard', phone: '' });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create staff account.');
        }
    };

    if (loading) return <div className="text-center mt-5">Loading User List...</div>;

    const pendingUsers = users.filter(u => !u.isApproved);
    const approvedResidents = users.filter(u => u.isApproved && u.role === 'resident');
    const staffUsers = users.filter(u => u.isApproved && (u.role === 'guard' || u.role === 'admin'));

    return (
        <div className="container mt-4">
            <h2>User & Resident Management</h2>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <h4 className="mt-4">Pending Approvals ({pendingUsers.length})</h4>
            <ul className="list-group mb-4">
                {pendingUsers.length === 0 ? (
                    <li className="list-group-item text-success">No pending users awaiting approval.</li>
                ) : (
                    pendingUsers.map(u => (
                        <li key={u._id} className="list-group-item d-flex justify-content-between align-items-center bg-light">
                            <span>**{u.name}** ({u.role.toUpperCase()}) - Villa No: {u.unitNumber}</span>
                            <button className="btn btn-sm btn-success" onClick={() => handleApprove(u._id)}>Approve</button>
                        </li>
                    ))
                )}
            </ul>
            
            <div className="row">
                <div className="col-md-6">
                    <h4 className="mt-4">Approved Residents ({approvedResidents.length})</h4>
                    <table className="table table-sm table-striped">
                        <thead>
                            <tr>
                                {/* UPDATED HEADER */}
                                <th>Villa No.</th>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {approvedResidents.map(u => (
                                <tr key={u._id}>
                                    {/* DATA ACCESS REMAINS unitNumber */}
                                    <td>{u.unitNumber}</td>
                                    <td>{u.name}</td>
                                    <td>{u.email}</td>
                                    <td>
                                        <button 
                                            className="btn btn-sm btn-danger" 
                                            onClick={() => handleDelete(u._id, u.name)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="col-md-6">
                    <h4 className="mt-4">Create Guard/Admin Account</h4>
                    <form onSubmit={handleCreateStaff} className="card p-3">
                        <div className="mb-2"><input type="text" name="name" value={staffData.name} onChange={handleStaffChange} required className="form-control" placeholder="Name" /></div>
                        <div className="mb-2"><input type="email" name="email" value={staffData.email} onChange={handleStaffChange} required className="form-control" placeholder="Email" /></div>
                        <div className="mb-2"><input type="password" name="password" value={staffData.password} onChange={handleStaffChange} required className="form-control" placeholder="Password" /></div>
                        <div className="mb-2"><input type="text" name="phone" value={staffData.phone} onChange={handleStaffChange} className="form-control" placeholder="Phone (Optional)" /></div>
                        <div className="mb-3">
                            <select name="role" value={staffData.role} onChange={handleStaffChange} className="form-select">
                                <option value="guard">Guard</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <button type="submit" className="btn btn-primary w-100">Create Staff</button>
                    </form>
                </div>
            </div>
            
            <h4 className="mt-4">Staff Accounts ({staffUsers.length})</h4>
            <table className="table table-sm table-striped">
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {staffUsers.map(u => (
                        <tr key={u._id}>
                            <td>{u.role.toUpperCase()}</td>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                                {u.role === 'admin' && u.email === user.email ? (
                                    <span className="text-info">Current User</span>
                                ) : (
                                    <button 
                                        className="btn btn-sm btn-danger" 
                                        onClick={() => handleDelete(u._id, u.name)}
                                        disabled={u.role === 'admin' && u.email !== user.email} 
                                    >
                                        Delete
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ResidentList;