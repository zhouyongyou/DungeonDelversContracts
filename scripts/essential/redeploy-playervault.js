// redeploy-playervault.js - Redeploy PlayerVault with CommissionWithdrawn event
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function main() {
  console.log("💰 Redeploying PlayerVault with CommissionWithdrawn Event");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  try {
    // Deploy PlayerVault
    console.log("\n🚀 Deploying PlayerVault...");
    
    const PlayerVaultFactory = await ethers.getContractFactory("PlayerVault");
    const playerVault = await PlayerVaultFactory.deploy({
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    });

    await playerVault.waitForDeployment();
    const playerVaultAddress = await playerVault.getAddress();
    
    console.log("✅ PlayerVault deployed at:", playerVaultAddress);

    // Update .env file with new address
    const envPath = path.join(__dirname, "../../.env");
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Update both VITE_ and non-VITE versions
    envContent = envContent.replace(
      /VITE_PLAYERVAULT_ADDRESS=.*/,
      `VITE_PLAYERVAULT_ADDRESS=${playerVaultAddress}`
    );
    envContent = envContent.replace(
      /PLAYERVAULT_ADDRESS=.*/,
      `PLAYERVAULT_ADDRESS=${playerVaultAddress}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env with new PlayerVault address");

    // Update ABI file
    const artifactPath = path.join(__dirname, "../../artifacts/contracts/current/defi/PlayerVault.sol/PlayerVault.json");
    const abiDestPath = path.join(__dirname, "../../abis/PlayerVault.json");
    
    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
      fs.writeFileSync(abiDestPath, JSON.stringify(artifact.abi, null, 2));
      console.log("✅ Updated PlayerVault ABI file");
    }

    console.log("\n🎯 Deployment Summary:");
    console.log("PlayerVault:", playerVaultAddress);
    console.log("\n⚠️  Next Steps:");
    console.log("1. Update subgraph with CommissionWithdrawn event support");
    console.log("2. Configure PlayerVault in DungeonCore");
    console.log("3. Deploy updated subgraph to The Graph Studio");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});