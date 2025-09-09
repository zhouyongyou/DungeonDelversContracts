// redeploy-hero-relic.js - Redeploy Hero and Relic contracts
const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

async function main() {
  console.log("🎮 Redeploying Hero and Relic Contracts");
  console.log("=" .repeat(60));

  const [deployer] = await ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "BNB");

  const deployedContracts = {};

  try {
    // Deploy Hero NFT
    console.log("\n🚀 Deploying Hero NFT...");
    
    const HeroFactory = await ethers.getContractFactory("Hero");
    const hero = await HeroFactory.deploy({
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    });

    await hero.waitForDeployment();
    const heroAddress = await hero.getAddress();
    deployedContracts.hero = heroAddress;
    
    console.log("✅ Hero deployed at:", heroAddress);

    // Deploy Relic NFT
    console.log("\n🚀 Deploying Relic NFT...");
    
    const RelicFactory = await ethers.getContractFactory("Relic");
    const relic = await RelicFactory.deploy({
      gasPrice: GAS_PRICE,
      gasLimit: GAS_LIMIT
    });

    await relic.waitForDeployment();
    const relicAddress = await relic.getAddress();
    deployedContracts.relic = relicAddress;
    
    console.log("✅ Relic deployed at:", relicAddress);

    // Update .env file with new addresses
    console.log("\n📝 Updating configuration files...");
    
    const envPath = path.join(__dirname, "../../.env");
    let envContent = fs.readFileSync(envPath, "utf8");
    
    // Update Hero address
    envContent = envContent.replace(
      /VITE_HERO_ADDRESS=.*/,
      `VITE_HERO_ADDRESS=${heroAddress.toLowerCase()}`
    );
    envContent = envContent.replace(
      /HERO_ADDRESS=.*/,
      `HERO_ADDRESS=${heroAddress.toLowerCase()}`
    );
    
    // Update Relic address
    envContent = envContent.replace(
      /VITE_RELIC_ADDRESS=.*/,
      `VITE_RELIC_ADDRESS=${relicAddress.toLowerCase()}`
    );
    envContent = envContent.replace(
      /RELIC_ADDRESS=.*/,
      `RELIC_ADDRESS=${relicAddress.toLowerCase()}`
    );
    
    fs.writeFileSync(envPath, envContent);
    console.log("✅ Updated .env with new addresses");

    // Update ABI files
    const heroArtifactPath = path.join(__dirname, "../../artifacts/contracts/current/nft/Hero.sol/Hero.json");
    const relicArtifactPath = path.join(__dirname, "../../artifacts/contracts/current/nft/Relic.sol/Relic.json");
    
    const heroAbiDestPath = path.join(__dirname, "../../abis/Hero.json");
    const relicAbiDestPath = path.join(__dirname, "../../abis/Relic.json");
    
    if (fs.existsSync(heroArtifactPath)) {
      const heroArtifact = JSON.parse(fs.readFileSync(heroArtifactPath, "utf8"));
      fs.writeFileSync(heroAbiDestPath, JSON.stringify(heroArtifact.abi, null, 2));
      console.log("✅ Updated Hero ABI file");
    }
    
    if (fs.existsSync(relicArtifactPath)) {
      const relicArtifact = JSON.parse(fs.readFileSync(relicArtifactPath, "utf8"));
      fs.writeFileSync(relicAbiDestPath, JSON.stringify(relicArtifact.abi, null, 2));
      console.log("✅ Updated Relic ABI file");
    }

    console.log("\n🎯 Deployment Summary:");
    console.log("Hero:", heroAddress);
    console.log("Relic:", relicAddress);
    
    console.log("\n⚠️  Next Steps:");
    console.log("1. Verify contracts on BSCScan");
    console.log("2. Configure Hero and Relic in DungeonCore");
    console.log("3. Update subgraph with new addresses");
    console.log("4. Update frontend and backend configurations");

  } catch (error) {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});