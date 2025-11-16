import React from 'react';

const InvoiceCard = ({ invoice, onPay, isResidentView = false }) => {
    const statusClass = invoice.status === 'paid' ? 'success' : (invoice.status === 'pending' ? 'warning' : 'danger');

    return (
        <div className={`card border-${statusClass}`}>
            <div className={`card-header bg-${statusClass} text-white d-flex justify-content-between`}>
                <span>Invoice #{invoice._id.slice(-6).toUpperCase()}</span>
                <span className={`badge bg-light text-${statusClass}`}>{invoice.status.toUpperCase()}</span>
            </div>
            <div className="card-body">
                {!isResidentView && invoice.unitOwner && (
                    /* UPDATED LABEL */
                    <p className="card-text"><strong>Villa No.:</strong> {invoice.unitNumber} ({invoice.unitOwner.name})</p>
                )}
                
                <p className="card-text"><strong>Amount Due:</strong> <strong>{(invoice.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })}</strong></p>
                <p className="card-text"><strong>Due Date:</strong> {new Date(invoice.dueDate).toLocaleDateString()}</p>
                
                {invoice.lineItems.length > 0 && (
                    <div className="mt-2">
                        <small>Line Items:</small>
                        <ul className="list-unstyled mb-0">
                            {invoice.lineItems.map((item, index) => (
                                <li key={index}><small>- {item.description} ({(item.amount).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })})</small></li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {isResidentView && invoice.status === 'paid' && (
                    <p className="mt-3 text-success">Paid on: {new Date(invoice.paymentTime).toLocaleString()}</p>
                )}
                
                {isResidentView && invoice.status !== 'paid' && onPay && (
                    <button onClick={onPay} className={`btn btn-sm btn-outline-${statusClass} w-100 mt-3`}>
                        Mark as Paid (Simulate)
                    </button>
                )}
            </div>
        </div>
    );
};

export default InvoiceCard;