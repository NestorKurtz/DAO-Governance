// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AppStorage, LibAppStorage, SignerRecord} from "../libraries/LibAppStorage.sol";

contract PerformanceFacet {
    event SignatureRecorded(address indexed signer, uint256 timestamp);
    event MissedSignatureRecorded(address indexed signer);

    function recordSignature(address _signer) external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(s.isRegisteredSigner[_signer], "Not a registered signer");

        s.signerRecords[_signer].totalSignatures++;
        s.signerRecords[_signer].lastSignatureTimestamp = block.timestamp;
        s.signatureTimestamps[_signer].push(block.timestamp);

        emit SignatureRecorded(_signer, block.timestamp);
    }

    function recordMissedSignature(address _signer) external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(s.isRegisteredSigner[_signer], "Not a registered signer");

        s.signerRecords[_signer].missedSignatures++;

        emit MissedSignatureRecorded(_signer);
    }

    function calculateReliabilityScore(address _signer) external view returns (uint8) {
        AppStorage storage s = LibAppStorage.appStorage();
        SignerRecord memory record = s.signerRecords[_signer];

        uint256 totalOpportunities = record.totalSignatures + record.missedSignatures;
        if (totalOpportunities == 0) return 0;

        return uint8((record.totalSignatures * 100) / totalOpportunities);
    }

    function getSignatureHistory(address _signer) external view returns (uint256[] memory) {
        return LibAppStorage.appStorage().signatureTimestamps[_signer];
    }

    function getSignerPerformance(address _signer)
        external
        view
        returns (
            uint256 totalSignatures,
            uint256 missedSignatures,
            uint8 reliabilityScore,
            uint256 lastSignatureTimestamp
        )
    {
        AppStorage storage s = LibAppStorage.appStorage();
        SignerRecord memory record = s.signerRecords[_signer];

        totalSignatures = record.totalSignatures;
        missedSignatures = record.missedSignatures;
        lastSignatureTimestamp = record.lastSignatureTimestamp;

        uint256 total = totalSignatures + missedSignatures;
        reliabilityScore = total == 0 ? 0 : uint8((totalSignatures * 100) / total);
    }

    function getPerformanceLeaderboard()
        external
        view
        returns (address[] memory signers, uint8[] memory scores)
    {
        AppStorage storage s = LibAppStorage.appStorage();
        uint256 count = s.registeredSigners.length;
        signers = new address[](count);
        scores = new uint8[](count);

        for (uint256 i = 0; i < count; i++) {
            signers[i] = s.registeredSigners[i];
            SignerRecord memory record = s.signerRecords[signers[i]];
            uint256 total = record.totalSignatures + record.missedSignatures;
            scores[i] = total == 0 ? 0 : uint8((record.totalSignatures * 100) / total);
        }

        // Sort descending
        for (uint256 i = 0; i < count; i++) {
            for (uint256 j = i + 1; j < count; j++) {
                if (scores[j] > scores[i]) {
                    (signers[i], signers[j]) = (signers[j], signers[i]);
                    (scores[i], scores[j]) = (scores[j], scores[i]);
                }
            }
        }
    }
}
