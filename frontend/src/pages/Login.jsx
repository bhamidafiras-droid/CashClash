import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [authMode, setAuthMode] = useState('google'); // 'google' or 'email'
    const [isRegister, setIsRegister] = useState(false);

    // Email/Password form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await api.post('/auth/google-login', {
                token: credentialResponse.credential,
            });

            login(res.data.access_token, res.data.user);
            navigate('/');
        } catch (error) {
            console.error('Login failed', error);
            alert('Login failed');
        }
    };

    const handleEmailSubmit = async (e) => {
        e.preventDefault();

        if (isRegister && password !== confirmPassword) {
            alert('Passwords do not match');
            return;
        }

        try {
            const endpoint = isRegister ? '/auth/register' : '/auth/login';
            const payload = isRegister
                ? { email, password, display_name: displayName }
                : { email, password };

            const res = await api.post(endpoint, payload);

            login(res.data.access_token, res.data.user);
            navigate('/');
        } catch (error) {
            console.error('Authentication failed', error);
            alert(error.response?.data?.detail || 'Authentication failed');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen px-4 relative overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-dark-900 to-cyan-900/20 animate-pulse-slow"></div>

            {/* Floating orbs */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl animate-float"></div>
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

            <div className="relative z-10 text-center animate-slide-up max-w-md w-full">
                {/* Title with gradient */}
                <h1 className="text-5xl md:text-6xl font-black mb-4 text-gradient animate-glow">
                    CASH CLASH
                </h1>
                <p className="text-xl md:text-2xl text-gray-400 mb-12 font-light">
                    Wager, Compete, and Win Big
                </p>

                {/* Login card with glassmorphism */}
                <div className="glass-card p-8 transform hover:scale-105 transition-all duration-300">
                    {/* Auth mode toggle */}
                    <div className="flex gap-2 mb-6 p-1 bg-dark-700/50 rounded-lg">
                        <button
                            onClick={() => setAuthMode('google')}
                            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-300 ${authMode === 'google'
                                ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-glow-gold'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Google
                        </button>
                        <button
                            onClick={() => setAuthMode('email')}
                            className={`flex-1 py-2 px-4 rounded-md font-semibold transition-all duration-300 ${authMode === 'email'
                                ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-glow-cyan'
                                : 'text-gray-400 hover:text-white'
                                }`}
                        >
                            Email
                        </button>
                    </div>

                    {authMode === 'google' ? (
                        <div>
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gold-400 to-gold-600 rounded-full flex items-center justify-center shadow-glow-gold">
                                <svg className="w-10 h-10 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-white">Sign In with Google</h2>
                            <p className="text-gray-400 mb-6">Quick and secure authentication</p>

                            <div className="flex justify-center">
                                <GoogleLogin
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => {
                                        console.log('Login Failed');
                                    }}
                                    theme="filled_black"
                                    shape="pill"
                                    size="large"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center shadow-glow-cyan">
                                <svg className="w-10 h-10 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                            </div>
                            <h2 className="text-2xl font-bold mb-2 text-white">
                                {isRegister ? 'Create Account' : 'Sign In'}
                            </h2>
                            <p className="text-gray-400 mb-6">
                                {isRegister ? 'Join the competition' : 'Welcome back, warrior'}
                            </p>

                            <form onSubmit={handleEmailSubmit} className="space-y-4">
                                {isRegister && (
                                    <input
                                        type="text"
                                        placeholder="Display Name"
                                        className="input-gaming w-full"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        required
                                    />
                                )}
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    className="input-gaming w-full"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    className="input-gaming w-full"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                {isRegister && (
                                    <input
                                        type="password"
                                        placeholder="Confirm Password"
                                        className="input-gaming w-full"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                )}
                                <button type="submit" className="btn-gaming-secondary w-full">
                                    {isRegister ? '🏆 Create Account' : '⚔️ Sign In'}
                                </button>
                            </form>

                            <div className="mt-6 pt-6 border-t border-white/10">
                                <button
                                    onClick={() => setIsRegister(!isRegister)}
                                    className="text-sm text-gray-400 hover:text-cyan-400 transition-colors duration-300"
                                >
                                    {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-white/10">
                        <p className="text-sm text-gray-500">
                            By signing in, you agree to compete with honor
                        </p>
                    </div>
                </div>

                {/* Stats or features */}
                <div className="grid grid-cols-3 gap-6 mt-12">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-gold-400 mb-1">1v1</div>
                        <div className="text-sm text-gray-500">Intense Battles</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400 mb-1">AI</div>
                        <div className="text-sm text-gray-500">Smart Brackets</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-purple-400 mb-1">Auto</div>
                        <div className="text-sm text-gray-500">Verification</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
