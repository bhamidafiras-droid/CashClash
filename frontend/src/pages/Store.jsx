import React, { useState, useEffect } from 'react';
import { storeApi } from '../api';
import { useAuth } from '../context/AuthContext';

function Store() {
    const { user, login } = useAuth();
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState(false);

    useEffect(() => {
        loadItems();
    }, []);

    const loadItems = async () => {
        try {
            // First try to init items (for MVP)
            await storeApi.initItems();
            const res = await storeApi.getItems();
            setItems(res.data);
        } catch (error) {
            console.error("Failed to load items", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBuySp = async (amount) => {
        setPurchaseLoading(true);
        try {
            const res = await storeApi.buySp(amount);
            // Update local user state with new balance
            const updatedUser = { ...user, sp_points: (user.sp_points || 0) + amount };
            // We need to update the token too if it contained user data, but here we just update user context
            // In a real app, we might want to refresh the token or fetch user profile again
            login(localStorage.getItem('token'), updatedUser);
            alert(`Successfully purchased ${amount} SP!`);
        } catch (error) {
            console.error("Purchase failed", error);
            alert("Purchase failed");
        } finally {
            setPurchaseLoading(false);
        }
    };

    const handleRedeem = async (item) => {
        if (!window.confirm(`Are you sure you want to redeem ${item.name} for ${item.sp_cost} SP?`)) return;

        setPurchaseLoading(true);
        try {
            await storeApi.redeemItem(item.id);
            const updatedUser = { ...user, sp_points: (user.sp_points || 0) - item.sp_cost };
            login(localStorage.getItem('token'), updatedUser);
            alert(`Successfully redeemed ${item.name}! Check your email for the code.`);
        } catch (error) {
            console.error("Redemption failed", error);
            alert(error.response?.data?.detail || "Redemption failed");
        } finally {
            setPurchaseLoading(false);
        }
    };

    if (loading) return <div className="text-center text-gold-400 mt-20">Loading Store...</div>;

    return (
        <div className="animate-fade-in">
            <div className="text-center mb-12">
                <h1 className="text-4xl font-black text-gradient mb-4">CASH CLASH STORE</h1>
                <p className="text-gray-400">Buy SP Points or Redeem Rewards</p>
            </div>

            {/* Balance Card */}
            <div className="glass-card p-6 max-w-md mx-auto mb-12 text-center transform hover:scale-105 transition-all duration-300">
                <h2 className="text-xl text-gray-400 mb-2">Your Balance</h2>
                <div className="text-5xl font-black text-gold-400 mb-4">
                    {user?.sp_points || 0} <span className="text-2xl">SP</span>
                </div>
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => handleBuySp(10)}
                        disabled={purchaseLoading}
                        className="btn-gaming text-sm"
                    >
                        Buy 10 SP (10€)
                    </button>
                    <button
                        onClick={() => handleBuySp(50)}
                        disabled={purchaseLoading}
                        className="btn-gaming text-sm"
                    >
                        Buy 50 SP (50€)
                    </button>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-6 px-4">Redeem Rewards</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
                {items.map(item => (
                    <div key={item.id} className="glass-card p-6 flex flex-col items-center text-center hover:border-gold-500/50 transition-all duration-300">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-full flex items-center justify-center mb-4 shadow-glow-purple">
                            <span className="text-2xl">🎁</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{item.name}</h3>
                        <p className="text-gray-400 text-sm mb-4">{item.description}</p>
                        <div className="mt-auto">
                            <div className="text-2xl font-bold text-gold-400 mb-4">{item.sp_cost} SP</div>
                            <button
                                onClick={() => handleRedeem(item)}
                                disabled={purchaseLoading || (user?.sp_points || 0) < item.sp_cost}
                                className={`w-full py-2 rounded-lg font-bold transition-all duration-300 ${(user?.sp_points || 0) >= item.sp_cost
                                    ? 'bg-gold-500 hover:bg-gold-600 text-dark-900 shadow-glow-gold'
                                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                                    }`}
                            >
                                Redeem
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Store;
