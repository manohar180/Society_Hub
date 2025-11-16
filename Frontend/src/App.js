import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// --- COMPONENT IMPORTS ---
import NavBar from './components/NavBar'; 
// Note: We are NOT importing Header anymore. NavBar handles everything.

// --- PAGE IMPORTS ---
import { Login, GuardLogin, AdminLogin, ResidentSignup } from './pages/Login';
import NotFound from './pages/NotFound';

// Resident Pages
import ResidentDashboard from './pages/Resident/Dashboard';
import ResidentVisitors from './pages/Resident/Visitors';
import ResidentPayments from './pages/Resident/Payments';

// Guard Pages
import GuardDashboard from './pages/Guard/GuardDashboard';
import GuardCheckIn from './pages/Guard/GuardCheckIn';

// Admin Pages
import AdminDashboard from './pages/Admin/AdminDashboard';
import CreateInvoice from './pages/Admin/CreateInvoice';
import ResidentList from './pages/Admin/ResidentList';
import InvoiceList from './pages/Admin/InvoiceList';
import VisitorLogs from './pages/Admin/VisitorLogs';

// Shared Pages (These were missing in your nav check)
import Community from './pages/Community';
import Profile from './pages/Profile';

// --- HELPER COMPONENTS ---

const RoleRedirect = () => {
    const { user, loading } = useAuth();
    if (loading) return <div className="text-center mt-5">Loading...</div>;
    if (user) {
        switch (user.role) {
            case 'resident': return <Navigate to="/resident/dashboard" replace />;
            case 'guard': return <Navigate to="/guard/dashboard" replace />;
            case 'admin': return <Navigate to="/admin/dashboard" replace />;
            default: return <Navigate to="/login" replace />;
        }
    }
    return <Navigate to="/login" replace />;
};

// Layout that includes the NavBar
const ProtectedLayout = ({ requiredRoles }) => (
    <ProtectedRoute requiredRoles={requiredRoles}>
        <NavBar /> {/* This is the ONLY place the navigation bar should be */}
        <Outlet /> 
    </ProtectedRoute>
);

function App() {
    return (
        <Router>
            <AuthProvider>
                {/* REMOVED <Header /> from here to avoid duplication */}
                
                <Routes>
                    {/* --- PUBLIC ROUTES --- */}
                    <Route path="/" element={<RoleRedirect />} />
                    <Route path="/login" element={<Login role="resident" />} />
                    <Route path="/signup" element={<ResidentSignup />} />
                    <Route path="/guard-login" element={<GuardLogin />} />
                    <Route path="/admin-login" element={<AdminLogin />} />

                    {/* --- SHARED PROTECTED ROUTES (All Roles) --- */}
                    {/* This block ensures Community/Profile are accessible */}
                    <Route element={<ProtectedLayout requiredRoles={['resident', 'guard', 'admin']} />}>
                        <Route path="/community" element={<Community />} />
                        <Route path="/profile" element={<Profile />} />
                    </Route>

                    {/* --- RESIDENT PORTAL --- */}
                    <Route element={<ProtectedLayout requiredRoles={['resident']} />}>
                        <Route path="/resident/dashboard" element={<ResidentDashboard />} />
                        <Route path="/resident/visitors" element={<ResidentVisitors />} />
                        <Route path="/resident/payments" element={<ResidentPayments />} />
                    </Route>

                    {/* --- GUARD PORTAL --- */}
                    <Route element={<ProtectedLayout requiredRoles={['guard']} />}>
                        <Route path="/guard/dashboard" element={<GuardDashboard />} />
                        <Route path="/guard/checkin" element={<GuardCheckIn action="checkin" />} />
                        <Route path="/guard/checkout" element={<GuardCheckIn action="checkout" />} /> 
                    </Route>

                    {/* --- ADMIN PORTAL --- */}
                    <Route element={<ProtectedLayout requiredRoles={['admin']} />}>
                        <Route path="/admin/dashboard" element={<AdminDashboard />} />
                        <Route path="/admin/invoices/create" element={<CreateInvoice />} />
                        <Route path="/admin/residents" element={<ResidentList />} />
                        <Route path="/admin/invoices/all" element={<InvoiceList />} />
                        <Route path="/admin/visitor-logs" element={<VisitorLogs />} />
                    </Route>
                    
                    <Route path="*" element={<NotFound />} /> 
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;