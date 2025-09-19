// Deployment script for DungeonDelvers v1.3.9.6
// Focus: Only deploy AltarOfAscension + Party with uint16 optimizations
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Gas price: 0.11 gwei (BSC mainnet optimized)
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// Current addresses (v1.3.9.6)
const CURRENT_ADDRESSES = {
    DUNGEONCORE: "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f", // Core contract
    ALTAROFASCENSION: "0x957930c62a274519779c3ef305ceab28fc90817b", // Old version
    PARTY: "0x047de9d685735f79eeae9f094977460e64ef0eb9", // Old version
};

// New addresses (v1.3.9.6) - will be populated during deployment
const NEW_ADDRESSES = {};

async function main() {
    console.log("🚀 Starting DungeonDelvers v1.3.9.6 Targeted Deployment");
    console.log("🎯 Contracts: AltarOfAscension + Party only");
    console.log("⚡ Gas Price:", ethers.formatUnits(GAS_PRICE, "gwei"), "gwei");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Deploying with account:", deployer.address);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 Account balance:", ethers.formatEther(balance), "BNB");

    // Gas price configuration
    const gasConfig = {
        gasPrice: GAS_PRICE
    };

    try {
        console.log("\n🔥 Phase 1: Deploy Target Contracts");
        
        // 1. Deploy AltarOfAscension
        console.log("⚡ Deploying AltarOfAscension (with VRF + uint16 optimizations)...");
        const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
        const altarOfAscension = await AltarOfAscension.deploy(gasConfig);
        await altarOfAscension.waitForDeployment();
        NEW_ADDRESSES.ALTAROFASCENSION = await altarOfAscension.getAddress();
        console.log("✅ AltarOfAscension deployed:", NEW_ADDRESSES.ALTAROFASCENSION);

        // 2. Deploy Party
        console.log("👥 Deploying Party (with uint16 power integration)...");
        const Party = await ethers.getContractFactory("Party");
        const party = await Party.deploy(gasConfig);
        await party.waitForDeployment();
        NEW_ADDRESSES.PARTY = await party.getAddress();
        console.log("✅ Party deployed:", NEW_ADDRESSES.PARTY);

        console.log("\n🔥 Phase 2: Configure Contracts with DungeonCore");
        
        // Configure AltarOfAscension with DungeonCore
        console.log("⚙️ Configuring AltarOfAscension with DungeonCore...");
        await altarOfAscension.setDungeonCore(CURRENT_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ AltarOfAscension configured with DungeonCore");

        // Configure Party with DungeonCore
        console.log("⚙️ Configuring Party with DungeonCore...");
        await party.setDungeonCore(CURRENT_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ Party configured with DungeonCore");

        // ============ DEPLOYMENT SUMMARY ============
        console.log("\n🎉 v1.3.9.6 Deployment Summary");
        console.log("================================");
        console.log("ALTAROFASCENSION:", NEW_ADDRESSES.ALTAROFASCENSION);
        console.log("PARTY:", NEW_ADDRESSES.PARTY);
        
        console.log("\n📋 Key Improvements:");
        console.log("- AltarOfAscension: VRF true random + uint16 power generation");
        console.log("- Party: uint16 power compatibility + optimized gas usage");
        
        console.log("\n📋 Next Steps:");
        console.log("1. Update DungeonCore with new addresses (run update_core_v1.3.9.6.js)");
        console.log("2. Verify contracts on BSCScan (run verify_v1.3.9.6.js)");
        console.log("3. Update subgraph with new addresses");
        console.log("4. Update frontend contract addresses");

        // Save deployment info
        const deploymentInfo = {
            version: "v1.3.9.6",
            network: "BSC Mainnet",
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            gasPrice: "0.11 gwei",
            oldAddresses: {
                ALTAROFASCENSION: CURRENT_ADDRESSES.ALTAROFASCENSION,
                PARTY: CURRENT_ADDRESSES.PARTY,
            },
            newAddresses: NEW_ADDRESSES,
            improvements: {
                altarOfAscension: {
                    vrfIntegration: "True random power generation using VRF",
                    typeOptimization: "uint256 → uint16 power return type",
                    errorHandling: "Consistent error handling with Hero contract"
                },
                party: {
                    typeCompatibility: "uint16 power compatibility with Hero contract",
                    gasOptimization: "Reduced gas usage in hero power calculations"
                }
            }
        };
        
        const deploymentDir = path.join(__dirname, '..', 'deployments');
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const deploymentFile = path.join(deploymentDir, 'v1.3.9.6_deployment.json');
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
        console.log("✅ Deployment info saved to:", deploymentFile);
        
        console.log("\n🚀 v1.3.9.6 Deployment completed successfully!");

    } catch (error) {
        console.error("\n❌ Deployment failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    });