// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AppStorage, LibAppStorage, Nomination, Phase} from "../libraries/LibAppStorage.sol";

contract NominationFacet {
    event CandidateNominated(address indexed candidate, address indexed nominator, string statement);
    event NominationWithdrawn(address indexed candidate, uint256 indexed nominationId);

    function setNominationPhaseStatus(bool _active) external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(
            s.currentPhase == Phase.Inactive || s.currentPhase == Phase.Nomination,
            "Cannot change nomination phase now"
        );
        s.currentPhase = _active ? Phase.Nomination : Phase.Inactive;
    }

    function nominate(address _candidate, string calldata _statement) external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(s.currentPhase == Phase.Nomination, "Not nomination phase");
        require(_candidate != address(0), "Zero address");
        require(!s.isNominated[_candidate], "Already nominated");
        require(bytes(_statement).length > 0 && bytes(_statement).length <= 280, "Invalid statement length");

        uint256 idx = s.nominations.length;
        s.nominations.push(Nomination({
            candidate: _candidate,
            nominator: msg.sender,
            statement: _statement,
            timestamp: block.timestamp,
            active: true
        }));

        s.isNominated[_candidate] = true;
        s.nominationIndex[_candidate] = idx;

        if (!s.isCandidate[_candidate]) {
            s.candidates.push(_candidate);
            s.isCandidate[_candidate] = true;
        }

        emit CandidateNominated(_candidate, msg.sender, _statement);
    }

    function withdrawNomination(uint256 _nominationId) external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(_nominationId < s.nominations.length, "Invalid ID");
        Nomination storage nom = s.nominations[_nominationId];
        require(nom.nominator == msg.sender, "Not nominator");
        require(nom.active, "Already withdrawn");

        nom.active = false;
        s.isNominated[nom.candidate] = false;

        emit NominationWithdrawn(nom.candidate, _nominationId);
    }

    function getNominations() external view returns (Nomination[] memory) {
        return LibAppStorage.appStorage().nominations;
    }

    function getActiveNominations() external view returns (Nomination[] memory) {
        AppStorage storage s = LibAppStorage.appStorage();
        uint256 activeCount = 0;
        for (uint256 i = 0; i < s.nominations.length; i++) {
            if (s.nominations[i].active) activeCount++;
        }
        Nomination[] memory active = new Nomination[](activeCount);
        uint256 j = 0;
        for (uint256 i = 0; i < s.nominations.length; i++) {
            if (s.nominations[i].active) {
                active[j] = s.nominations[i];
                j++;
            }
        }
        return active;
    }

    function getNominationCount() external view returns (uint256) {
        return LibAppStorage.appStorage().nominations.length;
    }

    function getCandidates() external view returns (address[] memory) {
        return LibAppStorage.appStorage().candidates;
    }
}
