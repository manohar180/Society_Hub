import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import InvoiceCard from '../../components/InvoiceCard';

const InvoiceList = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterUnit, setFilterUnit] = useState(''); 
    const [appliedUnit, setAppliedUnit] = useState(''); 
    const [filterStatus, setFilterStatus] = useState('');
    const [appliedStatus, setAppliedStatus] = useState('');

    const fetchInvoices = async (unitFilter = '', statusFilter = '') => {
        setLoading(true);
        setError('');
        
        const params = [];
        if (unitFilter) params.push(`unitNumber=${unitFilter}`);
        if (statusFilter) params.push(`status=${statusFilter}`);
        const query = params.length ? `?${params.join('&')}` : '';
        
        try {
            const res = await api.get(`/invoices/all${query}`);
            setInvoices(res.data);
            setAppliedUnit(unitFilter);
            setAppliedStatus(statusFilter);
        } catch (err) {
            setError('Failed to fetch all invoices.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleFilterSubmit = (e) => {
        e.preventDefault();
        fetchInvoices(filterUnit.trim(), filterStatus);
    };
    
    const handleClearFilter = () => {
        setFilterUnit('');
        setFilterStatus('');
        fetchInvoices('', '');
    };

    if (error) return <div className="alert alert-danger mt-5">{error}</div>;

    return (
        <div className="container mt-4">
            <h2>All Maintenance Invoices</h2>
            
            <div className="card p-3 mb-4">
                <form onSubmit={handleFilterSubmit} className="row g-2 align-items-center">
                    <div className="col-md-3">
                        <label htmlFor="unitFilter" className="form-label mb-0 fw-bold">Filter by Villa No.</label>
                    </div>
                    <div className="col-md-3">
                        <input 
                            type="text" 
                            id="unitFilter"
                            className="form-control" 
                            value={filterUnit} 
                            onChange={(e) => setFilterUnit(e.target.value)}
                            placeholder="e.g., 9"
                        />
                    </div>

                    <div className="col-md-3">
                        <label htmlFor="statusFilter" className="form-label mb-0 fw-bold">Status</label>
                        <select id="statusFilter" className="form-select mt-1" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                            <option value="">All</option>
                            <option value="paid">Paid</option>
                            <option value="unpaid">Unpaid</option>
                        </select>
                    </div>

                    <div className="col-md-1">
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            Apply
                        </button>
                    </div>
                    <div className="col-md-2">
                        <button type="button" onClick={handleClearFilter} className="btn btn-outline-secondary w-100">
                            Clear
                        </button>
                    </div>
                </form>
            </div>

            <h4>
                Invoices 
                {appliedUnit ? `: Villa ${appliedUnit}` : ''}
                {appliedStatus ? `${appliedUnit ? ' •' : ':'} ${appliedStatus.toUpperCase()}` : (appliedUnit ? '' : ' : Showing All')}
                <span className="badge bg-secondary ms-2">{invoices.length} Found</span>
            </h4>
            
            {loading ? (
                <div className="text-center mt-5">Loading...</div>
            ) : (
                <div className="row mt-3">
                    {invoices.length === 0 ? (
                        <p className="ms-3">No invoices found matching the current filter.</p>
                    ) : (
                        invoices.map(invoice => (
                            <div key={invoice._id} className="col-md-6 mb-4">
                                <InvoiceCard invoice={invoice} isResidentView={false} />
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default InvoiceList;