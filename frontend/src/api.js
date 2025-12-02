import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const storeApi = {
    buySp: (amount) => api.post('/store/buy-sp', null, { params: { amount } }),
    getItems: () => api.get('/store/items'),
    redeemItem: (itemId) => api.post(`/store/redeem/${itemId}`),
    initItems: () => api.post('/store/init-items'),
};

export const gamesApi = {
    create: (data) => api.post('/games/create', data),
    list: () => api.get('/games'),
    join: (gameId, team) => api.post(`/games/${gameId}/join`, null, { params: { team } }),
    verify: (gameId, winnerTeam) => api.post(`/games/${gameId}/verify`, null, { params: { winner_team: winnerTeam } }),
};

export default api;
