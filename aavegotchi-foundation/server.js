// Aavegotchi Foundation - Assessment Backend
// server.js - mit SQL.js Datenbank (Pure JavaScript SQLite)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const initSqlJs = require('sql.js');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'assessments.db');

let db;

// ============================================
// DATABASE SETUP
// ============================================

async function initDatabase() {
    const SQL = await initSqlJs();

    // Load existing database or create new one
    if (fs.existsSync(DB_PATH)) {
        const fileBuffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(fileBuffer);
        console.log('Loaded existing database');
    } else {
        db = new SQL.Database();
        console.log('Created new database');
    }

    // Create tables
    db.run(`
        CREATE TABLE IF NOT EXISTS candidates (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT NOT NULL,
            statement TEXT,
            nominated_by TEXT,
            nominated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            active INTEGER DEFAULT 1
        )
    `);

    db.run(`
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
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS payment_votes (
            id TEXT PRIMARY KEY,
            voter TEXT NOT NULL UNIQUE,
            choice1 INTEGER NOT NULL,
            choice2 INTEGER NOT NULL,
            choice3 INTEGER NOT NULL,
            payment_method TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    db.run(`
        CREATE TABLE IF NOT EXISTS expense_requests (
            id TEXT PRIMARY KEY,
            amount DECIMAL(12,2) NOT NULL,
            currency TEXT DEFAULT 'USDC',
            description TEXT NOT NULL,
            payee_name TEXT,
            payee_wallet TEXT NOT NULL,
            submitted_by TEXT NOT NULL,
            status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Insert default candidates if table is empty
    const result = db.exec('SELECT COUNT(*) as count FROM candidates');
    const count = result[0]?.values[0]?.[0] || 0;

    if (count === 0) {
        const defaultCandidates = [
            ['alice', 'Alice', '0x1234567890123456789012345678901234567890', 'Experienced Multi-Sig signer with 5+ years in DeFi', '0xabcd...'],
            ['bob', 'Bob', '0x0987654321098765432109876543210987654321', 'Smart contract auditor and security researcher', '0xefgh...'],
            ['charlie', 'Charlie', '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', 'Active DAO contributor and community builder', '0xijkl...'],
            ['diana', 'Diana', '0xfedcbafedcbafedcbafedcbafedcbafedcbafed', 'Treasury management expert with focus on DeFi protocols', '0xmnop...'],
            ['eve', 'Eve', '0x9876543210987654321098765432109876543210', 'Full-stack developer with governance experience', '0xqrst...']
        ];

        const stmt = db.prepare('INSERT INTO candidates (id, name, address, statement, nominated_by) VALUES (?, ?, ?, ?, ?)');
        defaultCandidates.forEach(c => {
            stmt.run(c);
        });
        stmt.free();

        saveDatabase();
        console.log('Default candidates inserted');
    }
}

// Save database to file
function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// Helper to run SELECT queries
function queryAll(sql, params = []) {
    const stmt = db.prepare(sql);
    if (params.length > 0) {
        stmt.bind(params);
    }
    const results = [];
    while (stmt.step()) {
        results.push(stmt.getAsObject());
    }
    stmt.free();
    return results;
}

// Helper to run SELECT for single row
function queryOne(sql, params = []) {
    const results = queryAll(sql, params);
    return results[0] || null;
}

// Helper to run INSERT/UPDATE/DELETE
function execute(sql, params = []) {
    db.run(sql, params);
    saveDatabase();
}

// Middleware
app.use(express.json());

// Security Headers
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    crossOriginEmbedderPolicy: false,
}));

// Rate Limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api/', limiter);

// Stricter limit for write operations
const writeLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { success: false, error: 'Too many submissions, please try again later.' },
});
app.use('/api/submit-assessment', writeLimiter);
app.use('/api/candidates', writeLimiter);
app.use('/api/payment-vote', writeLimiter);
app.use('/api/expense-requests', writeLimiter);

// CORS - nur erlaubte Domains
const allowedOrigins = [
    'https://assess.aavegotchidao.cloud',
    'https://aavegotchidao.cloud',
    'http://localhost:3000'
];

app.use(cors({
    origin: function(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS not allowed'));
        }
    },
    credentials: true
}));

app.use(express.static('public'));

// ============================================
// ROUTES
// ============================================

// Welcome route - Landing Page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Get all candidates
app.get('/api/candidates', (req, res) => {
    const candidates = queryAll(`
        SELECT id, name, address, statement, nominated_by as nominatedBy,
               nominated_at as nominatedAt, active
        FROM candidates WHERE active = 1
    `);

    res.json({
        success: true,
        count: candidates.length,
        candidates: candidates
    });
});

// Get specific candidate
app.get('/api/candidates/:id', (req, res) => {
    const candidate = queryOne(`
        SELECT id, name, address, statement, nominated_by as nominatedBy,
               nominated_at as nominatedAt
        FROM candidates WHERE id = ? AND active = 1
    `, [req.params.id]);

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
        const existing = queryOne('SELECT id FROM candidates WHERE address = ?', [address]);
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'Candidate with this address already exists'
            });
        }

        execute(`
            INSERT INTO candidates (id, name, address, statement, nominated_by)
            VALUES (?, ?, ?, ?, ?)
        `, [id, name, address, statement || '', nominatedBy || '']);

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
        const candidateExists = queryOne('SELECT id FROM candidates WHERE id = ? AND active = 1', [candidate]);
        if (!candidateExists) {
            return res.status(404).json({
                success: false,
                error: 'Candidate not found'
            });
        }

        // Check if assessor already assessed this candidate
        const existingAssessment = queryOne(
            'SELECT id FROM assessments WHERE candidate_id = ? AND assessor = ?',
            [candidate, assessor]
        );

        if (existingAssessment) {
            return res.status(400).json({
                success: false,
                error: 'You have already assessed this candidate'
            });
        }

        // Create assessment
        const assessmentId = crypto.randomBytes(16).toString('hex');

        execute(`
            INSERT INTO assessments (id, candidate_id, assessor, technical, reliability,
                                    communication, values_score, feedback, signature, ip_address)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
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
        ]);

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
    const candidate = queryOne(`
        SELECT id, name, address, statement, nominated_by as nominatedBy
        FROM candidates WHERE id = ? AND active = 1
    `, [candidateId]);

    if (!candidate) {
        return res.status(404).json({
            success: false,
            error: 'Candidate not found'
        });
    }

    // Get assessments for this candidate
    const assessments = queryAll(`
        SELECT technical, reliability, communication, values_score as 'values',
               feedback, created_at as timestamp
        FROM assessments WHERE candidate_id = ?
    `, [candidateId]);

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
    const candidates = queryAll(`
        SELECT id, name, address, statement, nominated_by as nominatedBy
        FROM candidates WHERE active = 1
    `);

    const results = candidates.map(candidate => {
        const assessments = queryAll(`
            SELECT technical, reliability, communication, values_score as 'values'
            FROM assessments WHERE candidate_id = ?
        `, [candidate.id]);

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

    const totalAssessments = queryOne('SELECT COUNT(*) as count FROM assessments');

    res.json({
        success: true,
        results: results,
        totalAssessments: totalAssessments?.count || 0
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    const totalCandidates = queryOne('SELECT COUNT(*) as count FROM candidates WHERE active = 1');
    const totalAssessments = queryOne('SELECT COUNT(*) as count FROM assessments');
    const uniqueAssessors = queryOne('SELECT COUNT(DISTINCT assessor) as count FROM assessments');

    const candidateCount = totalCandidates?.count || 0;
    const assessmentCount = totalAssessments?.count || 0;

    res.json({
        success: true,
        stats: {
            totalCandidates: candidateCount,
            totalAssessments: assessmentCount,
            uniqueAssessors: uniqueAssessors?.count || 0,
            averageAssessmentsPerCandidate: candidateCount > 0
                ? (assessmentCount / candidateCount).toFixed(1)
                : '0'
        }
    });
});

// Submit payment/compensation vote
app.post('/api/payment-vote', (req, res) => {
    try {
        const { voter, compensationChoices, paymentMethod } = req.body;

        if (!voter || !compensationChoices || !paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'Voter, compensation choices, and payment method are required'
            });
        }

        if (!Array.isArray(compensationChoices) || compensationChoices.length !== 3) {
            return res.status(400).json({
                success: false,
                error: 'Exactly 3 compensation choices required'
            });
        }

        const validMethods = ['lump-sum', 'quarterly', 'performance', 'hybrid'];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid payment method'
            });
        }

        const [c1, c2, c3] = compensationChoices.map(Number);
        if (c1 < 200 || c1 > 3000 || c2 < 200 || c2 > 3000 || c3 < 200 || c3 > 3000) {
            return res.status(400).json({
                success: false,
                error: 'Choices must be between $200 and $3,000 USDC'
            });
        }

        if (new Set([c1, c2, c3]).size < 3) {
            return res.status(400).json({
                success: false,
                error: 'All 3 choices must be different'
            });
        }

        const existing = queryOne('SELECT id FROM payment_votes WHERE voter = ?', [voter]);
        if (existing) {
            return res.status(400).json({
                success: false,
                error: 'You have already submitted a payment vote'
            });
        }

        const id = crypto.randomBytes(16).toString('hex');
        execute(`
            INSERT INTO payment_votes (id, voter, choice1, choice2, choice3, payment_method)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [id, voter, c1, c2, c3, paymentMethod]);

        console.log(`Payment vote submitted: ${voter.substring(0, 8)}...`);

        res.json({
            success: true,
            message: 'Payment vote submitted successfully',
            voteId: id
        });
    } catch (error) {
        console.error('Payment vote error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get payment vote results (for future results page)
app.get('/api/payment-results', (req, res) => {
    const votes = queryAll(`
        SELECT choice1, choice2, choice3, payment_method as paymentMethod
        FROM payment_votes
    `);

    if (votes.length === 0) {
        return res.json({
            success: true,
            voteCount: 0,
            compensationMedian: null,
            paymentMethodCounts: { 'lump-sum': 0, quarterly: 0, performance: 0, hybrid: 0 }
        });
    }

    const medians = votes.map(v => {
        const sorted = [v.choice1, v.choice2, v.choice3].sort((a, b) => a - b);
        return sorted[1];
    });
    const sortedMedians = medians.sort((a, b) => a - b);
    const mid = Math.floor(sortedMedians.length / 2);
    const compensationMedian = sortedMedians.length % 2 === 0
        ? (sortedMedians[mid - 1] + sortedMedians[mid]) / 2
        : sortedMedians[mid];

    const paymentMethodCounts = votes.reduce((acc, v) => {
        acc[v.paymentMethod] = (acc[v.paymentMethod] || 0) + 1;
        return acc;
    }, {});

    res.json({
        success: true,
        voteCount: votes.length,
        compensationMedian,
        paymentMethodCounts
    });
});

// Treasury balance - proxy to accounting app
const ACCOUNTING_API = process.env.ACCOUNTING_API_URL || 'http://localhost:5000';
app.get('/api/treasury', async (req, res) => {
    try {
        const response = await fetch(`${ACCOUNTING_API}/api/treasury`);
        if (!response.ok) throw new Error('Treasury API error');
        const data = await response.json();
        res.json(data);
    } catch (err) {
        console.error('Treasury fetch error:', err.message);
        res.json({
            balance: 0,
            totalIncome: 0,
            totalExpense: 0,
            currency: 'USD',
            _fallback: true,
            _error: 'Could not connect to accounting app. Ensure it is running.'
        });
    }
});

// Submit expense request
app.post('/api/expense-requests', (req, res) => {
    try {
        const { amount, currency, description, payeeName, payeeWallet, submittedBy } = req.body;

        if (!amount || !description || !payeeWallet || !submittedBy) {
            return res.status(400).json({
                success: false,
                error: 'Amount, description, payee wallet, and submitter are required'
            });
        }

        const amt = parseFloat(amount);
        if (isNaN(amt) || amt <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Amount must be a positive number'
            });
        }

        const id = crypto.randomBytes(16).toString('hex');
        execute(`
            INSERT INTO expense_requests (id, amount, currency, description, payee_name, payee_wallet, submitted_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        `, [id, amt, currency || 'USDC', description, payeeName || '', payeeWallet, submittedBy]);

        console.log(`Expense request submitted: ${amt} ${currency || 'USDC'} - ${description}`);

        res.json({
            success: true,
            message: 'Expense request submitted for approval',
            requestId: id
        });
    } catch (error) {
        console.error('Expense request error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

// Get expense requests
app.get('/api/expense-requests', (req, res) => {
    const requests = queryAll(`
        SELECT id, amount, currency, description, payee_name as payeeName, payee_wallet as payeeWallet,
               submitted_by as submittedBy, status, created_at as createdAt
        FROM expense_requests
        ORDER BY created_at DESC
    `);
    res.json({ success: true, requests });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        database: 'sql.js (SQLite)',
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

async function startServer() {
    await initDatabase();

    app.listen(PORT, () => {
        console.log(`
+==========================================+
|  Aavegotchi Foundation API              |
|                                          |
|  Server running on port ${PORT}            |
|  http://localhost:${PORT}                  |
|                                          |
|  Database: SQL.js (assessments.db)       |
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
|  http://localhost:${PORT}/nominate.html    |
|  http://localhost:${PORT}/payment.html     |
|  http://localhost:${PORT}/expense-submissions.html |
+==========================================+
        `);
    });
}

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, saving database and closing...');
    if (db) {
        saveDatabase();
        db.close();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, saving database and closing...');
    if (db) {
        saveDatabase();
        db.close();
    }
    process.exit(0);
});

// Start the server
startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
