// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AppStorage, LibAppStorage, Assessment, Phase} from "../libraries/LibAppStorage.sol";

contract AssessmentFacet {
    event CandidateAssessed(address indexed candidate, address indexed assessor, uint8[4] scores);
    event FeedbackSubmitted(address indexed candidate, string feedback);

    function setAssessmentPhaseStatus(bool _active) external {
        AppStorage storage s = LibAppStorage.appStorage();
        if (_active) {
            require(
                s.currentPhase == Phase.Nomination || s.currentPhase == Phase.Assessment,
                "Cannot start assessment now"
            );
            s.currentPhase = Phase.Assessment;
        } else {
            require(s.currentPhase == Phase.Assessment, "Not in assessment phase");
            s.currentPhase = Phase.Completed;
        }
    }

    function assessCandidate(
        address _candidate,
        uint8[4] calldata _scores,
        string calldata _feedback
    ) external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(s.currentPhase == Phase.Assessment, "Not assessment phase");
        require(s.isNominated[_candidate], "Not nominated");
        require(msg.sender != _candidate, "Cannot assess yourself");
        require(!s.hasAssessedCandidate[msg.sender][_candidate], "Already assessed");
        require(bytes(_feedback).length <= 69, "Feedback too long");

        uint16 total = 0;
        for (uint8 i = 0; i < 4; i++) {
            require(_scores[i] >= 5, "Min 5 per trait");
            total += _scores[i];
        }
        require(total == 100, "Must total 100");

        s.assessments[_candidate][msg.sender] = Assessment({
            traitScores: _scores,
            feedback: _feedback,
            timestamp: block.timestamp
        });

        s.hasAssessedCandidate[msg.sender][_candidate] = true;
        s.assessors[_candidate].push(msg.sender);

        emit CandidateAssessed(_candidate, msg.sender, _scores);
        if (bytes(_feedback).length > 0) {
            emit FeedbackSubmitted(_candidate, _feedback);
        }
    }

    function getAggregatedScores(address _candidate)
        external
        view
        returns (uint8[4] memory medianScores, uint16 totalScore, uint256 assessmentCount)
    {
        AppStorage storage s = LibAppStorage.appStorage();
        address[] memory _assessors = s.assessors[_candidate];
        assessmentCount = _assessors.length;
        if (assessmentCount == 0) return (medianScores, 0, 0);

        for (uint8 trait = 0; trait < 4; trait++) {
            uint8[] memory scores = new uint8[](assessmentCount);
            for (uint256 i = 0; i < assessmentCount; i++) {
                scores[i] = s.assessments[_candidate][_assessors[i]].traitScores[trait];
            }
            medianScores[trait] = _calculateMedian(scores);
            totalScore += medianScores[trait];
        }
    }

    function getLeaderboard()
        external
        view
        returns (address[] memory _candidates, uint8[4][] memory _scores, uint16[] memory _totals)
    {
        AppStorage storage s = LibAppStorage.appStorage();
        uint256 count = s.candidates.length;
        _candidates = new address[](count);
        _scores = new uint8[4][](count);
        _totals = new uint16[](count);

        for (uint256 i = 0; i < count; i++) {
            _candidates[i] = s.candidates[i];
            address[] memory _assessors = s.assessors[s.candidates[i]];
            if (_assessors.length > 0) {
                for (uint8 trait = 0; trait < 4; trait++) {
                    uint8[] memory traitScores = new uint8[](_assessors.length);
                    for (uint256 j = 0; j < _assessors.length; j++) {
                        traitScores[j] = s.assessments[s.candidates[i]][_assessors[j]].traitScores[trait];
                    }
                    _scores[i][trait] = _calculateMedian(traitScores);
                    _totals[i] += _scores[i][trait];
                }
            }
        }

        // Sort descending by total
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (_totals[j] > _totals[i]) {
                    (_candidates[i], _candidates[j]) = (_candidates[j], _candidates[i]);
                    (_scores[i], _scores[j]) = (_scores[j], _scores[i]);
                    (_totals[i], _totals[j]) = (_totals[j], _totals[i]);
                }
            }
        }
    }

    function getAssessorCount(address _candidate) external view returns (uint256) {
        return LibAppStorage.appStorage().assessors[_candidate].length;
    }

    function getFeedback(address _candidate) external view returns (string[] memory feedbacks) {
        AppStorage storage s = LibAppStorage.appStorage();
        address[] memory _assessors = s.assessors[_candidate];
        feedbacks = new string[](_assessors.length);
        for (uint256 i = 0; i < _assessors.length; i++) {
            feedbacks[i] = s.assessments[_candidate][_assessors[i]].feedback;
        }
    }

    function _calculateMedian(uint8[] memory arr) internal pure returns (uint8) {
        uint256 len = arr.length;
        if (len == 0) return 0;
        if (len == 1) return arr[0];

        for (uint256 i = 1; i < len; i++) {
            uint8 key = arr[i];
            uint256 j = i;
            while (j > 0 && arr[j - 1] > key) {
                arr[j] = arr[j - 1];
                j--;
            }
            arr[j] = key;
        }

        if (len % 2 == 1) return arr[len / 2];
        return uint8((uint16(arr[len / 2 - 1]) + uint16(arr[len / 2])) / 2);
    }
}
