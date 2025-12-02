# CashClash 🎮⚔️

A competitive League of Legends gaming platform where players can wager SP (Skill Points) on custom games and tournaments, then redeem their winnings for Riot Points.

## Features

### 🎯 Core Gameplay
- **Custom Games**: 1v1 and 5v5 matches with SP wagers
- **Tournaments**: Bracket-style competitions with AI-powered matchmaking
- **SP Economy**: Earn points by winning, spend on entry fees, redeem for RP

### 👥 User Roles
- **Users**: Join games, participate in tournaments, redeem rewards
- **Moderators**: Create games, verify results
- **Admins**: Full platform management, user promotion, redemption handling

### 🛡️ Admin Panel
- User management (promote/demote roles)
- Game oversight (view all games, delete, verify winners)
- Redemption tracking (email notifications, fulfillment status)
- Platform statistics dashboard

### 🎨 Modern UI
- Dark gaming aesthetic with vibrant gradients
- Real-time team rosters with player names
- Responsive design for all devices
- Smooth animations and transitions

## Tech Stack

### Backend
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Database
- **SQLAlchemy** - ORM with async support
- **JWT** - Authentication

### Frontend
- **React** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Axios** - API client

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Getting Started

### Prerequisites
- Docker & Docker Compose
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://gitlab.com/yourusername/cashclash.git
cd cashclash
```

2. **Start the application**
```bash
docker-compose up -d --build
```

3. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Default Admin Account
```
Email: admin@cashclash.com
Password: Admin123!@#
```

## Project Structure

```
lol-tournament/
├── backend/
│   ├── routers/          # API endpoints
│   │   ├── admin.py      # Admin management
│   │   ├── auth.py       # Authentication
│   │   ├── games.py      # Custom games
│   │   ├── store.py      # RP redemptions
│   │   └── tournaments.py
│   ├── models.py         # Database models
│   ├── schemas.py        # Pydantic schemas
│   └── main.py          # FastAPI app
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages
│   │   │   ├── Lobby.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Store.jsx
│   │   ├── context/     # React context
│   │   └── api.js       # API client
│   └── index.css        # Tailwind styles
└── docker-compose.yml
```

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login

### Games
- `GET /games/` - List open games
- `POST /games/create` - Create game (moderator/admin)
- `POST /games/{id}/join` - Join game
- `POST /games/{id}/verify` - Verify winner (moderator/admin)

### Admin
- `GET /admin/users` - List all users
- `PATCH /admin/users/{id}` - Update user role
- `GET /admin/games` - List all games
- `GET /admin/redemptions` - List redemptions
- `GET /admin/stats` - Platform statistics

### Store
- `GET /store/items` - List RP items
- `POST /store/redeem/{id}` - Redeem item
- `POST /store/buy-sp` - Purchase SP

## Development

### Backend Development
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

## Features in Detail

### Role-Based Access Control
- **Admin**: Full access to all features
- **Moderator**: Can create/verify games
- **User**: Can join games and tournaments

### Game Flow
1. Moderator/Admin creates a game with wager amount
2. Players join Team 1 or Team 2 (SP deducted)
3. Game is played in League of Legends
4. Moderator/Admin verifies the winner
5. Winning team receives SP rewards

### Redemption System
1. User redeems RP item with SP
2. Admin receives notification
3. Admin sends RP code via email
4. Admin marks redemption as fulfilled

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitLab.

---

**Built with ❤️ for the League of Legends community**
