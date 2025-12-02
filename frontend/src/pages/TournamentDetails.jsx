import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';

function TournamentDetails() {
    const { id } = useParams();
    const [tournament, setTournament] = useState(null);
    const [matches, setMatches] = useState([]);
    const [champion, setChampion] = useState('');
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        try {
            const tRes = await api.get(`/tournaments/${id}`);
            setTournament(tRes.data);

            const mRes = await api.get(`/tournaments/${id}/matches`);
            setMatches(mRes.data);

            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/tournaments/${id}/register`, { champion });
            alert('Registered successfully!');
            setChampion('');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Registration failed');
        }
    };

    const generateBracket = async () => {
        try {
            await api.post(`/tournaments/${id}/generate-bracket`);
            alert('Bracket generated!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Failed to generate bracket');
        }
    };

    const submitMatch = async (matchId, riotMatchId) => {
        try {
            await api.post(`/matches/${matchId}/submit`, { riot_match_id: riotMatchId });
            alert('Result submitted!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.detail || 'Submission failed');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading tournament...</p>
                </div>
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="glass-card p-12 text-center max-w-md mx-auto mt-20">
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-2xl font-bold mb-2">Tournament Not Found</h2>
                <p className="text-gray-400">This tournament doesn't exist or has been removed</p>
            </div>
        );
    }

    return (
        <div className="animate-slide-up space-y-8">
            {/* Tournament header */}
            <div className="glass-card p-8 border-l-4 border-l-gold-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl"></div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                        <div>
                            <h2 className="text-4xl md:text-5xl font-black text-gradient mb-2">{tournament.name}</h2>
                            <div className="flex flex-wrap gap-4 text-gray-400">
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-cyan-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="capitalize font-semibold text-white">{tournament.role}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                                    </svg>
                                    <span>Max {tournament.max_players} players</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            {tournament.registration_open ? (
                                <span className="badge-open text-lg px-4 py-2">● OPEN FOR REGISTRATION</span>
                            ) : (
                                <span className="badge-closed text-lg px-4 py-2">● IN PROGRESS</span>
                            )}
                        </div>
                    </div>

                    {/* Registration form */}
                    {tournament.registration_open && (
                        <div className="glass-card p-6 bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border-cyan-500/30">
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <span className="text-2xl">⚔️</span>
                                Join the Battle
                            </h3>
                            <form onSubmit={handleRegister} className="flex flex-col md:flex-row gap-3">
                                <input
                                    type="text"
                                    placeholder="Enter your champion name"
                                    className="input-gaming flex-1"
                                    value={champion}
                                    onChange={(e) => setChampion(e.target.value)}
                                    required
                                />
                                <button type="submit" className="btn-gaming-secondary whitespace-nowrap">
                                    🏆 Register Now
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Admin controls */}
                    <div className="mt-4">
                        <button
                            onClick={generateBracket}
                            className="btn-gaming-purple text-sm"
                        >
                            🤖 Generate AI Bracket (Admin)
                        </button>
                    </div>
                </div>
            </div>

            {/* Matches section */}
            <div>
                <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-3xl font-black text-white">Tournament Bracket</h3>
                    <div className="h-1 flex-1 bg-gradient-to-r from-gold-500 via-cyan-500 to-purple-500 rounded-full"></div>
                </div>

                {matches.length === 0 ? (
                    <div className="glass-card p-12 text-center">
                        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
                            <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <h4 className="text-xl font-bold text-gray-400 mb-2">No Matches Yet</h4>
                        <p className="text-gray-500">Bracket will be generated once registration closes</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {matches.map((match, index) => (
                            <MatchCard
                                key={match.id}
                                match={match}
                                currentUserId={user.id}
                                onSubmit={submitMatch}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function MatchCard({ match, currentUserId, onSubmit, index }) {
    const [riotId, setRiotId] = useState('');

    const p1 = match.player1?.user;
    const p2 = match.player2?.user;
    const p1Champ = match.player1?.champion;
    const p2Champ = match.player2?.champion;

    const isParticipant = (p1?.id === currentUserId || p2?.id === currentUserId);
    const winnerId = match.winner?.user?.id;

    return (
        <div
            className="match-card animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
        >
            <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
                {/* Players */}
                <div className="flex-1 flex flex-col md:flex-row justify-between items-center w-full gap-6">
                    {/* Player 1 */}
                    <div className={`flex-1 text-center md:text-left transition-all duration-300 ${winnerId === p1?.id ? 'scale-105' : ''}`}>
                        <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                            {winnerId === p1?.id && (
                                <span className="text-2xl animate-bounce">👑</span>
                            )}
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${winnerId === p1?.id
                                    ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-dark-900 shadow-glow-gold'
                                    : 'bg-dark-600 text-gray-400'
                                }`}>
                                {p1 ? p1.display_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div>
                                <p className={`text-lg font-bold ${winnerId === p1?.id ? 'text-gold-400' : 'text-white'}`}>
                                    {p1 ? p1.display_name : 'Bye'}
                                </p>
                                {p1Champ && (
                                    <p className="text-sm text-gray-500">{p1Champ}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* VS */}
                    <div className="px-6 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full border border-cyan-500/30">
                        <span className="text-xl font-black text-gradient">VS</span>
                    </div>

                    {/* Player 2 */}
                    <div className={`flex-1 text-center md:text-right transition-all duration-300 ${winnerId === p2?.id ? 'scale-105' : ''}`}>
                        <div className="flex items-center justify-center md:justify-end gap-3 mb-2">
                            <div className="md:order-2">
                                <p className={`text-lg font-bold ${winnerId === p2?.id ? 'text-gold-400' : 'text-white'}`}>
                                    {p2 ? p2.display_name : 'Bye'}
                                </p>
                                {p2Champ && (
                                    <p className="text-sm text-gray-500">{p2Champ}</p>
                                )}
                            </div>
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg md:order-1 ${winnerId === p2?.id
                                    ? 'bg-gradient-to-br from-gold-400 to-gold-600 text-dark-900 shadow-glow-gold'
                                    : 'bg-dark-600 text-gray-400'
                                }`}>
                                {p2 ? p2.display_name.charAt(0).toUpperCase() : '?'}
                            </div>
                            {winnerId === p2?.id && (
                                <span className="text-2xl animate-bounce md:order-3">👑</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Match result / submission */}
                <div className="w-full lg:w-auto">
                    {match.verified ? (
                        <div className="badge-verified text-center px-6 py-3">
                            ✓ Verified Winner: {match.winner?.user?.display_name}
                        </div>
                    ) : (
                        isParticipant && (
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    placeholder="Riot Match ID"
                                    className="input-gaming w-full sm:w-48"
                                    value={riotId}
                                    onChange={(e) => setRiotId(e.target.value)}
                                />
                                <button
                                    onClick={() => onSubmit(match.id, riotId)}
                                    className="btn-gaming whitespace-nowrap"
                                    disabled={!riotId}
                                >
                                    📤 Submit Result
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
}

export default TournamentDetails;
