import React, { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

function AdminPanel() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users');
    const [loading, setLoading] = useState(true);

    // Data states
    const [users, setUsers] = useState([]);
    const [games, setGames] = useState([]);
    const [redemptions, setRedemptions] = useState([]);
    const [stats, setStats] = useState(null);

    useEffect(() => {
        // Check if user is admin
        if (user?.role !== 'admin') {
            navigate('/');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersRes, gamesRes, redemptionsRes, statsRes] = await Promise.all([
                api.get('/admin/users'),
                api.get('/admin/games'),
                api.get('/admin/redemptions?pending_only=true'),
                api.get('/admin/stats')
            ]);
            setUsers(usersRes.data);
            setGames(gamesRes.data);
            setRedemptions(redemptionsRes.data);
            setStats(statsRes.data);
        } catch (error) {
            console.error("Failed to load admin data", error);
        } finally {
            setLoading(false);
        }
    };

    const promoteUser = async (userId, newRole) => {
        try {
            await api.patch(`/admin/users/${userId}`, { role: newRole });
            alert(`User promoted to ${newRole}`);
            loadData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to promote user");
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm("Are you sure you want to delete this user?")) return;
        try {
            await api.delete(`/admin/users/${userId}`);
            alert("User deleted");
            loadData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to delete user");
        }
    };

    const deleteGame = async (gameId) => {
        if (!window.confirm("Are you sure you want to delete this game?")) return;
        try {
            await api.delete(`/admin/games/${gameId}`);
            alert("Game deleted");
            loadData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to delete game");
        }
    };

    const markEmailSent = async (redemptionId) => {
        try {
            await api.post(`/admin/redemptions/${redemptionId}/send-email`, {
                redemption_id: redemptionId
            });
            alert("Email marked as sent");
            loadData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to mark email");
        }
    };

    const fulfillRedemption = async (redemptionId) => {
        try {
            await api.patch(`/admin/redemptions/${redemptionId}/fulfill`);
            alert("Redemption fulfilled");
            loadData();
        } catch (error) {
            alert(error.response?.data?.detail || "Failed to fulfill redemption");
        }
    };

    if (loading) return <div className="text-center text-gold-400 mt-20">Loading Admin Panel...</div>;

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-4xl font-black text-gradient mb-2">ADMIN PANEL</h1>
                <p className="text-gray-400">Platform Management Dashboard</p>
            </div>

            {/* Stats Overview */}
            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="glass-card p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Users</div>
                        <div className="text-3xl font-black text-gold-400">{stats.total_users}</div>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-gray-400 text-sm mb-1">Total Games</div>
                        <div className="text-3xl font-black text-cyan-400">{stats.total_games}</div>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-gray-400 text-sm mb-1">Pending Redemptions</div>
                        <div className="text-3xl font-black text-red-400">{stats.pending_redemptions}</div>
                    </div>
                    <div className="glass-card p-6">
                        <div className="text-gray-400 text-sm mb-1">Total SP</div>
                        <div className="text-3xl font-black text-purple-400">{stats.total_sp_in_circulation}</div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-white/10">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'users'
                        ? 'text-gold-400 border-b-2 border-gold-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Users ({users.length})
                </button>
                <button
                    onClick={() => setActiveTab('games')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'games'
                        ? 'text-gold-400 border-b-2 border-gold-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Games ({games.length})
                </button>
                <button
                    onClick={() => setActiveTab('redemptions')}
                    className={`px-6 py-3 font-bold transition-all ${activeTab === 'redemptions'
                        ? 'text-gold-400 border-b-2 border-gold-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    Redemptions ({redemptions.length})
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="glass-card p-6">
                    <h2 className="text-2xl font-bold mb-4">User Management</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="text-left py-3 px-4 text-gray-400">Email</th>
                                    <th className="text-left py-3 px-4 text-gray-400">Display Name</th>
                                    <th className="text-left py-3 px-4 text-gray-400">SP Points</th>
                                    <th className="text-left py-3 px-4 text-gray-400">Role</th>
                                    <th className="text-left py-3 px-4 text-gray-400">Verified</th>
                                    <th className="text-left py-3 px-4 text-gray-400">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-sm">{u.email}</td>
                                        <td className="py-3 px-4">{u.display_name}</td>
                                        <td className="py-3 px-4 text-gold-400 font-bold">{u.sp_points} SP</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400' :
                                                u.role === 'moderator' ? 'bg-blue-500/20 text-blue-400' :
                                                    'bg-gray-500/20 text-gray-400'
                                                }`}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            {u.is_verified ? '✅' : '❌'}
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                {u.role === 'user' && (
                                                    <button
                                                        onClick={() => promoteUser(u.id, 'moderator')}
                                                        className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded text-xs hover:bg-blue-500/30"
                                                    >
                                                        → Moderator
                                                    </button>
                                                )}
                                                {u.role === 'moderator' && (
                                                    <button
                                                        onClick={() => promoteUser(u.id, 'admin')}
                                                        className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
                                                    >
                                                        → Admin
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteUser(u.id)}
                                                    className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs hover:bg-red-500/30"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Games Tab */}
            {activeTab === 'games' && (
                <div className="glass-card p-6">
                    <h2 className="text-2xl font-bold mb-4">Game Management</h2>
                    <div className="space-y-4">
                        {games.map(game => {
                            const team1Players = game.players.filter(p => p.team === 1);
                            const team2Players = game.players.filter(p => p.team === 2);

                            return (
                                <div key={game.id} className="border border-white/10 rounded-lg p-4 hover:border-gold-500/30 transition-all">
                                    {/* Game Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className={`px-3 py-1 rounded font-bold ${game.type === '1v1' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                                                    }`}>
                                                    {game.type}
                                                </span>
                                                <span className="text-gold-400 font-bold">{game.wager_amount} SP</span>
                                                <span className={`px-2 py-1 rounded text-xs ${game.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400' :
                                                        game.status === 'IN_PROGRESS' ? 'bg-yellow-500/20 text-yellow-400' :
                                                            'bg-gray-500/20 text-gray-400'
                                                    }`}>
                                                    {game.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-gray-400">
                                                Players: {game.players.length} | Created: {new Date(game.created_at).toLocaleString()}
                                            </div>
                                            {game.winner_team && (
                                                <div className="text-sm text-green-400 mt-1">
                                                    Winner: Team {game.winner_team}
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => deleteGame(game.id)}
                                            className="px-4 py-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                                        >
                                            Delete
                                        </button>
                                    </div>

                                    {/* Team Rosters */}
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* Team 1 */}
                                        <div className="border border-blue-500/30 rounded-lg p-3 bg-blue-500/5">
                                            <div className="text-blue-400 font-bold mb-2 text-sm">TEAM 1</div>
                                            <div className="space-y-1">
                                                {team1Players.length > 0 ? (
                                                    team1Players.map((player, idx) => (
                                                        <div key={idx} className="text-xs text-white bg-blue-500/10 rounded px-2 py-1">
                                                            {player.user?.display_name || 'Unknown'}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-gray-600">No players</div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Team 2 */}
                                        <div className="border border-red-500/30 rounded-lg p-3 bg-red-500/5">
                                            <div className="text-red-400 font-bold mb-2 text-sm">TEAM 2</div>
                                            <div className="space-y-1">
                                                {team2Players.length > 0 ? (
                                                    team2Players.map((player, idx) => (
                                                        <div key={idx} className="text-xs text-white bg-red-500/10 rounded px-2 py-1">
                                                            {player.user?.display_name || 'Unknown'}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-gray-600">No players</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Redemptions Tab */}
            {activeTab === 'redemptions' && (
                <div className="glass-card p-6">
                    <h2 className="text-2xl font-bold mb-4">Pending Redemptions</h2>
                    <div className="space-y-4">
                        {redemptions.map(redemption => (
                            <div key={redemption.id} className="border border-white/10 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-bold text-lg mb-1">{redemption.item?.name}</div>
                                        <div className="text-sm text-gray-400">
                                            User: {redemption.user?.display_name} ({redemption.user?.email})
                                        </div>
                                        <div className="text-sm text-gray-400">
                                            Redeemed: {new Date(redemption.created_at).toLocaleString()}
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            {redemption.email_sent && <span className="text-green-400 text-xs">✅ Email Sent</span>}
                                            {redemption.fulfilled && <span className="text-green-400 text-xs">✅ Fulfilled</span>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!redemption.email_sent && (
                                            <button
                                                onClick={() => markEmailSent(redemption.id)}
                                                className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                                            >
                                                Mark Email Sent
                                            </button>
                                        )}
                                        {!redemption.fulfilled && (
                                            <button
                                                onClick={() => fulfillRedemption(redemption.id)}
                                                className="px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                            >
                                                Mark Fulfilled
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {redemptions.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                No pending redemptions
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default AdminPanel;
