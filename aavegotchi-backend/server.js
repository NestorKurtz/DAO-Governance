// Aavegotchi Foundation - Assessment Backend
// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// In-memory storage (später durch DB ersetzen)
let assessments = [];
let candidates = [
    { 
        id: 'alice', 
        name: 'Alice', 
        address: '0x1234567890123456789012345678901234567890',
        statement: 'Experienced Multi-Sig signer with 5+ years in DeFi',
        nominatedBy: '0xabcd...',
        nominatedAt: new Date('2024-02-01')
    },
    { 
        id: 'bob', 
        name: 'Bob', 
        address: '0x0987654321098765432109876543210987654321',
        statement: 'Smart contract auditor and security researcher',
        nominatedBy: '0xefgh...',
        nominatedAt: new Date('2024-02-01')
    },
    { 
        id: 'charlie', 
        name: 'Charlie', 
        address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd',
        statement: 'Active DAO contributor and community builder',
        nominatedBy: '0xijkl...',
        nominatedAt: new Date('2024-02-02')
    },
    { 
        id: 'diana', 
        name: 'Diana', 
        address: '0xfedcbafedcbafedcbafedcbafedcbafedcbafed',
        statement: 'Treasury management expert with focus on DeFi protocols',
        nominatedBy: '0xmnop...',
        nominatedAt: new Date('2024-02-02')
    },
    { 
        id: 'eve', 
        name: 'Eve', 
        address: '0x9876543210987654321098765432109876543210',
        statement: 'Full-stack developer with governance experience',
        nominatedBy: '0xqrst...',
        nominatedAt: new Date('2024-02-03')
    }
];

// ============================================
// ROUTES
// ============================================

// Welcome route (original)
app.get('/', (req, res) => {
    res.send('🎃 Aavegotchi Foundation Running!');
});

// Get all candidates
app.get('/api/candidates', (req, res) => {
    res.json({
        success: true,
        count: candidates.length,
        candidates: candidates
    });
});

// Get specific candidate
app.get('/api/candidates/:id', (req, res) => {
    const candidate = candidates.find(c => c.id === req.params.id);
    
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
        
        // Check if assessor already assessed this candidate
        const existingAssessment = assessments.find(
            a => a.assessor === assessor && a.candidate === candidate
        );
        
        if (existingAssessment) {
            return res.status(400).json({
                success: false,
                error: 'You have already assessed this candidate'
            });
        }
        
        // Create assessment
        const assessment = {
            id: crypto.randomBytes(16).toString('hex'),
            candidate,
            assessor,
            traits: {
                technical: parseInt(traits.technical),
                reliability: parseInt(traits.reliability),
                communication: parseInt(traits.communication),
                values: parseInt(traits.values)
            },
            feedback: feedback || '',
            signature: signature || null,
            timestamp: new Date(),
            ipAddress: req.ip
        };
        
        // Store assessment
        assessments.push(assessment);
        
        console.log(`✅ New assessment: ${assessor.substring(0, 8)}... → ${candidate}`);
        
        res.json({
            success: true,
            message: 'Assessment submitted successfully',
            assessmentId: assessment.id
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
    const candidate = candidates.find(c => c.id === candidateId);
    if (!candidate) {
        return res.status(404).json({
            success: false,
            error: 'Candidate not found'
        });
    }
    
    // Get assessments for this candidate
    const candidateAssessments = assessments.filter(
        a => a.candidate === candidateId
    );
    
    if (candidateAssessments.length === 0) {
        return res.json({
            success: true,
            candidate: candidate,
            assessmentCount: 0,
            scores: null,
            message: 'No assessments yet'
        });
    }
    
    // Calculate median scores
    const scores = calculateMedianScores(candidateAssessments);
    
    res.json({
        success: true,
        candidate: candidate,
        assessmentCount: candidateAssessments.length,
        scores: scores,
        feedback: candidateAssessments
            .filter(a => a.feedback)
            .map(a => ({
                text: a.feedback,
                timestamp: a.timestamp
            }))
    });
});

// Get all results (leaderboard)
app.get('/api/results', (req, res) => {
    const results = candidates.map(candidate => {
        const candidateAssessments = assessments.filter(
            a => a.candidate === candidate.id
        );
        
        if (candidateAssessments.length === 0) {
            return {
                candidate: candidate,
                assessmentCount: 0,
                totalScore: 0,
                scores: null
            };
        }
        
        const scores = calculateMedianScores(candidateAssessments);
        const totalScore = Object.values(scores).reduce((sum, val) => sum + val, 0);
        
        return {
            candidate: candidate,
            assessmentCount: candidateAssessments.length,
            totalScore: totalScore,
            scores: scores
        };
    });
    
    // Sort by total score
    results.sort((a, b) => b.totalScore - a.totalScore);
    
    res.json({
        success: true,
        results: results,
        totalAssessments: assessments.length
    });
});

// Get stats
app.get('/api/stats', (req, res) => {
    const uniqueAssessors = new Set(assessments.map(a => a.assessor)).size;
    
    res.json({
        success: true,
        stats: {
            totalCandidates: candidates.length,
            totalAssessments: assessments.length,
            uniqueAssessors: uniqueAssessors,
            averageAssessmentsPerCandidate: (assessments.length / candidates.length).toFixed(1)
        }
    });
});

// Admin: Get all assessments (for debugging)
app.get('/api/admin/assessments', (req, res) => {
    // In production: Add authentication!
    res.json({
        success: true,
        assessments: assessments
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
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
            .map(a => a.traits[trait])
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
╔══════════════════════════════════════════╗
║  🎃 Aavegotchi Foundation API           ║
║                                          ║
║  Server running on port ${PORT}           ║
║  http://localhost:${PORT}                 ║
║                                          ║
║  API Endpoints:                          ║
║  GET  /api/candidates                    ║
║  GET  /api/candidates/:id                ║
║  POST /api/submit-assessment             ║
║  GET  /api/results/:candidateId         ║
║  GET  /api/results                       ║
║  GET  /api/stats                         ║
║                                          ║
║  Frontend:                               ║
║  http://localhost:${PORT}/assess.html     ║
╚══════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    process.exit(0);
});
