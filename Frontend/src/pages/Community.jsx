import React, { useState, useEffect } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client'; 
import PageTransition from '../components/PageTransition';
import { FaBullhorn, FaTools, FaEdit, FaTrash, FaCheck, FaPlus, FaTimes, FaImage } from 'react-icons/fa';

const Community = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('notices'); 
    const [notices, setNotices] = useState([]);
    const [complaints, setComplaints] = useState([]);
    
    const [noticeForm, setNoticeForm] = useState({ title: '', content: '', priority: 'medium' });
    
    const [complaintForm, setComplaintForm] = useState({ title: '', description: '' });
    const [complaintImage, setComplaintImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null); 
    const [isSubmittingComplaint, setIsSubmittingComplaint] = useState(false);

    const [editingNoticeId, setEditingNoticeId] = useState(null);
    const [editingComplaintId, setEditingComplaintId] = useState(null);

    const fetchData = async () => {
        try {
            const [resNotice, resComplaint] = await Promise.all([
                api.get('/community/notices'),
                api.get('/community/complaints')
            ]);
            setNotices(resNotice.data);
            setComplaints(resComplaint.data);
        } catch (err) {
            console.error("Error fetching community data");
        }
    };

    useEffect(() => {
        fetchData();
        const socket = io('http://localhost:5000'); 
        socket.on('community_update', () => {
            fetchData(); 
        });
        return () => socket.disconnect();
    }, []);

    // --- NOTICE HANDLERS ---
    const startEditNotice = (n) => { setEditingNoticeId(n._id); setNoticeForm(n); window.scrollTo({top:0, behavior:'smooth'}); };
    const cancelEditNotice = () => { setEditingNoticeId(null); setNoticeForm({title:'', content:'', priority:'medium'}); };
    
    const handlePostNotice = async (e) => { 
        e.preventDefault(); 
        try { 
            if(editingNoticeId) { 
                await api.put(`/community/notices/${editingNoticeId}`, noticeForm); 
                setEditingNoticeId(null); 
            } else { 
                await api.post('/community/notices', noticeForm); 
            } 
            setNoticeForm({title:'', content:'', priority:'medium'}); 
        } catch(e){ alert('Error'); } 
    };
    
    const handleDeleteNotice = async (id) => { 
        if(window.confirm("Delete?")) try { await api.delete(`/community/notices/${id}`); } catch(e){} 
    };

    // --- COMPLAINT HANDLERS ---
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setComplaintImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const clearImageSelection = () => {
        setComplaintImage(null);
        setImagePreview(null);
    };

    const startEditComplaint = (c) => { 
        setEditingComplaintId(c._id); 
        setComplaintForm(c); 
        window.scrollTo({top:0, behavior:'smooth'}); 
    };
    
    const cancelEditComplaint = () => { 
        setEditingComplaintId(null); 
        setComplaintForm({title:'', description:''}); 
        clearImageSelection(); 
    };
    
    const handlePostComplaint = async (e) => {
        e.preventDefault();
        setIsSubmittingComplaint(true);
        try {
            let res;
            if (editingComplaintId) {
                res = await api.put(`/community/complaints/${editingComplaintId}`, complaintForm);
                setEditingComplaintId(null);
            } else {
                const formData = new FormData();
                formData.append('title', complaintForm.title);
                formData.append('description', complaintForm.description);
                if (complaintImage) formData.append('image', complaintImage);
                
                res = await api.post('/community/complaints', formData);
            }

            // Use the full response data from backend which includes imageUrl and populated postedBy
            const newComplaint = res.data;
            console.log('Posted complaint:', newComplaint); // Debug log
            
            if(editingComplaintId) {
                 setComplaints(prev => prev.map(c => c._id === editingComplaintId ? newComplaint : c));
            } else {
                 setComplaints(prev => [newComplaint, ...prev]);
            }

            setComplaintForm({ title: '', description: '' });
            clearImageSelection();
        } catch (error) { 
            console.error('Complaint upload error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            alert('Upload/Update Failed: ' + errorMsg); 
        } finally {
            setIsSubmittingComplaint(false);
        }
    };
    
    const handleDeleteComplaint = async (id) => { if(window.confirm("Delete?")) try { await api.delete(`/community/complaints/${id}`); } catch(e){} };
    const handleResolveComplaint = async (id) => { try { await api.put(`/community/complaints/${id}/resolve`); } catch(e){} };

    return (
        <PageTransition>
            <div className="container mt-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2 className="fw-bold">Community Hub</h2>
                </div>
                
                <div className="d-flex gap-2 mb-4">
                    <button className={`btn ${activeTab === 'notices' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('notices')}>
                        <FaBullhorn className="me-2"/> Notices
                    </button>
                    <button className={`btn ${activeTab === 'complaints' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setActiveTab('complaints')}>
                        <FaTools className="me-2"/> Helpdesk
                    </button>
                </div>

                {/* --- NOTICES SECTION --- */}
                {activeTab === 'notices' && (
                    <div className="row">
                        <div className="col-lg-4 mb-4">
                            <div className={`card p-3 ${editingNoticeId ? 'border-warning' : ''}`}>
                                <h5 className="fw-bold mb-3">{editingNoticeId ? '✏️ Edit Notice' : '➕ Post Announcement'}</h5>
                                <form onSubmit={handlePostNotice}>
                                    <input className="form-control mb-2" placeholder="Title" value={noticeForm.title} onChange={e => setNoticeForm({...noticeForm, title: e.target.value})} required />
                                    <select className="form-select mb-2" value={noticeForm.priority} onChange={e => setNoticeForm({...noticeForm, priority: e.target.value})}>
                                        <option value="low">Low Priority</option>
                                        <option value="medium">Medium Priority</option>
                                        <option value="high">High Priority</option>
                                    </select>
                                    <textarea className="form-control mb-3" rows="3" placeholder="Content..." value={noticeForm.content} onChange={e => setNoticeForm({...noticeForm, content: e.target.value})} required />
                                    <div className="d-flex gap-2">
                                        <button className={`btn w-100 ${editingNoticeId ? 'btn-warning' : 'btn-primary'}`}>{editingNoticeId ? 'Update' : 'Post'}</button>
                                        {editingNoticeId && <button type="button" className="btn btn-secondary" onClick={cancelEditNotice}><FaTimes/></button>}
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="col-lg-8">
                            {notices.map(notice => (
                                <div className="card mb-3" key={notice._id}>
                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start mb-2">
                                            <div>
                                                <h5 className="fw-bold mb-1">{notice.title}</h5>
                                                <span className={`badge ${notice.priority === 'high' ? 'bg-danger' : notice.priority === 'medium' ? 'bg-warning text-dark' : 'bg-success'}`}>{notice.priority} priority</span>
                                            </div>
                                            {(notice.postedBy && notice.postedBy._id === user._id) && (
                                                <div>
                                                    <button className="btn btn-sm btn-outline-primary me-2" onClick={() => startEditNotice(notice)}><FaEdit/></button>
                                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteNotice(notice._id)}><FaTrash/></button>
                                                </div>
                                            )}
                                        </div>
                                        <p className="card-text opacity-75">{notice.content}</p>
                                        <small className="text-muted">Posted by {notice.postedBy?.name} • {new Date(notice.createdAt).toLocaleDateString()}</small>
                                    </div>
                                </div>
                            ))}
                            {notices.length === 0 && <p className="text-muted text-center mt-4">No notices yet.</p>}
                        </div>
                    </div>
                )}

                {/* --- COMPLAINTS SECTION --- */}
                {activeTab === 'complaints' && (
                    <div className="row">
                        <div className="col-lg-4 mb-4">
                            <div className={`card p-3 ${editingComplaintId ? 'border-warning' : ''}`}>
                                <h5 className="fw-bold mb-3">{editingComplaintId ? '✏️ Edit Complaint' : '🛠️ Raise Ticket'}</h5>
                                <form onSubmit={handlePostComplaint}>
                                    <input className="form-control mb-2" placeholder="Subject" value={complaintForm.title} onChange={e => setComplaintForm({...complaintForm, title: e.target.value})} required />
                                    <textarea className="form-control mb-3" rows="3" placeholder="Describe issue..." value={complaintForm.description} onChange={e => setComplaintForm({...complaintForm, description: e.target.value})} required />
                                    
                                    {!editingComplaintId && (
                                        <div className="mb-3">
                                            <label className="form-label small text-muted"><FaImage className="me-1"/> Attach Photo</label>
                                            <input type="file" className="form-control form-control-sm mb-2" accept="image/*" onChange={handleImageChange} />
                                            {imagePreview && (
                                                <div className="position-relative">
                                                    <img src={imagePreview} alt="Preview" className="img-fluid rounded border" style={{ maxHeight: '200px', width: '100%', objectFit: 'cover' }} />
                                                    <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" onClick={clearImageSelection}><FaTimes /></button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="d-flex gap-2 mt-3">
                                        <button 
                                            className={`btn w-100 ${editingComplaintId ? 'btn-warning' : 'btn-danger'}`}
                                            disabled={isSubmittingComplaint}
                                        >
                                            {isSubmittingComplaint ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                                    Uploading...
                                                </>
                                            ) : (
                                                editingComplaintId ? 'Update' : 'Submit'
                                            )}
                                        </button>
                                        {editingComplaintId && <button type="button" className="btn btn-secondary" onClick={cancelEditComplaint} disabled={isSubmittingComplaint}><FaTimes/></button>}
                                    </div>
                                </form>
                            </div>
                        </div>

                        <div className="col-lg-8">
                            {complaints.map(comp => (
                                <div className="card mb-3 shadow-sm" key={comp._id} style={{ overflow: 'hidden' }}>
                                    
                                    {/* --- NEW IMAGE LAYOUT: Full width at top or centered --- */}
                                    {comp.imageUrl && (
                                        <div className="complaint-image-container">
                                            <img 
                                                src={comp.imageUrl} 
                                                alt="Complaint Proof" 
                                            />
                                        </div>
                                    )}

                                    <div className="card-body">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <div className="w-100">
                                                <div className="d-flex align-items-center gap-2 mb-2">
                                                    <h5 className="fw-bold mb-0">{comp.title}</h5>
                                                    <span className={`badge ${comp.status === 'resolved' ? 'bg-success' : 'bg-danger'}`}>{comp.status}</span>
                                                </div>

                                                <p className="card-text opacity-75 mb-3">{comp.description}</p>
                                                
                                                <small className="text-muted d-block border-top pt-2">
                                                    Posted by: <strong>{comp.postedBy?.name}</strong> (Villa {comp.postedBy?.unitNumber})
                                                    <span className="float-end">{new Date(comp.createdAt).toLocaleDateString()}</span>
                                                </small>
                                            </div>

                                            <div className="d-flex flex-column gap-2 ms-3">
                                                {user.role === 'admin' && comp.status === 'open' && (
                                                    <button className="btn btn-sm btn-success" onClick={() => handleResolveComplaint(comp._id)}><FaCheck/></button>
                                                )}
                                                {(comp.postedBy && comp.postedBy._id === user._id) && (
                                                    <>
                                                        <button className="btn btn-sm btn-outline-primary" onClick={() => startEditComplaint(comp)}><FaEdit/></button>
                                                        <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteComplaint(comp._id)}><FaTrash/></button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {complaints.length === 0 && <p className="text-muted text-center mt-4">No complaints yet.</p>}
                        </div>
                    </div>
                )}
            </div>
        </PageTransition>
    );
};

export default Community;