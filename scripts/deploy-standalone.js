const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying DAOQuestionnaire with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const DAOQuestionnaire = await hre.ethers.getContractFactory("DAOQuestionnaire");
  const questionnaire = await DAOQuestionnaire.deploy();
  await questionnaire.waitForDeployment();

  const address = await questionnaire.getAddress();
  console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
  console.log("DAOQuestionnaire deployed to:", address);
  console.log("Network:", hre.network.name);

  // Save deployment info
  const deployment = {
    contract: "DAOQuestionnaire",
    address: address,
    deployer: deployer.address,
    network: hre.network.name,
    timestamp: new Date().toISOString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(deploymentsDir, `standalone-${hre.network.name}.json`),
    JSON.stringify(deployment, null, 2)
  );
  console.log("Deployment info saved to deployments/standalone-" + hre.network.name + ".json");

  // Verify on Etherscan if not local
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost" && process.env.ETHERSCAN_API_KEY) {
    console.log("\nWaiting for block confirmations...");
    await questionnaire.deploymentTransaction().wait(5);
    console.log("Verifying on Etherscan...");
    try {
      await hre.run("verify:verify", { address: address, constructorArguments: [] });
      console.log("Verified on Etherscan!");
    } catch (e) {
      console.log("Verification failed:", e.message);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
