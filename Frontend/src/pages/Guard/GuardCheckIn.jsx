import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/api';

const GuardCheckIn = ({ action = 'checkin' }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [mode, setMode] = useState('approved'); 
    const preApprovedVisitor = location.state?.visitor;

    const [formData, setFormData] = useState({
        visitorId: '', 
        name: '',
        phone: '',
        unitNumber: '',
        vehicleNo: '',
        visitorType: 'guest',
        qrCodePlaceholder: ''
    });
    
    // New State for Resident Contact Lookup
    const [residentContact, setResidentContact] = useState(null);
    const [lookupLoading, setLookupLoading] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [visitorIdToCheckout, setVisitorIdToCheckout] = useState('');
    
    // Checkout page states
    const [checkoutMode, setCheckoutMode] = useState('list'); // 'list' or 'manual'
    const [checkedInVisitors, setCheckedInVisitors] = useState([]);
    const [loadingVisitors, setLoadingVisitors] = useState(true);

    useEffect(() => {
        if (preApprovedVisitor) {
            setFormData(prev => ({
                ...prev,
                visitorId: preApprovedVisitor._id,
                name: preApprovedVisitor.name,
                phone: preApprovedVisitor.phone,
                unitNumber: preApprovedVisitor.unitNumber,
                visitorType: preApprovedVisitor.visitorType,
            }));
            setMessage(`Checking in Approved Visitor: ${preApprovedVisitor.name}`);
        }
    }, [preApprovedVisitor]);

    // Fetch checked-in visitors for checkout page
    useEffect(() => {
        if (action === 'checkout') {
            fetchCheckedInVisitors();
        }
    }, [action]);

    const fetchCheckedInVisitors = async () => {
        try {
            setLoadingVisitors(true);
            const res = await api.get('/visitors/guard/checked-in');
            setCheckedInVisitors(res.data);
        } catch (err) {
            setError('Failed to load checked-in visitors.');
        } finally {
            setLoadingVisitors(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // --- NEW FUNCTION: LOOKUP RESIDENT ---
    const handleLookupResident = async () => {
        if(!formData.unitNumber) return;
        setLookupLoading(true);
        setResidentContact(null);
        setError('');
        
        try {
            const res = await api.get(`/visitors/guard/lookup/${formData.unitNumber}`);
            setResidentContact(res.data);
        } catch (err) {
            setResidentContact(null);
             // Don't show error alert, just small text is better, but for now logging
             console.log("Resident not found");
        } finally {
            setLookupLoading(false);
        }
    };

    const handleCheckInSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        const payload = preApprovedVisitor ? 
            { visitorId: preApprovedVisitor._id, vehicleNo: formData.vehicleNo } : 
            formData; 

        try {
            const res = await api.post('/visitors/guard/check-in', payload);
            setMessage(`Success: Checked in ${res.data.visitor.name} to Villa ${res.data.visitor.unitNumber}.`);
            setFormData({ visitorId: '', name: '', phone: '', unitNumber: '', vehicleNo: '', visitorType: 'guest', qrCodePlaceholder: '' });
            setTimeout(() => navigate('/guard/dashboard'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-in failed.');
        }
    };

    const handleRequestSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        try {
            await api.post('/visitors/guard/request-entry', formData);
            setMessage('Request sent to Resident! Ask visitor to wait. Check Dashboard for approval status.');
            // Reset form but keep resident info visible for a moment
            setFormData({ visitorId: '', name: '', phone: '', unitNumber: '', vehicleNo: '', visitorType: 'guest', qrCodePlaceholder: '' });
            setTimeout(() => setResidentContact(null), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send request. Check Villa Number.');
        }
    };

    const handleCheckOut = async (visitorId) => {
        try {
            const res = await api.post(`/visitors/guard/check-out/${visitorId}`);
            setMessage(`✅ Successfully checked out ${res.data.visitor.name}.`);
            setCheckedInVisitors(prev => prev.filter(v => v._id !== visitorId));
            setTimeout(() => setMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-out failed.');
        }
    };
    
    const handleCheckOutSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        try {
            const res = await api.post(`/visitors/guard/check-out/${visitorIdToCheckout}`);
            setMessage(`✅ Successfully checked out visitor ID: ${res.data.visitor._id}.`);
            setVisitorIdToCheckout('');
            setTimeout(() => navigate('/guard/dashboard'), 1500);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-out failed. Invalid ID or already checked out.');
        }
    };

    if (action === 'checkout') {
        return (
            <div className="container mt-4">
                <h2 className="mb-4">Visitor Check-Out</h2>
                
                <div className="btn-group mb-4 w-100">
                    <button 
                        className={`btn ${checkoutMode === 'list' ? 'btn-primary' : 'btn-outline-primary'}`} 
                        onClick={() => setCheckoutMode('list')}
                    >
                        📋 Select from List
                    </button>
                    <button 
                        className={`btn ${checkoutMode === 'manual' ? 'btn-warning' : 'btn-outline-warning'}`} 
                        onClick={() => setCheckoutMode('manual')}
                    >
                        ⌨️ Manual ID Entry
                    </button>
                </div>

                {message && <div className="alert alert-success alert-dismissible fade show" role="alert">{message}<button type="button" className="btn-close" onClick={() => setMessage('')}></button></div>}
                {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">{error}<button type="button" className="btn-close" onClick={() => setError('')}></button></div>}

                {checkoutMode === 'list' ? (
                    <div className="card p-4 mx-auto" style={{ maxWidth: '600px' }}>
                        <h5 className="mb-3">Currently Checked-In Visitors</h5>
                        {loadingVisitors ? (
                            <div className="text-center py-4"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>
                        ) : checkedInVisitors.length === 0 ? (
                            <div className="alert alert-info mb-0">No visitors currently checked in.</div>
                        ) : (
                            <div className="list-group">
                                {checkedInVisitors.map(visitor => (
                                    <div key={visitor._id} className="list-group-item d-flex justify-content-between align-items-center p-3 border">
                                        <div>
                                            <h6 className="fw-bold mb-1">{visitor.name}</h6>
                                            <small className="text-muted d-block">Villa: {visitor.unitNumber}</small>
                                            {visitor.vehicleNo && <small className="text-muted d-block">Vehicle: {visitor.vehicleNo}</small>}
                                            <small className="text-success d-block">In since: {new Date(visitor.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</small>
                                        </div>
                                        <button 
                                            className="btn btn-danger btn-sm rounded-pill"
                                            onClick={() => {
                                                if (window.confirm(`Check out ${visitor.name}?`)) {
                                                    handleCheckOut(visitor._id);
                                                }
                                            }}
                                        >
                                            Check Out
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <button className="btn btn-secondary mt-3 w-100" onClick={fetchCheckedInVisitors}>🔄 Refresh List</button>
                    </div>
                ) : (
                    <form onSubmit={handleCheckOutSubmit} className="card p-4 mx-auto" style={{ maxWidth: '500px' }}>
                        <h5 className="mb-3">Enter Visitor ID</h5>
                        <div className="mb-3">
                            <label className="form-label">Visitor Record ID</label>
                            <input 
                                type="text" 
                                value={visitorIdToCheckout} 
                                onChange={(e) => setVisitorIdToCheckout(e.target.value)} 
                                required 
                                className="form-control" 
                                placeholder="Paste or scan Visitor ID..." 
                                autoFocus
                            />
                            <small className="text-muted d-block mt-2">You can find the Visitor ID in the list above, or ask the visitor for it.</small>
                        </div>
                        <button type="submit" className="btn btn-danger w-100">Confirm Check-Out</button>
                    </form>
                )}
            </div>
        );
    }
    
    return (
        <div className="container mt-4">
            <h2>Guard Gate Entry</h2>

            <div className="btn-group mb-4 w-100">
                <button 
                    className={`btn ${mode === 'approved' ? 'btn-primary' : 'btn-outline-primary'}`} 
                    onClick={() => setMode('approved')}
                    disabled={!!preApprovedVisitor} 
                >
                    Check-In (Approved)
                </button>
                <button 
                    className={`btn ${mode === 'request' ? 'btn-warning' : 'btn-outline-warning'}`} 
                    onClick={() => setMode('request')}
                    disabled={!!preApprovedVisitor}
                >
                    Request Entry (Sudden)
                </button>
            </div>

            {message && <div className="alert alert-info">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            {mode === 'approved' ? (
                <form onSubmit={handleCheckInSubmit} className="card p-4 mx-auto" style={{ maxWidth: '500px' }}>
                    <h4>Check-In Approved Visitor</h4>
                    {preApprovedVisitor ? (
                        <p className="text-success">Selected: <strong>{preApprovedVisitor.name}</strong> (Villa {preApprovedVisitor.unitNumber})</p>
                    ) : (
                         <div className="mb-3">
                            <p className="text-muted">Please select an approved visitor from the <a href="/guard/dashboard">Dashboard</a> or enter ID manually.</p>
                            <input type="text" name="visitorId" value={formData.visitorId} onChange={handleChange} placeholder="Visitor ID" className="form-control mb-3" />
                         </div>
                    )}

                    <div className="mb-3">
                        <label className="form-label">Vehicle No (Optional)</label>
                        <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="form-control" />
                    </div>
                    
                    <button type="submit" className="btn btn-success w-100">Confirm Check-In</button>
                </form>
            ) : (
                <form onSubmit={handleRequestSubmit} className="card p-4 mx-auto border-warning" style={{ maxWidth: '500px' }}>
                    <h4 className="text-warning">Request Sudden Entry</h4>
                    <p className="text-muted small">This will send a notification to the resident for approval.</p>
                    
                    <div className="mb-3">
                        <label className="form-label">Villa No.</label>
                        <div className="input-group">
                            <input 
                                type="text" 
                                name="unitNumber" 
                                value={formData.unitNumber} 
                                onChange={handleChange} 
                                required 
                                className="form-control" 
                                placeholder="Enter Villa No."
                            />
                            <button className="btn btn-outline-secondary" type="button" onClick={handleLookupResident}>
                                🔍 Check
                            </button>
                        </div>
                        {/* --- CONTACT DETAILS DISPLAY --- */}
                        {lookupLoading && <small className="text-muted">Looking up resident...</small>}
                        {residentContact && (
                            <div className="alert alert-secondary mt-2 p-2">
                                <strong>Owner:</strong> {residentContact.name}<br/>
                                <div className="d-grid gap-2 mt-2">
                                    <a href={`tel:${residentContact.phone}`} className="btn btn-sm btn-outline-success">
                                        📞 Call Primary: {residentContact.phone}
                                    </a>
                                    {residentContact.phoneSecondary && (
                                        <a href={`tel:${residentContact.phoneSecondary}`} className="btn btn-sm btn-outline-success">
                                            📞 Call Secondary: {residentContact.phoneSecondary}
                                        </a>
                                    )}
                                </div>
                            </div>
                        )}
                        {/* ------------------------------- */}
                    </div>
                    
                    <div className="mb-3">
                        <label className="form-label">Visitor Name</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Phone</label>
                        <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Vehicle No</label>
                        <input type="text" name="vehicleNo" value={formData.vehicleNo} onChange={handleChange} className="form-control" />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Type</label>
                        <select name="visitorType" value={formData.visitorType} onChange={handleChange} className="form-select">
                            <option value="guest">Guest</option>
                            <option value="delivery">Delivery</option>
                            <option value="service">Service</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    
                    <button type="submit" className="btn btn-warning w-100">Send Approval Request</button>
                </form>
            )}
        </div>
    );
};

export default GuardCheckIn;