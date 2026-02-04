// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title LibAppStorage
 * @notice Shared storage for all Diamond facets using the AppStorage pattern
 * @dev All facets share this storage layout. Only append new fields at the end.
 */

enum Phase { Inactive, Nomination, Assessment, Completed }
enum SignerStatus { Inactive, Active, Busy, Unavailable }

struct Nomination {
    address candidate;
    address nominator;
    string statement;
    uint256 timestamp;
    bool active;
}

struct Assessment {
    uint8[4] traitScores;
    string feedback;
    uint256 timestamp;
}

struct SignerRecord {
    SignerStatus status;
    uint256 lastStatusUpdate;
    uint256 totalSignatures;
    uint256 missedSignatures;
    uint256 lastSignatureTimestamp;
}

struct AppStorage {
    // Phase management
    Phase currentPhase;

    // Nominations
    Nomination[] nominations;
    mapping(address => bool) isNominated;
    mapping(address => uint256) nominationIndex;

    // Candidates
    address[] candidates;
    mapping(address => bool) isCandidate;

    // Assessments
    mapping(address => mapping(address => Assessment)) assessments;
    mapping(address => address[]) assessors;
    mapping(address => mapping(address => bool)) hasAssessedCandidate;

    // Signer availability
    mapping(address => SignerRecord) signerRecords;
    address[] registeredSigners;
    mapping(address => bool) isRegisteredSigner;

    // Performance
    mapping(address => uint256[]) signatureTimestamps;
}

library LibAppStorage {
    bytes32 constant APP_STORAGE_POSITION = keccak256("dao.governance.app.storage");

    function appStorage() internal pure returns (AppStorage storage s) {
        bytes32 position = APP_STORAGE_POSITION;
        assembly {
            s.slot := position
        }
    }
}
