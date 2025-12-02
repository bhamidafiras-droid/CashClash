import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TournamentDetails from './pages/TournamentDetails';
import Store from './pages/Store';
import Lobby from './pages/Lobby';
import AdminPanel from './pages/AdminPanel';

function App() {
    return (
        <AuthProvider>
            <Router>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

function AppContent() {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-dark-900 text-gold-400">Loading...</div>;
    }

    return (
        <div className="min-h-screen">
            {isAuthenticated && <Navbar />}
            <div className={isAuthenticated ? "container mx-auto px-4 py-8 max-w-7xl" : ""}>
                <Routes>
                    <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
                    <Route path="/" element={isAuthenticated ? <Lobby /> : <Navigate to="/login" />} />
                    <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                    <Route path="/store" element={isAuthenticated ? <Store /> : <Navigate to="/login" />} />
                    <Route path="/admin" element={isAuthenticated ? <AdminPanel /> : <Navigate to="/login" />} />
                    <Route path="/tournament/:id" element={isAuthenticated ? <TournamentDetails /> : <Navigate to="/login" />} />
                </Routes>
            </div>
        </div>
    );
}

function Navbar() {
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass-card sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl">
            <div className="container mx-auto px-4 py-4 max-w-7xl">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 bg-gradient-to-br from-gold-400 to-gold-600 rounded-lg flex items-center justify-center shadow-glow-gold group-hover:scale-110 transition-transform duration-300">
                            <span className="text-dark-900 font-black text-xl">C</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-gradient">CASH CLASH</h1>
                            <p className="text-xs text-gray-500">Wager & Win</p>
                        </div>
                    </Link>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        <Link
                            to="/"
                            className={`px-6 py-3 rounded-lg font-black text-lg transition-all duration-300 ${isActive('/')
                                    ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-dark-900 shadow-glow-gold scale-110'
                                    : 'bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 border border-gold-500/50'
                                }`}
                        >
                            ⚔️ PLAY NOW
                        </Link>
                        <Link
                            to="/dashboard"
                            className={`text-sm font-bold transition-colors ${isActive('/dashboard') ? 'text-gold-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            TOURNAMENTS
                        </Link>
                        <Link
                            to="/store"
                            className={`text-sm font-bold transition-colors ${isActive('/store') ? 'text-gold-400' : 'text-gray-400 hover:text-white'}`}
                        >
                            STORE
                        </Link>
                        {user?.role === 'admin' && (
                            <Link
                                to="/admin"
                                className={`text-sm font-bold transition-colors ${isActive('/admin') ? 'text-red-400' : 'text-red-400/60 hover:text-red-400'}`}
                            >
                                🛡️ ADMIN
                            </Link>
                        )}
                    </div>

                    {/* User info and logout */}
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 glass-card">
                            <div className="text-right mr-2 border-r border-white/10 pr-4">
                                <p className="text-xs text-gray-400">Balance</p>
                                <p className="text-gold-400 font-bold">{user?.sp_points || 0} SP</p>
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-dark-900 font-bold">
                                {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-white">{user?.display_name || 'User'}</p>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 rounded-lg font-semibold transition-all duration-300 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 hover:border-red-500"
                        >
                            <span className="hidden md:inline">Logout</span>
                            <span className="md:hidden">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default App;
