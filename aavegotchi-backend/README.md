# Aavegotchi Foundation Assessment Backend

Backend API server for the Aavegotchi Foundation candidate assessment system.

## Features

- RESTful API for candidate assessments
- 4-trait scoring system (Technical, Reliability, Communication, Values)
- Median-based score aggregation
- In-memory storage (ready for database integration)
- CORS enabled for frontend integration

## Quick Start

```bash
# Install dependencies
npm install

# Start server
npm start

# Development mode (with auto-reload)
npm run dev
```

The server will run on `http://localhost:3000` by default.

## API Endpoints

### Candidates
- `GET /api/candidates` - Get all candidates
- `GET /api/candidates/:id` - Get specific candidate

### Assessments
- `POST /api/submit-assessment` - Submit a new assessment
- `GET /api/results/:candidateId` - Get results for a specific candidate
- `GET /api/results` - Get all results (leaderboard)

### Stats & Admin
- `GET /api/stats` - Get overall statistics
- `GET /api/admin/assessments` - Get all assessments (debugging)
- `GET /api/health` - Health check

## Assessment Rules

- Total points must equal exactly 100
- Minimum 5 points per trait
- One assessment per candidate per assessor
- Median-based aggregation for outlier resistance

## Project Structure

```
aavegotchi-backend/
├── server.js          # Main server file
├── package.json       # Dependencies
├── public/            # Static files (frontend)
└── README.md          # This file
```

## Environment Variables

- `PORT` - Server port (default: 3000)

## Next Steps

- [ ] Add database integration (replace in-memory storage)
- [ ] Add authentication middleware
- [ ] Add input validation library
- [ ] Add rate limiting
- [ ] Add logging system
