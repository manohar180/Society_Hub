import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import { useNavigate } from 'react-router-dom';

const CreateInvoice = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState('single'); 
    const [singleUnitNumber, setSingleUnitNumber] = useState('');
    const [allResidents, setAllResidents] = useState([]); 
    const [selectedResidentIds, setSelectedResidentIds] = useState([]); 

    const [formData, setFormData] = useState({
        dueDate: '',
        amount: 0,
        lineItems: []
    });

    const [lineItemInput, setLineItemInput] = useState({ description: '', amount: 0 });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchResidents = async () => {
            try {
                const res = await api.get('/admin/residents');
                const approved = res.data.filter(u => u.role === 'resident' && u.isApproved);
                setAllResidents(approved);
                setSelectedResidentIds(approved.map(u => u._id));
            } catch (err) {
                console.error("Could not fetch residents for bulk list");
            }
        };
        fetchResidents();
    }, []);

    const handleFormChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };
    
    const handleLineItemChange = (e) => {
        setLineItemInput({ ...lineItemInput, [e.target.name]: e.target.value });
    };

    const toggleResidentSelection = (id) => {
        if (selectedResidentIds.includes(id)) {
            setSelectedResidentIds(selectedResidentIds.filter(rId => rId !== id));
        } else {
            setSelectedResidentIds([...selectedResidentIds, id]);
        }
    };

    const addLineItem = () => {
        if (lineItemInput.description && lineItemInput.amount > 0) {
            setFormData({
                ...formData,
                lineItems: [...formData.lineItems, { description: lineItemInput.description, amount: Number(lineItemInput.amount) }]
            });
            setLineItemInput({ description: '', amount: 0 });
            const newTotal = formData.lineItems.reduce((sum, item) => sum + item.amount, 0) + Number(lineItemInput.amount);
            setFormData(prev => ({ ...prev, amount: newTotal }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (formData.amount <= 0 || !formData.dueDate) {
            setLoading(false);
            return setError('Total amount must be greater than zero and due date is required.');
        }
        // Build payload(s). If multiple line items exist we will create separate invoices
        // per line item so residents receive individual bills rather than a single summed bill.
        const dueDateISO = new Date(formData.dueDate).toISOString();

        // Validate selection based on mode
        if (mode === 'single' && !singleUnitNumber) {
            setLoading(false);
            return setError('Please enter a Villa/Unit Number.');
        }
        if (mode === 'bulk' && selectedResidentIds.length === 0) {
            setLoading(false);
            return setError('Please select at least one resident.');
        }

        try {
            let responses = [];

            // If there are multiple line items, create separate invoices per line item.
            // For single mode: create one invoice per line item for the specified Villa.
            // For bulk mode: for each line item, create invoices for all selected residents (backend handles residentIds).
            if (formData.lineItems && formData.lineItems.length > 1) {
                // Create an API call for each line item
                const calls = formData.lineItems.map(item => {
                    const p = {
                        amount: item.amount,
                        dueDate: dueDateISO,
                        lineItems: [{ description: item.description, amount: item.amount }],
                        isBulk: mode === 'bulk'
                    };
                    if (mode === 'single') p.unitNumber = singleUnitNumber;
                    else p.residentIds = selectedResidentIds;
                    return api.post('/invoices/create', p);
                });

                responses = await Promise.all(calls);
            } else {
                // Single or zero line items: fall back to original behavior (single invoice containing lineItems)
                const payload = {
                    amount: formData.amount,
                    dueDate: dueDateISO,
                    lineItems: formData.lineItems,
                    isBulk: mode === 'bulk'
                };
                if (mode === 'single') payload.unitNumber = singleUnitNumber;
                else payload.residentIds = selectedResidentIds;

                const res = await api.post('/invoices/create', payload);
                responses = [res];
            }

            // Count created invoices — backend may return arrays or counts; we infer from responses
            let createdCount = 0;
            responses.forEach(r => {
                if (r.data) {
                    if (Array.isArray(r.data.invoices)) createdCount += r.data.invoices.length;
                    else if (typeof r.data.count === 'number') createdCount += r.data.count;
                    else createdCount += 1;
                }
            });

            const successMsg = mode === 'bulk'
                ? `Successfully created ${createdCount} invoices for ${selectedResidentIds.length} resident(s)!`
                : `Successfully created ${createdCount} invoice(s)!`;

            setMessage(successMsg);
            setSingleUnitNumber('');
            setFormData({ dueDate: '', amount: 0, lineItems: [] });
            if (mode === 'bulk') setSelectedResidentIds(allResidents.map(u => u._id));
            setTimeout(() => navigate('/admin/dashboard'), 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Invoice creation failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mt-4">
            <h2>Generate Maintenance Invoice</h2>
            
            <form onSubmit={handleSubmit} className="card p-4 mx-auto shadow-sm" style={{ maxWidth: '800px' }}>
                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="mb-4 text-center">
                    <div className="btn-group" role="group">
                        <input type="radio" className="btn-check" name="mode" id="single" autoComplete="off" checked={mode === 'single'} onChange={() => setMode('single')} />
                        <label className="btn btn-outline-primary" htmlFor="single">Single Villa</label>

                        <input type="radio" className="btn-check" name="mode" id="bulk" autoComplete="off" checked={mode === 'bulk'} onChange={() => setMode('bulk')} />
                        <label className="btn btn-outline-primary" htmlFor="bulk">Bulk (All Residents)</label>
                    </div>
                </div>

                <div className="row">
                    {mode === 'single' && (
                        <div className="col-md-6 mb-3">
                            {/* UPDATED LABEL */}
                            <label className="form-label">Villa No.</label>
                            <input 
                                type="text" 
                                value={singleUnitNumber} 
                                onChange={(e) => setSingleUnitNumber(e.target.value)} 
                                className="form-control" 
                                placeholder="e.g. 9"
                            />
                        </div>
                    )}

                    <div className="col-md-6 mb-3">
                        <label className="form-label">Due Date</label>
                        <input type="date" name="dueDate" value={formData.dueDate} onChange={handleFormChange} required className="form-control" />
                    </div>
                </div>

                {mode === 'bulk' && (
                    <div className="mb-4">
                        <label className="form-label fw-bold">Select Residents ({selectedResidentIds.length} selected)</label>
                        <div className="card p-3 resident-selection-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            <div className="row g-2">
                                {allResidents.length === 0 ? (
                                    <p className="text-muted">No active residents found.</p>
                                ) : (
                                    allResidents.map(resident => {
                                        const isSelected = selectedResidentIds.includes(resident._id);
                                        return (
                                            <div key={resident._id} className="col-md-4 col-sm-6">
                                                <div
                                                    className={`resident-card ${isSelected ? 'selected' : 'unselected'} card`}
                                                    onClick={() => toggleResidentSelection(resident._id)}
                                                >
                                                    <div className="d-flex w-100 justify-content-between align-items-start">
                                                        <small className="fw-bold">Villa: {resident.unitNumber}</small>
                                                        {isSelected ? <span className="badge resident-badge-yes">✓</span> : <span className="badge resident-badge-no">✕</span>}
                                                    </div>
                                                    <small style={{ fontSize: '0.85rem' }}>{resident.name}</small>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <hr/>
                <h4>Line Items</h4>
                <div className="row g-2 mb-3 align-items-end">
                    <div className="col-md-6">
                        <label className="form-label">Description</label>
                        <input type="text" name="description" value={lineItemInput.description} onChange={handleLineItemChange} className="form-control" placeholder="e.g., Monthly Maintenance" />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Amount</label>
                        <input type="number" name="amount" value={lineItemInput.amount} onChange={handleLineItemChange} className="form-control" min="0" step="0.01" />
                    </div>
                    <div className="col-md-3">
                        <button type="button" onClick={addLineItem} className="btn btn-secondary w-100">Add Item</button>
                    </div>
                </div>

                <ul className="list-group mb-3">
                    {formData.lineItems.map((item, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between">
                            <span>{item.description}</span>
                            <span>{(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}</span>
                        </li>
                    ))}
                </ul>

                <h3 className="text-end">Total: { (formData.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }) }</h3>
                
                <button type="submit" className="btn btn-primary w-100 mt-3" disabled={loading}>
                    {loading ? 'Processing...' : (mode === 'bulk' ? `Send to ${selectedResidentIds.length} Residents` : 'Generate Invoice')}
                </button>
            </form>
        </div>
    );
};

export default CreateInvoice;