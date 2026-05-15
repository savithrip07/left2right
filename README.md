# Left2Right 🍃

A community food sharing web app that helps reduce food waste by connecting donors with people in need.

## Features

**User**
- Browse and order available food listings
- Post food donations with expiry tracking
- Real-time chat with donors
- Track orders and mark pickups
- Rate donated food
- Report suspicious listings

**Admin**
- Dashboard with platform stats
- Approve / reject food listings
- Manage users (block/unblock/delete)
- View all orders
- View activity log
- Review user-submitted reports

## Tech Stack

- **Frontend:** React, React Router, Axios
- **Backend:** Node.js (vanilla HTTP server)
- **Database:** MongoDB
- **Auth:** JWT (JSON Web Tokens)
- **Email:** Nodemailer (Gmail)

## Project Structure

```
left2right/
├── backend/
│   ├── server.js
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── context/
    │   └── pages/
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js
- MongoDB running locally on port `27017`

### 1. Clone the repo
```bash
git clone https://github.com/savithrip07/left2right.git
cd left2right
```

### 2. Setup Backend
```bash
cd backend
npm install
```

Create a `.env` file based on `.env.example`:
```
JWT_SECRET=your_long_random_secret
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

Start the backend:
```bash
node server.js
```
Backend runs on `http://localhost:5001`

### 3. Setup Frontend
```bash
cd frontend
npm install
npm start
```
Frontend runs on `http://localhost:3000`

## Demo Accounts (local only)

| Role | Email | Password |
|------|-------|----------|
| User | alice@example.com | alice123 |
| Admin | admin@left2right.com | admin123 |

> These accounts are seeded automatically on first run.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `EMAIL_USER` | Gmail address for sending emails |
| `EMAIL_PASS` | Gmail app password (16 characters) |

> Email is optional - the app works without it. Only forgot password and rejection notification emails won't be sent.
