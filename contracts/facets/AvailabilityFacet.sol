// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {AppStorage, LibAppStorage, SignerRecord, SignerStatus} from "../libraries/LibAppStorage.sol";

contract AvailabilityFacet {
    event StatusUpdated(address indexed signer, SignerStatus newStatus);
    event SignerRegistered(address indexed signer);

    function registerAsSigner() external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(!s.isRegisteredSigner[msg.sender], "Already registered");

        s.registeredSigners.push(msg.sender);
        s.isRegisteredSigner[msg.sender] = true;
        s.signerRecords[msg.sender] = SignerRecord({
            status: SignerStatus.Active,
            lastStatusUpdate: block.timestamp,
            totalSignatures: 0,
            missedSignatures: 0,
            lastSignatureTimestamp: 0
        });

        emit SignerRegistered(msg.sender);
    }

    function updateStatus(SignerStatus _newStatus) external {
        AppStorage storage s = LibAppStorage.appStorage();
        require(s.isRegisteredSigner[msg.sender], "Not registered");

        s.signerRecords[msg.sender].status = _newStatus;
        s.signerRecords[msg.sender].lastStatusUpdate = block.timestamp;

        emit StatusUpdated(msg.sender, _newStatus);
    }

    function getSignerStatus(address _signer) external view returns (SignerStatus) {
        return LibAppStorage.appStorage().signerRecords[_signer].status;
    }

    function getActiveSigners() external view returns (address[] memory) {
        AppStorage storage s = LibAppStorage.appStorage();
        uint256 activeCount = 0;
        for (uint256 i = 0; i < s.registeredSigners.length; i++) {
            if (s.signerRecords[s.registeredSigners[i]].status == SignerStatus.Active) {
                activeCount++;
            }
        }

        address[] memory active = new address[](activeCount);
        uint256 j = 0;
        for (uint256 i = 0; i < s.registeredSigners.length; i++) {
            if (s.signerRecords[s.registeredSigners[i]].status == SignerStatus.Active) {
                active[j] = s.registeredSigners[i];
                j++;
            }
        }
        return active;
    }

    function getRegisteredSigners() external view returns (address[] memory) {
        return LibAppStorage.appStorage().registeredSigners;
    }

    function getSignerRecord(address _signer) external view returns (SignerRecord memory) {
        return LibAppStorage.appStorage().signerRecords[_signer];
    }
}
