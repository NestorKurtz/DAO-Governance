// Aavegotchi Foundation - Assessment Backend
// server.js - mit SQLite Datenbank
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// DATABASE SETUP
// ============================================

const db = new Database('assessments.db');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS candidates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        statement TEXT,
        nominated_by TEXT,
        nominated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS assessments (
        id TEXT PRIMARY KEY,
        candidate_id TEXT NOT NULL,
        assessor TEXT NOT NULL,
        technical INTEGER NOT NULL,
        reliability INTEGER NOT NULL,
        communication INTEGER NOT NULL,
        values_score INTEGER NOT NULL,
        feedback TEXT,
        signature TEXT,
        ip_address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id),
        UNIQUE(candidate_id, assessor)
    );
`);

// Insert default candidates if table is empty
const candidateCount = db.prepare('SELECT COUNT(*) as count FROM candidates').get();
if (candidateCount.count === 0) {
    const insertCandidate = db.prepare(`
        INSERT INTO candidates (id, name, address, statement, nominated_by)
        VALUES (?, ?, ?, ?, ?)
    `);

    const defaultCandidates = [
        ['alice', 'Alice', '0x1234567890123456789012345678901234567890', 'Experienced Multi-Sig signer with 5+ years in DeFi', '0xabcd...'],
        ['bob', 'Bob', '0x0987654321098765432109876543210987654321', 'Smart contract auditor and security researcher', '0xefgh...'],
        ['charlie', 'Charlie', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'Active DAO contributor and community builder', '0xijkl...'],
        ['diana', 'Diana', '0xfedcbafedcbafedcbafedcbafedcbafedcbafed', 'Treasury management expert with focus on DeFi protocols', '0xmnop...'],
        ['eve', 'Eve', '0x9876543210987654321098765432109876543210', 'Full-stack developer with governance experience', '0xqrst...']
    ];

    defaultCandidates.forEach(c => insertCandidate.run(...c));
    console.log('Default candidates inserted');
}

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// ============================================
// ROUTES
// ============================================

// Welcome route
app.get('/', (req, res) => {
    res.redirect('/assess.html');
});

// Get all candidates
app.get('/api/candidates', (req, res) => {
    const candidates = db.prepare(`
        SELECT id, name, address, statement, nominated_by as nominatedBy,
               nominated_at as nominatedAt, active
        FROM candidates WHERE active = 1
    `).all();

    res.json({
        success: true,
        count: candidates.length,
        candidates: candidates
    });
});

// Get specific candidate
app.get('/api/candidates/:id', (req, res) => {
    const candidate = db.prepare(`
        SELECT id, name, address, statement, nominated_by as nominatedBy,
               nominated_at as nominatedAt
        FROM candidates WHERE id = ? AND active = 1
    `).get(req.params.id);

    if (!candidate) {
        return res.status(404).json({
            success: false,
            error: 'Candidate not found'
        });
    }

    res.json({
        success: true,
        candidate: candidate
    });
});

// Add new candidate (nomination)
app.post('/api/candidates', (req, res) => {
    try {
        const { name, address, statement, nominatedBy } = req.body;

        if (!name || !address) {
            return res.status(400).json({
                success: false,
                error: 'Name and address are required'
            });
        }

        const id = name.toLowerCase().replace(/\s+/g, '-');

        // Check if candidate already exists
        const existing = db.prepare('SELECT id FROM candidates WHERE address = ?').get(address);
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Candidate with this address already exists'
            });
        }

        db.prepare(`
            INSERT INTO candidates (id, name, address, statement, nominated_by)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, address, statement || '', nominatedBy || '');

        console.log(`New candidate nominated: ${name}`);

        res.json({
            success: true,
            message: 'Candidate nominated successfully',
            candidateId: id
        });
    } catch (error) {
        console.error('Nomination error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Submit assessment
app.post('/api/submit-assessment', (req, res) => {
    try {
        const { candidate, assessor, traits, feedback, signature } = req.body;

        // Validation
        if (!candidate || !assessor || !traits) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Validate traits sum to 100
        const total = Object.values(traits).reduce((sum, val) => sum + parseInt(val), 0);
        if (total !== 100) {
            return res.status(400).json({
                success: false,
                error: `Traits must sum to 100 (current: ${total})`
            });
        }

        // Validate each trait is >= 5
        for (const [key, value] of Object.entries(traits)) {
            if (parseInt(value) < 5) {
                return res.status(400).json({
                    success: false,
                    error: `Trait ${key} must be at least 5 points`
                });
            }
        }

        // Check if candidate exists
        const candidateExists = db.prepare('SELECT id FROM candidates WHERE id = ? AND active = 1').get(candidate);
        if (!candidateExists) {
            return res.status(404).json({
                success: false,
                error: 'Candidate not found'
            });
        }

        // Check if assessor already assessed this candidate
        const existingAssessment = db.prepare(
            'SELECT id FROM assessments WHERE candidate_id = ? AND assessor = ?'
        ).get(candidate, assessor);

        if (existingAssessment) {
            return res.status(400).json({
                success: false,
                error: 'You have already assessed this candidate'
            });
        }

        // Create assessment
        const assessmentId = crypto.randomBytes(16).toString('hex');

        db.prepare(`
            INSERT INTO assessments (id, candidate_id, assessor, technical, reliability,
                                    communication, values_score, feedback, signature, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
            assessmentId,
            candidate,
            assessor,
            parseInt(traits.technical),
            parseInt(traits.reliability),
            parseInt(traits.communication),
            parseInt(traits.values),
            feedback || '',
            signature || null,
            req.ip
        );

        console.log(`New assessment: ${assessor.substring(0, 8)}... -> ${candidate}`);

        res.json({
            success: true,
            message: 'Assessment submitted successfully',
            assessmentId: assessmentId
        });

    } catch (error) {
        console.error('Assessment error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get results for specific candidate
app.get('/api/results/:candidateId', (req, res) => {
    const candidateId = req.params.candidateId;

    // Find candidate
    const candidate = db.prepare(`
        SELECT id, name, address, statement, nominated_by as nominatedBy
        FROM candidates WHERE id = ? AND active = 1
    `).get(candidateId);

    if (!candidate) {
        return res.status(404).json({
            success: false,
            error: 'Candidate not found'
        });
    }

    // Get assessments for this candidate
    const assessments = db.prepare(`
        SELECT technical, reliability, communication, values_score as 'values',
               feedback, created_at as timestamp
        FROM assessments WHERE candidate_id = ?
    `).all(candidateId);

    if (assessments.length === 0) {
        return res.json({
            success: true,
            candidate: candidate,
            assessmentCount: 0,
            scores: null,
            message: 'No assessments yet'
        });
    }

    // Calculate median scores
    const scores = calculateMedianScores(assessments);

    res.json({
        success: true,
        candidate: candidate,
        assessmentCount: assessments.length,
        scores: scores,
        feedback: assessments
            .filter(a => a.feedback)
            .map(a => ({
                text: a.feedback,
                timestamp: a.timestamp
            }))
    });
});

// Get all results (leaderboard)
app.get('/api/results', (req, res) => {
    const candidates = db.prepare(`
        SELECT id, name, address, statement, nominated_by as nominatedBy
        FROM candidates WHERE active = 1
    `).all();

    const results = candidates.map(candidate => {
        const assessments = db.prepare(`
            SELECT technical, reliability, communication, values_score as 'values'
            FROM assessments WHERE candidate_id = ?
        `).all(candidate.id);

        if (assessments.length === 0) {
            return {
                candidate: candidate,
                assessmentCount: 0,
                totalScore: 0,
                scores: null
            };
        }

        const scores = calculateMedianScores(assessments);
        const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);

        return {
            candidate: candidate,
            assessmentCount: assessments.length,
            totalScore: totalScore,
            scores: scores
        };
    });

    // Sort by total score
    results.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
        success: true,
        results: results,
        totalAssessments: db.prepare('SELECT COUNT(*) as count FROM assessments').get().count
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    const totalCandidates = db.prepare('SELECT COUNT(*) as count FROM candidates WHERE active = 1').get().count;
    const totalAssessments = db.prepare('SELECT COUNT(*) as count FROM assessments').get().count;
    const uniqueAssessors = db.prepare('SELECT COUNT(DISTINCT assessor) as count FROM assessments').get().count;

    res.json({
        success: true,
        stats: {
            totalCandidates: totalCandidates,
            totalAssessments: totalAssessments,
            uniqueAssessors: uniqueAssessors,
            averageAssessmentsPerCandidate: totalCandidates > 0
                ? (totalAssessments / totalCandidates).toFixed(1)
                : '0'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'sqlite',
        timestamp: new Date(),
        uptime: process.uptime()
    });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function calculateMedianScores(assessments) {
    const traits = ['technical', 'reliability', 'communication', 'values'];
    const medianScores = {};

    traits.forEach(trait => {
        const values = assessments
            .map(a => a[trait])
            .sort((a, b) => a - b);

        const mid = Math.floor(values.length / 2);

        if (values.length % 2 === 0) {
            medianScores[trait] = (values[mid - 1] + values[mid]) / 2;
        } else {
            medianScores[trait] = values[mid];
        }
    });

    return medianScores;
}

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
    console.log(`
+==========================================+
|  Aavegotchi Foundation API              |
|                                          |
|  Server running on port ${PORT}            |
|  http://localhost:${PORT}                  |
|                                          |
|  Database: SQLite (assessments.db)       |
|                                          |
|  API Endpoints:                          |
|  GET  /api/candidates                    |
|  POST /api/candidates (nominate)         |
|  POST /api/submit-assessment             |
|  GET  /api/results/:candidateId          |
|  GET  /api/results                       |
|  GET  /api/stats                         |
|                                          |
|  Frontend:                               |
|  http://localhost:${PORT}/assess.html      |
|  http://localhost:${PORT}/results.html     |
+==========================================+
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    db.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, closing server...');
    db.close();
    process.exit(0);
});
