// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title DAOQuestionnaire
 * @notice Standalone DAO Governance Questionnaire for Signer Elections
 * @dev Single-contract version - deploy today, upgrade to Diamond later
 *
 * Features:
 * - Candidate nomination with statements
 * - 4-trait assessment system (100 ValuePoints)
 * - Median-based score aggregation (outlier resistant)
 * - Real-time leaderboard
 * - Anonymous feedback (69-char limit)
 */
contract DAOQuestionnaire {

    // ============ ENUMS ============

    enum Phase { Inactive, Nomination, Assessment, Completed }

    // ============ STRUCTS ============

    struct Nomination {
        address candidate;
        address nominator;
        string statement;
        uint256 timestamp;
        bool active;
    }

    struct Assessment {
        uint8[4] traitScores;   // [Technical, Reliability, Communication, Values]
        string feedback;        // 69-char max
        uint256 timestamp;
    }

    struct CandidateResult {
        address candidate;
        uint8[4] medianScores;
        uint16 totalScore;
        uint256 assessmentCount;
    }

    // ============ STATE ============

    address public owner;
    Phase public currentPhase;

    // Nominations
    Nomination[] public nominations;
    mapping(address => bool) public isNominated;
    mapping(address => uint256) public nominationIndex;

    // Assessments
    // candidate => assessor => Assessment
    mapping(address => mapping(address => Assessment)) public assessments;
    mapping(address => bool) public hasAssessed;     // assessor => has assessed anyone
    mapping(address => address[]) public assessors;  // candidate => list of assessors
    mapping(address => mapping(address => bool)) public hasAssessedCandidate; // assessor => candidate => bool

    // Candidate tracking
    address[] public candidates;
    mapping(address => bool) public isCandidate;

    // ============ EVENTS ============

    event PhaseChanged(Phase indexed newPhase);
    event CandidateNominated(address indexed candidate, address indexed nominator, string statement);
    event NominationWithdrawn(address indexed candidate, uint256 indexed nominationId);
    event CandidateAssessed(address indexed candidate, address indexed assessor, uint8[4] scores);
    event FeedbackSubmitted(address indexed candidate, string feedback);

    // ============ MODIFIERS ============

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier inPhase(Phase _phase) {
        require(currentPhase == _phase, "Wrong phase");
        _;
    }

    // ============ CONSTRUCTOR ============

    constructor() {
        owner = msg.sender;
        currentPhase = Phase.Inactive;
    }

    // ============ ADMIN FUNCTIONS ============

    function setPhase(Phase _phase) external onlyOwner {
        currentPhase = _phase;
        emit PhaseChanged(_phase);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Zero address");
        owner = newOwner;
    }

    // ============ NOMINATION FUNCTIONS ============

    function nominate(address _candidate, string calldata _statement)
        external
        inPhase(Phase.Nomination)
    {
        require(_candidate != address(0), "Zero address");
        require(!isNominated[_candidate], "Already nominated");
        require(bytes(_statement).length > 0, "Empty statement");
        require(bytes(_statement).length <= 280, "Statement too long (280 max)");

        uint256 idx = nominations.length;
        nominations.push(Nomination({
            candidate: _candidate,
            nominator: msg.sender,
            statement: _statement,
            timestamp: block.timestamp,
            active: true
        }));

        isNominated[_candidate] = true;
        nominationIndex[_candidate] = idx;

        if (!isCandidate[_candidate]) {
            candidates.push(_candidate);
            isCandidate[_candidate] = true;
        }

        emit CandidateNominated(_candidate, msg.sender, _statement);
    }

    function withdrawNomination(uint256 _nominationId) external {
        require(_nominationId < nominations.length, "Invalid ID");
        Nomination storage nom = nominations[_nominationId];
        require(nom.nominator == msg.sender, "Not nominator");
        require(nom.active, "Already withdrawn");

        nom.active = false;
        isNominated[nom.candidate] = false;

        emit NominationWithdrawn(nom.candidate, _nominationId);
    }

    function getNominations() external view returns (Nomination[] memory) {
        return nominations;
    }

    function getActiveNominations() external view returns (Nomination[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < nominations.length; i++) {
            if (nominations[i].active) activeCount++;
        }

        Nomination[] memory active = new Nomination[](activeCount);
        uint256 j = 0;
        for (uint256 i = 0; i < nominations.length; i++) {
            if (nominations[i].active) {
                active[j] = nominations[i];
                j++;
            }
        }
        return active;
    }

    function getNominationCount() external view returns (uint256) {
        return nominations.length;
    }

    // ============ ASSESSMENT FUNCTIONS ============

    /**
     * @notice Assess a candidate with 4 trait scores totaling 100
     * @param _candidate The candidate to assess
     * @param _scores [Technical, Reliability, Communication, Values] - must total 100
     * @param _feedback Optional feedback (69 chars max, empty string allowed)
     */
    function assessCandidate(
        address _candidate,
        uint8[4] calldata _scores,
        string calldata _feedback
    )
        external
        inPhase(Phase.Assessment)
    {
        require(isNominated[_candidate], "Not a nominated candidate");
        require(msg.sender != _candidate, "Cannot assess yourself");
        require(!hasAssessedCandidate[msg.sender][_candidate], "Already assessed this candidate");
        require(bytes(_feedback).length <= 69, "Feedback too long (69 max)");

        // Validate scores total 100 with minimum 5 per trait
        uint16 total = 0;
        for (uint8 i = 0; i < 4; i++) {
            require(_scores[i] >= 5, "Min 5 points per trait");
            total += _scores[i];
        }
        require(total == 100, "Scores must total 100");

        assessments[_candidate][msg.sender] = Assessment({
            traitScores: _scores,
            feedback: _feedback,
            timestamp: block.timestamp
        });

        hasAssessedCandidate[msg.sender][_candidate] = true;
        assessors[_candidate].push(msg.sender);

        emit CandidateAssessed(_candidate, msg.sender, _scores);

        if (bytes(_feedback).length > 0) {
            emit FeedbackSubmitted(_candidate, _feedback);
        }
    }

    /**
     * @notice Get aggregated median scores for a candidate
     * @param _candidate The candidate address
     * @return medianScores Median of each trait
     * @return totalScore Sum of median scores
     * @return assessmentCount Number of assessments received
     */
    function getAggregatedScores(address _candidate)
        external
        view
        returns (uint8[4] memory medianScores, uint16 totalScore, uint256 assessmentCount)
    {
        address[] memory _assessors = assessors[_candidate];
        assessmentCount = _assessors.length;

        if (assessmentCount == 0) {
            return (medianScores, 0, 0);
        }

        // Calculate median for each trait
        for (uint8 trait = 0; trait < 4; trait++) {
            uint8[] memory scores = new uint8[](assessmentCount);
            for (uint256 i = 0; i < assessmentCount; i++) {
                scores[i] = assessments[_candidate][_assessors[i]].traitScores[trait];
            }
            medianScores[trait] = _calculateMedian(scores);
            totalScore += medianScores[trait];
        }
    }

    /**
     * @notice Get the full leaderboard sorted by total score
     * @return _candidates Array of candidate addresses
     * @return _scores Array of median trait scores per candidate
     * @return _totals Array of total scores per candidate
     */
    function getLeaderboard()
        external
        view
        returns (
            address[] memory _candidates,
            uint8[4][] memory _scores,
            uint16[] memory _totals
        )
    {
        uint256 count = candidates.length;
        _candidates = new address[](count);
        _scores = new uint8[4][](count);
        _totals = new uint16[](count);

        // Compute scores
        for (uint256 i = 0; i < count; i++) {
            _candidates[i] = candidates[i];
            address[] memory _assessors = assessors[candidates[i]];

            if (_assessors.length > 0) {
                for (uint8 trait = 0; trait < 4; trait++) {
                    uint8[] memory traitScores = new uint8[](_assessors.length);
                    for (uint256 j = 0; j < _assessors.length; j++) {
                        traitScores[j] = assessments[candidates[i]][_assessors[j]].traitScores[trait];
                    }
                    _scores[i][trait] = _calculateMedian(traitScores);
                    _totals[i] += _scores[i][trait];
                }
            }
        }

        // Sort by total score descending (simple bubble sort - fine for small candidate lists)
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (_totals[j] > _totals[i]) {
                    // Swap
                    (_candidates[i], _candidates[j]) = (_candidates[j], _candidates[i]);
                    (_scores[i], _scores[j]) = (_scores[j], _scores[i]);
                    (_totals[i], _totals[j]) = (_totals[j], _totals[i]);
                }
            }
        }
    }

    function getCandidateCount() external view returns (uint256) {
        return candidates.length;
    }

    function getAssessorCount(address _candidate) external view returns (uint256) {
        return assessors[_candidate].length;
    }

    function getFeedback(address _candidate)
        external
        view
        returns (string[] memory feedbacks)
    {
        address[] memory _assessors = assessors[_candidate];
        feedbacks = new string[](_assessors.length);
        for (uint256 i = 0; i < _assessors.length; i++) {
            feedbacks[i] = assessments[_candidate][_assessors[i]].feedback;
        }
    }

    // ============ INTERNAL ============

    function _calculateMedian(uint8[] memory arr) internal pure returns (uint8) {
        uint256 len = arr.length;
        if (len == 0) return 0;
        if (len == 1) return arr[0];

        // Sort array (insertion sort - efficient for small arrays)
        for (uint256 i = 1; i < len; i++) {
            uint8 key = arr[i];
            uint256 j = i;
            while (j > 0 && arr[j - 1] > key) {
                arr[j] = arr[j - 1];
                j--;
            }
            arr[j] = key;
        }

        // Return median
        if (len % 2 == 1) {
            return arr[len / 2];
        } else {
            return uint8((uint16(arr[len / 2 - 1]) + uint16(arr[len / 2])) / 2);
        }
    }
}
