
# IndieGamer Hub

A dedicated indie game discovery engine and social platform. Built with React + Node/Express + MongoDB.

## Project Structure

```
indieGamerHub/
├── client/          # React (Vite) frontend
└── server/          # Node.js + Express backend
```

## Quick Start

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Fill in your MONGO_URI, JWT_SECRET, RAWG_API_KEY, CLOUDINARY_* values
npm run dev
```

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

### 3. Environment Variables

See `server/.env.example` for all required variables.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register user |
| POST | /api/auth/login | Public | Login |
| GET | /api/games | Public | List/search games |
| GET | /api/games/featured | Public | Featured games |
| GET | /api/games/trending | Public | Trending (7-day reviews) |
| GET | /api/games/upcoming | Public | Upcoming releases |
| POST | /api/games | Developer | Create game |
| POST | /api/games/steam-prefill | Developer | Fetch Steam data |
| GET | /api/admin/stats | Admin | Dashboard stats |

## Tech Stack

- **Frontend**: React 18, Vite, React Router 6, Axios, React Player
- **Backend**: Node.js, Express, Mongoose
- **Database**: MongoDB Atlas
- **External APIs**: Steam Storefront API, RAWG.io
- **Storage**: Cloudinary (image uploads)
- **Auth**: JWT (jsonwebtoken + bcryptjs)

# IndieGamerHub
Search games in Steam

