import React, { useState, useEffect } from 'react';
import { gamesApi } from '../api';
import { useAuth } from '../context/AuthContext';

function Lobby() {
    const { user, login } = useAuth();
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Create Game Form
    const [gameType, setGameType] = useState('1v1');
    const [wagerAmount, setWagerAmount] = useState(5);

    useEffect(() => {
        loadGames();
        // Poll for updates every 10 seconds
        const interval = setInterval(loadGames, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadGames = async () => {
        try {
            const res = await gamesApi.list();
            setGames(res.data);
        } catch (error) {
            console.error("Failed to load games", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGame = async (e) => {
        e.preventDefault();

        setActionLoading(true);
        try {
            await gamesApi.create({ type: gameType, wager_amount: wagerAmount });

            setShowCreateModal(false);
            loadGames();
            alert("Game created successfully!");
        } catch (error) {
            console.error("Failed to create game", error);
            alert(error.response?.data?.detail || "Failed to create game");
        } finally {
            setActionLoading(false);
        }
    };

    const handleJoinGame = async (gameId, team) => {
        const game = games.find(g => g.id === gameId);
        if (!game) return;

        if (user.sp_points < game.wager_amount) {
            alert("Insufficient SP points!");
            return;
        }

        if (!window.confirm(`Join this game for ${game.wager_amount} SP?`)) return;

        setActionLoading(true);
        try {
            await gamesApi.join(gameId, team);
            // Update user balance locally
            const updatedUser = { ...user, sp_points: user.sp_points - game.wager_amount };
            login(localStorage.getItem('token'), updatedUser);

            loadGames();
            alert("Joined game successfully!");
        } catch (error) {
            console.error("Failed to join game", error);
            alert(error.response?.data?.detail || "Failed to join game");
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="text-center text-gold-400 mt-20">Loading Lobby...</div>;

    return (
        <div className="animate-fade-in relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-black text-gradient mb-2">CASHCLASH</h1>
                    <p className="text-gray-400">Join a match or create your own</p>
                </div>
                {(user?.role === 'admin' || user?.role === 'moderator') && (
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-gaming px-8 py-3 text-lg shadow-glow-gold"
                    >
                        Create Game
                    </button>
                )}
            </div>

            {/* Active Games List */}
            <div className="grid gap-4">
                {games.length === 0 ? (
                    <div className="text-center py-20 glass-card">
                        <p className="text-gray-400 text-xl">No active games found.</p>
                        {(user?.role === 'admin' || user?.role === 'moderator') && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="text-gold-400 hover:text-gold-300 mt-4 underline"
                            >
                                Be the first to create one!
                            </button>
                        )}
                    </div>
                ) : (
                    games.map(game => {
                        const team1Players = game.players.filter(p => p.team === 1);
                        const team2Players = game.players.filter(p => p.team === 2);
                        const maxPerTeam = game.type === '1v1' ? 1 : 5;

                        return (
                            <div key={game.id} className="glass-card p-6 hover:border-gold-500/30 transition-all duration-300">
                                {/* Game Header */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl ${game.type === '1v1' ? 'bg-gradient-to-br from-red-500 to-red-700' : 'bg-gradient-to-br from-blue-500 to-blue-700'
                                            }`}>
                                            {game.type}
                                        </div>
                                        <div>
                                            <div className="text-gold-400 font-bold text-xl">{game.wager_amount} SP</div>
                                            <div className="text-sm text-gray-400">
                                                {game.players.length} / {game.type === '1v1' ? 2 : 10} Players
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Teams Display */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    {/* Team 1 */}
                                    <div className="border border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
                                        <div className="text-blue-400 font-bold mb-2 text-center">TEAM 1</div>
                                        <div className="space-y-2">
                                            {team1Players.map((player, idx) => (
                                                <div key={idx} className="text-sm text-white bg-blue-500/10 rounded px-2 py-1">
                                                    {player.user?.display_name || 'Player'}
                                                </div>
                                            ))}
                                            {[...Array(maxPerTeam - team1Players.length)].map((_, idx) => (
                                                <div key={`empty-${idx}`} className="text-sm text-gray-600 bg-dark-800/50 rounded px-2 py-1 border border-dashed border-gray-700">
                                                    Empty Slot
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Team 2 */}
                                    <div className="border border-red-500/30 rounded-lg p-4 bg-red-500/5">
                                        <div className="text-red-400 font-bold mb-2 text-center">TEAM 2</div>
                                        <div className="space-y-2">
                                            {team2Players.map((player, idx) => (
                                                <div key={idx} className="text-sm text-white bg-red-500/10 rounded px-2 py-1">
                                                    {player.user?.display_name || 'Player'}
                                                </div>
                                            ))}
                                            {[...Array(maxPerTeam - team2Players.length)].map((_, idx) => (
                                                <div key={`empty-${idx}`} className="text-sm text-gray-600 bg-dark-800/50 rounded px-2 py-1 border border-dashed border-gray-700">
                                                    Empty Slot
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Join Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={() => handleJoinGame(game.id, 1)}
                                        disabled={actionLoading || team1Players.length >= maxPerTeam || game.players.some(p => p.user_id === user.id)}
                                        className={`flex-1 px-6 py-2 rounded-lg font-bold transition-all ${game.players.some(p => p.user_id === user.id)
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : team1Players.length >= maxPerTeam
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50'
                                            }`}
                                    >
                                        Join Team 1
                                    </button>

                                    <button
                                        onClick={() => handleJoinGame(game.id, 2)}
                                        disabled={actionLoading || team2Players.length >= maxPerTeam || game.players.some(p => p.user_id === user.id)}
                                        className={`flex-1 px-6 py-2 rounded-lg font-bold transition-all ${game.players.some(p => p.user_id === user.id)
                                                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                : team2Players.length >= maxPerTeam
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                                    : 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50'
                                            }`}
                                    >
                                        Join Team 2
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Create Game Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
                    <div className="glass-card p-8 max-w-md w-full relative animate-scale-up">
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-white"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-6">Create Custom Game</h2>

                        <form onSubmit={handleCreateGame} className="space-y-6">
                            <div>
                                <label className="block text-gray-400 mb-2">Game Type</label>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setGameType('1v1')}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${gameType === '1v1'
                                            ? 'bg-gold-500 text-dark-900 shadow-glow-gold'
                                            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                                            }`}
                                    >
                                        1v1 Duel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setGameType('5v5')}
                                        className={`flex-1 py-3 rounded-lg font-bold transition-all ${gameType === '5v5'
                                            ? 'bg-gold-500 text-dark-900 shadow-glow-gold'
                                            : 'bg-dark-700 text-gray-400 hover:bg-dark-600'
                                            }`}
                                    >
                                        5v5 Team
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-gray-400 mb-2">Wager Amount (SP)</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={wagerAmount}
                                    onChange={(e) => setWagerAmount(parseInt(e.target.value))}
                                    className="input-gaming w-full text-xl font-bold text-gold-400"
                                />
                                <p className="text-sm text-gray-500 mt-2">
                                    Players will need {wagerAmount} SP to join this game
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="btn-gaming w-full py-3 text-lg"
                            >
                                {actionLoading ? 'Creating...' : `Create Game (${wagerAmount} SP Wager)`}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Lobby;
