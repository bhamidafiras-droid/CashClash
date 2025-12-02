import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Dashboard() {
    const [tournaments, setTournaments] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [newTournament, setNewTournament] = useState({ name: '', role: 'mid', max_players: 8 });

    useEffect(() => {
        fetchTournaments();
    }, []);

    const fetchTournaments = async () => {
        try {
            const res = await api.get('/tournaments/');
            setTournaments(res.data);
        } catch (error) {
            console.error(error);
        }
    };

    const createTournament = async (e) => {
        e.preventDefault();
        try {
            await api.post('/tournaments/', newTournament);
            setShowCreate(false);
            setNewTournament({ name: '', role: 'mid', max_players: 8 });
            fetchTournaments();
        } catch (error) {
            console.error(error);
            alert('Failed to create tournament');
        }
    };

    return (
        <div className="animate-slide-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h2 className="text-4xl font-black text-gradient mb-2">Active Games</h2>
                    <p className="text-gray-400">Choose your battlefield</p>
                </div>
                <button
                    onClick={() => setShowCreate(!showCreate)}
                    className={showCreate ? "btn-gaming-secondary" : "btn-gaming"}
                >
                    {showCreate ? '✕ Cancel' : '⚔ Create Tournament'}
                </button>
            </div>

            {/* Create tournament form */}
            {showCreate && (
                <div className="glass-card p-6 mb-8 animate-slide-up border-l-4 border-l-gold-500">
                    <h3 className="text-xl font-bold mb-4 text-gold-400">New Tournament</h3>
                    <form onSubmit={createTournament} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input
                                type="text"
                                placeholder="Tournament Name"
                                className="input-gaming"
                                value={newTournament.name}
                                onChange={(e) => setNewTournament({ ...newTournament, name: e.target.value })}
                                required
                            />
                            <select
                                className="input-gaming"
                                value={newTournament.role}
                                onChange={(e) => setNewTournament({ ...newTournament, role: e.target.value })}
                            >
                                <option value="mid">Mid Lane</option>
                                <option value="top">Top Lane</option>
                                <option value="jungle">Jungle</option>
                                <option value="adc">ADC</option>
                                <option value="support">Support</option>
                            </select>
                            <input
                                type="number"
                                placeholder="Max Players"
                                className="input-gaming"
                                value={newTournament.max_players}
                                onChange={(e) => setNewTournament({ ...newTournament, max_players: parseInt(e.target.value) })}
                                min="4"
                                max="64"
                                step="4"
                                required
                            />
                        </div>
                        <button type="submit" className="btn-gaming w-full md:w-auto">
                            🏆 Create Tournament
                        </button>
                    </form>
                </div>
            )}

            {/* Tournament grid */}
            {tournaments.length === 0 ? (
                <div className="glass-card p-12 text-center">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-400 mb-2">No Tournaments Yet</h3>
                    <p className="text-gray-500">Create the first tournament to get started</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tournaments.map((t, index) => (
                        <Link
                            to={`/tournament/${t.id}`}
                            key={t.id}
                            className="block"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="tournament-card group">
                                {/* Status indicator */}
                                <div className="absolute top-4 right-4">
                                    {t.registration_open ? (
                                        <span className="badge-open">● OPEN</span>
                                    ) : (
                                        <span className="badge-closed">● CLOSED</span>
                                    )}
                                </div>

                                {/* Tournament icon */}
                                <div className="w-16 h-16 mb-4 bg-gradient-to-br from-gold-500 to-gold-600 rounded-xl flex items-center justify-center shadow-glow-gold group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                    </svg>
                                </div>

                                {/* Tournament info */}
                                <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-gold-400 transition-colors duration-300">
                                    {t.name}
                                </h3>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                        </svg>
                                        <span className="capitalize font-semibold text-white">{t.role}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                        </svg>
                                        <span>
                                            {t.registration_count || 0} / {t.max_players} players
                                        </span>
                                    </div>
                                    {t.spots_available !== undefined && t.spots_available > 0 && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-green-400 font-semibold">
                                                {t.spots_available} {t.spots_available === 1 ? 'spot' : 'spots'} available
                                            </span>
                                        </div>
                                    )}
                                    {t.spots_available === 0 && (
                                        <div className="flex items-center gap-2">
                                            <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                            <span className="text-red-400 font-semibold">Full</span>
                                        </div>
                                    )}
                                </div>

                                {/* View button */}
                                <div className="pt-4 border-t border-white/10">
                                    <span className="text-gold-400 font-semibold group-hover:text-gold-300 transition-colors duration-300 flex items-center gap-2">
                                        View Tournament
                                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                        </svg>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Dashboard;
