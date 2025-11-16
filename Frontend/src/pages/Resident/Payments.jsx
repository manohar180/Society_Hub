import React, { useState, useEffect } from 'react';
import api from '../../api/api';
import InvoiceCard from '../../components/InvoiceCard';

const ResidentPayments = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/invoices/my');
            setInvoices(res.data);
        } catch (err) {
            setError('Failed to fetch invoices.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const handleMarkPaid = async (invoiceId) => {
        try {
            await api.put(`/invoices/pay/${invoiceId}`);
            alert('Payment simulated successfully!');
            fetchInvoices(); // Refresh list
        } catch (err) {
            setError('Failed to mark invoice as paid.');
            console.error(err);
        }
    };

    if (loading) return <div className="text-center mt-5">Loading Payments...</div>;
    if (error) return <div className="alert alert-danger mt-5">{error}</div>;

    const pendingInvoices = invoices.filter(i => i.status !== 'paid');
    const paidInvoices = invoices.filter(i => i.status === 'paid');

    return (
        <div className="container mt-4">
            <h2>Maintenance Billing & Payments</h2>
            
            <h4 className="mt-4">Pending Invoices ({pendingInvoices.length})</h4>
            <div className="row">
                {pendingInvoices.length === 0 ? (
                    <p className="ms-3">No pending invoices.</p>
                ) : (
                    pendingInvoices.map(invoice => (
                        <div key={invoice._id} className="col-md-6 mb-4">
                            <InvoiceCard 
                                invoice={invoice} 
                                onPay={() => handleMarkPaid(invoice._id)} 
                                isResidentView={true} 
                            />
                        </div>
                    ))
                )}
            </div>

            <h4 className="mt-4">Payment History ({paidInvoices.length})</h4>
            <div className="row">
                {paidInvoices.map(invoice => (
                    <div key={invoice._id} className="col-md-6 mb-4">
                        <InvoiceCard invoice={invoice} isResidentView={true} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ResidentPayments;