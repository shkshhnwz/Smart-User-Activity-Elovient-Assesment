# Smart User Activity Tracker

A full-stack user activity tracking system built with Node.js, Express, MongoDB, and React. It logs user actions, enforces custom rate limiting and replay protection rules without third-party libraries, and provides real-time analytics and suspicious behavior detection.

---

## Features

- **Authentication:** JWT-based user registration and login with password hashing (`bcryptjs`).
- **Custom Rate Limiting:** Enforces maximum 5 actions per 10 seconds per user (built with native MongoDB queries, no external libraries).
- **Replay Protection:**
  - Rejects actions if client timestamp differs from server time by > 30 seconds.
  - Rejects duplicate actions submitted within 3 seconds for the same user.
- **Real-Time Analytics (5-Second Auto-Refresh):**
  - Total actions counter.
  - Most common action.
  - Most active user.
  - Continuous 10-minute actions-per-minute bar breakdown.
- **Suspicious Activity Detection:**
  - Detects high frequency (> 20 actions in 1 minute).
  - Detects multiple IP addresses (> 2 distinct IPs in 5 minutes).
- **Interactive Activity Simulator:**
  - Trigger actions (`click`, `view`, `login`, `logout`, `custom`).
  - Simulate custom IP addresses.
  - Test clock skew drift and duplicate spamming.
  - Buttons lock with a live countdown timer when rate limited.

---

## Tech Stack

- **Backend:** Node.js, Express, Mongoose, JSONWebToken, Bcryptjs, Cors, Dotenv
- **Frontend:** React 19, Vite, React Router DOM, Lucide Icons, Vanilla CSS
- **Database:** MongoDB Atlas

---

## Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/shkshhnwz/Smart-User-Activity-Elovient-Assesment.git
cd Smart-User-Activity-Elovient-Assesment
```

### 2. Backend Setup
```bash
cd Backend
npm install
```

Create a `.env` file inside the `Backend` directory:
```env
PORT=5000
MONGOURL=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

Start the backend server:
```bash
npm start
```
The server will run on `http://localhost:5000`.

### 3. Frontend Setup
Open a new terminal:
```bash
cd Frontend
npm install
```

Create a `.env` file inside the `Frontend` directory:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Technical Decisions
For a detailed explanation of architecture decisions and custom rules implementation, see [DECISIONS.md](./DECISIONS.md).
