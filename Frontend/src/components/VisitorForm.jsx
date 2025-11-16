import React, { useState } from 'react';
import api from '../api/api';

const VisitorForm = ({ onSubmissionSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        expectedTime: '',
        visitorType: 'guest'
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        
        // Ensure expectedTime is set, default to 1 hour from now if left empty
        const expectedDate = formData.expectedTime 
            ? new Date(formData.expectedTime) 
            : new Date(new Date().getTime() + 60 * 60 * 1000); 

        try {
            await api.post('/visitors/pre-approve', {
                ...formData,
                expectedTime: expectedDate.toISOString()
            });
            setMessage('Visitor pre-approved successfully! Guard will be notified.');
            setFormData({ name: '', phone: '', expectedTime: '', visitorType: 'guest' }); // Reset form
            onSubmissionSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Pre-approval failed. Please try again.');
        }
    };

    return (
        <div className="card p-3">
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input type="text" name="name" value={formData.name} onChange={handleChange} required className="form-control" placeholder="Visitor Name" />
                </div>
                <div className="mb-3">
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} required className="form-control" placeholder="Visitor Phone" />
                </div>
                <div className="mb-3">
                    <label className="form-label">Expected Date/Time</label>
                    <input type="datetime-local" name="expectedTime" value={formData.expectedTime} onChange={handleChange} required className="form-control" />
                </div>
                <div className="mb-3">
                    <select name="visitorType" value={formData.visitorType} onChange={handleChange} className="form-select">
                        <option value="guest">Guest</option>
                        <option value="delivery">Delivery</option>
                        <option value="service">Service/Utility</option>
                        <option value="other">Other</option>
                    </select>
                </div>
                <button type="submit" className="btn btn-info w-100">Pre-Approve Visitor</button>
            </form>
        </div>
    );
};

export default VisitorForm;