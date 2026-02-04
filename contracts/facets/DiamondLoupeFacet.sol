// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {LibDiamond} from "../libraries/LibDiamond.sol";
import {IDiamondLoupe} from "../interfaces/IDiamondLoupe.sol";
import {IERC165} from "../interfaces/IERC165.sol";

contract DiamondLoupeFacet is IDiamondLoupe, IERC165 {
    function facets() external view override returns (Facet[] memory facets_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 selectorCount = ds.selectors.length;

        // Create array of unique facet addresses
        address[] memory facetAddresses_ = new address[](selectorCount);
        uint256 numFacets;

        for (uint256 i; i < selectorCount; i++) {
            address facetAddr = ds.facetAddressAndSelectorPosition[ds.selectors[i]].facetAddress;
            bool exists = false;
            for (uint256 j; j < numFacets; j++) {
                if (facetAddresses_[j] == facetAddr) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                facetAddresses_[numFacets] = facetAddr;
                numFacets++;
            }
        }

        facets_ = new Facet[](numFacets);
        for (uint256 i; i < numFacets; i++) {
            facets_[i].facetAddress = facetAddresses_[i];
            uint256 count;
            for (uint256 j; j < selectorCount; j++) {
                if (ds.facetAddressAndSelectorPosition[ds.selectors[j]].facetAddress == facetAddresses_[i]) {
                    count++;
                }
            }
            facets_[i].functionSelectors = new bytes4[](count);
            uint256 idx;
            for (uint256 j; j < selectorCount; j++) {
                if (ds.facetAddressAndSelectorPosition[ds.selectors[j]].facetAddress == facetAddresses_[i]) {
                    facets_[i].functionSelectors[idx] = ds.selectors[j];
                    idx++;
                }
            }
        }
    }

    function facetFunctionSelectors(address _facet) external view override returns (bytes4[] memory facetFunctionSelectors_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 selectorCount = ds.selectors.length;
        uint256 count;
        for (uint256 i; i < selectorCount; i++) {
            if (ds.facetAddressAndSelectorPosition[ds.selectors[i]].facetAddress == _facet) {
                count++;
            }
        }
        facetFunctionSelectors_ = new bytes4[](count);
        uint256 idx;
        for (uint256 i; i < selectorCount; i++) {
            if (ds.facetAddressAndSelectorPosition[ds.selectors[i]].facetAddress == _facet) {
                facetFunctionSelectors_[idx] = ds.selectors[i];
                idx++;
            }
        }
    }

    function facetAddresses() external view override returns (address[] memory facetAddresses_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        uint256 selectorCount = ds.selectors.length;
        facetAddresses_ = new address[](selectorCount);
        uint256 numFacets;
        for (uint256 i; i < selectorCount; i++) {
            address facetAddr = ds.facetAddressAndSelectorPosition[ds.selectors[i]].facetAddress;
            bool exists = false;
            for (uint256 j; j < numFacets; j++) {
                if (facetAddresses_[j] == facetAddr) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                facetAddresses_[numFacets] = facetAddr;
                numFacets++;
            }
        }
        // Resize array
        assembly {
            mstore(facetAddresses_, numFacets)
        }
    }

    function facetAddress(bytes4 _functionSelector) external view override returns (address facetAddress_) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        facetAddress_ = ds.facetAddressAndSelectorPosition[_functionSelector].facetAddress;
    }

    function supportsInterface(bytes4 _interfaceId) external view override returns (bool) {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        return ds.supportedInterfaces[_interfaceId];
    }
}
