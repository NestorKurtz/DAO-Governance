const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

function getSelectors(contract) {
  const selectors = contract.interface.fragments
    .filter((f) => f.type === "function")
    .map((f) => contract.interface.getFunction(f.name).selector);
  return selectors;
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying Diamond with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  // Deploy DiamondCutFacet
  console.log("\n1. Deploying DiamondCutFacet...");
  const DiamondCutFacet = await hre.ethers.getContractFactory("DiamondCutFacet");
  const diamondCutFacet = await DiamondCutFacet.deploy();
  await diamondCutFacet.waitForDeployment();
  console.log("   DiamondCutFacet:", await diamondCutFacet.getAddress());

  // Deploy Diamond
  console.log("2. Deploying Diamond...");
  const Diamond = await hre.ethers.getContractFactory("Diamond");
  const diamond = await Diamond.deploy(deployer.address, await diamondCutFacet.getAddress());
  await diamond.waitForDeployment();
  const diamondAddress = await diamond.getAddress();
  console.log("   Diamond:", diamondAddress);

  // Deploy facets
  const FacetNames = [
    "DiamondLoupeFacet",
    "OwnershipFacet",
    "NominationFacet",
    "AssessmentFacet",
    "AvailabilityFacet",
    "PerformanceFacet",
  ];

  const cut = [];
  console.log("3. Deploying facets...");

  for (const FacetName of FacetNames) {
    const Facet = await hre.ethers.getContractFactory(FacetName);
    const facet = await Facet.deploy();
    await facet.waitForDeployment();
    const facetAddress = await facet.getAddress();
    console.log(`   ${FacetName}: ${facetAddress}`);

    cut.push({
      facetAddress: facetAddress,
      action: 0, // Add
      functionSelectors: getSelectors(facet),
    });
  }

  // Add facets to diamond
  console.log("4. Adding facets to Diamond...");
  const diamondCut = await hre.ethers.getContractAt("IDiamondCut", diamondAddress);
  const tx = await diamondCut.diamondCut(cut, hre.ethers.ZeroAddress, "0x");
  await tx.wait();
  console.log("   All facets added successfully!");

  // Verify
  const loupe = await hre.ethers.getContractAt("IDiamondLoupe", diamondAddress);
  const facets = await loupe.facets();
  console.log("\n=== DIAMOND DEPLOYED ===");
  console.log("Diamond address:", diamondAddress);
  console.log("Total facets:", facets.length);
  for (const f of facets) {
    console.log(`  ${f.facetAddress} (${f.functionSelectors.length} functions)`);
  }

  // Save deployment info
  const deployment = {
    diamond: diamondAddress,
    deployer: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
    facets: {},
  };

  for (let i = 0; i < facets.length; i++) {
    deployment.facets[FacetNames[i - 1] || "DiamondCutFacet"] = facets[i].facetAddress;
  }

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, `diamond-${hre.network.name}.json`),
    JSON.stringify(deployment, null, 2)
  );
  console.log("\nDeployment info saved to deployments/diamond-" + hre.network.name + ".json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
