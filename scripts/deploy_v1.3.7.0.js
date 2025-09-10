// Deployment script for DungeonDelvers v1.3.7.0
// Features: Hero uint16 optimization + ERC-4906 support
// 🔥 重構：從 .env 動態讀取地址，消除硬編碼
require('dotenv').config();
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Gas price: 0.11 gwei (BSC mainnet optimized)
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// 🚀 從 .env 動態讀取當前地址
const OLD_ADDRESSES = {
    DUNGEONCORE: process.env.DUNGEONCORE_ADDRESS,
    HERO: process.env.HERO_ADDRESS,
    RELIC: process.env.RELIC_ADDRESS,
    PARTY: process.env.PARTY_ADDRESS,
    VIPSTAKING: process.env.VIPSTAKING_ADDRESS,
    PLAYERPROFILE: process.env.PLAYERPROFILE_ADDRESS,
    ALTAROFASCENSION: process.env.ALTAROFASCENSION_ADDRESS,
    DUNGEONMASTER: process.env.DUNGEONMASTER_ADDRESS,
    DUNGEONSTORAGE: process.env.DUNGEONSTORAGE_ADDRESS,
    PLAYERVAULT: process.env.PLAYERVAULT_ADDRESS
};

// New addresses (v1.3.7.0) - will be populated during deployment
const NEW_ADDRESSES = {};

async function main() {
    console.log("🚀 Starting DungeonDelvers v1.3.7.0 Deployment");
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
        // ============ PHASE 1: Independent Contracts ============
        console.log("\n🔥 Phase 1: Deploying Independent Contracts");
        
        // 1. Deploy DungeonStorage
        console.log("📦 Deploying DungeonStorage...");
        const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
        const dungeonStorage = await DungeonStorage.deploy(gasConfig);
        await dungeonStorage.waitForDeployment();
        NEW_ADDRESSES.DUNGEONSTORAGE = await dungeonStorage.getAddress();
        console.log("✅ DungeonStorage deployed:", NEW_ADDRESSES.DUNGEONSTORAGE);

        // 2. Deploy PlayerProfile
        console.log("📦 Deploying PlayerProfile...");
        const PlayerProfile = await ethers.getContractFactory("PlayerProfile");
        const playerProfile = await PlayerProfile.deploy(gasConfig);
        await playerProfile.waitForDeployment();
        NEW_ADDRESSES.PLAYERPROFILE = await playerProfile.getAddress();
        console.log("✅ PlayerProfile deployed:", NEW_ADDRESSES.PLAYERPROFILE);

        // 3. Deploy VIPStaking
        console.log("📦 Deploying VIPStaking...");
        const VIPStaking = await ethers.getContractFactory("VIPStaking");
        const vipStaking = await VIPStaking.deploy(gasConfig);
        await vipStaking.waitForDeployment();
        NEW_ADDRESSES.VIPSTAKING = await vipStaking.getAddress();
        console.log("✅ VIPStaking deployed:", NEW_ADDRESSES.VIPSTAKING);

        // ============ PHASE 2: Core NFT Contracts ============
        console.log("\n🔥 Phase 2: Deploying Core NFT Contracts");
        
        // 4. Deploy Hero (with uint16 optimization)
        console.log("📦 Deploying Hero (with uint16 power optimization)...");
        const Hero = await ethers.getContractFactory("Hero");
        const hero = await Hero.deploy(gasConfig);
        await hero.waitForDeployment();
        NEW_ADDRESSES.HERO = await hero.getAddress();
        console.log("✅ Hero deployed:", NEW_ADDRESSES.HERO);

        // 5. Deploy Relic (with ERC-4906)
        console.log("📦 Deploying Relic (with ERC-4906 support)...");
        const Relic = await ethers.getContractFactory("Relic");
        const relic = await Relic.deploy(gasConfig);
        await relic.waitForDeployment();
        NEW_ADDRESSES.RELIC = await relic.getAddress();
        console.log("✅ Relic deployed:", NEW_ADDRESSES.RELIC);

        // ============ PHASE 3: Dependent Contracts ============
        console.log("\n🔥 Phase 3: Deploying Dependent Contracts");

        // 6. Deploy Party
        console.log("📦 Deploying Party...");
        const Party = await ethers.getContractFactory("Party");
        const party = await Party.deploy(gasConfig);
        await party.waitForDeployment();
        NEW_ADDRESSES.PARTY = await party.getAddress();
        console.log("✅ Party deployed:", NEW_ADDRESSES.PARTY);

        // 7. Deploy PlayerVault
        console.log("📦 Deploying PlayerVault...");
        const PlayerVault = await ethers.getContractFactory("PlayerVault");
        const playerVault = await PlayerVault.deploy(gasConfig);
        await playerVault.waitForDeployment();
        NEW_ADDRESSES.PLAYERVAULT = await playerVault.getAddress();
        console.log("✅ PlayerVault deployed:", NEW_ADDRESSES.PLAYERVAULT);

        // 8. Deploy AltarOfAscension
        console.log("📦 Deploying AltarOfAscension...");
        const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
        const altarOfAscension = await AltarOfAscension.deploy(gasConfig);
        await altarOfAscension.waitForDeployment();
        NEW_ADDRESSES.ALTAROFASCENSION = await altarOfAscension.getAddress();
        console.log("✅ AltarOfAscension deployed:", NEW_ADDRESSES.ALTAROFASCENSION);

        // 9. Deploy DungeonMaster
        console.log("📦 Deploying DungeonMaster...");
        const DungeonMaster = await ethers.getContractFactory("DungeonMaster");
        const dungeonMaster = await DungeonMaster.deploy(gasConfig);
        await dungeonMaster.waitForDeployment();
        NEW_ADDRESSES.DUNGEONMASTER = await dungeonMaster.getAddress();
        console.log("✅ DungeonMaster deployed:", NEW_ADDRESSES.DUNGEONMASTER);

        // ============ PHASE 4: Configuration ============
        console.log("\n🔥 Phase 4: Contract Configuration");

        // Configure Hero with DungeonCore
        console.log("⚙️ Configuring Hero contract...");
        await hero.setDungeonCore(OLD_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ Hero configured with DungeonCore");

        // Configure Relic with DungeonCore  
        console.log("⚙️ Configuring Relic contract...");
        await relic.setDungeonCore(OLD_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ Relic configured with DungeonCore");

        // Configure Party with DungeonCore
        console.log("⚙️ Configuring Party contract...");
        await party.setDungeonCore(OLD_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ Party configured");

        // Configure PlayerVault with DungeonCore
        console.log("⚙️ Configuring PlayerVault contract...");
        await playerVault.setDungeonCore(OLD_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ PlayerVault configured with DungeonCore");

        // Configure AltarOfAscension with DungeonCore
        console.log("⚙️ Configuring AltarOfAscension contract...");
        await altarOfAscension.setDungeonCore(OLD_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ AltarOfAscension configured with DungeonCore");

        // Configure DungeonMaster with DungeonCore
        console.log("⚙️ Configuring DungeonMaster contract...");
        await dungeonMaster.setDungeonCore(OLD_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ DungeonMaster configured with DungeonCore");

        // Configure DungeonStorage with DungeonCore
        console.log("⚙️ Configuring DungeonStorage contract...");
        await dungeonStorage.setDungeonCore(OLD_ADDRESSES.DUNGEONCORE, gasConfig);
        console.log("✅ DungeonStorage configured with DungeonCore");

        // ============ SAVE DEPLOYMENT INFO ============
        const deploymentInfo = {
            version: "v1.3.7.0",
            network: "BSC Mainnet", 
            timestamp: new Date().toISOString(),
            deployer: deployer.address,
            gasPrice: ethers.formatUnits(GAS_PRICE, "gwei") + " gwei",
            oldAddresses: OLD_ADDRESSES,
            newAddresses: NEW_ADDRESSES,
            upgrades: {
                hero: {
                    powerOptimization: "uint256 → uint16 (50% gas saving)",
                    erc4906Support: "Added MetadataUpdate events"
                },
                relic: {
                    erc4906Support: "Added MetadataUpdate events"
                }
            }
        };

        // Save to file
        const outputPath = path.join(__dirname, '../deployments/v1.3.7.0_deployment.json');
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

        // ============ SUMMARY ============
        console.log("\n🎉 Deployment Summary v1.3.7.0");
        console.log("================================");
        Object.entries(NEW_ADDRESSES).forEach(([name, address]) => {
            console.log(`${name}: ${address}`);
        });

        console.log("\n📋 Next Steps:");
        console.log("1. Update DungeonCore with new addresses (run update_core.js)");
        console.log("2. Verify contracts on BSCScan (run verify.js)");
        console.log("3. Update subgraph with new addresses");
        console.log("4. Update frontend contract addresses");
        console.log("5. Update backend contract addresses");

        console.log(`\n✅ Deployment info saved to: ${outputPath}`);
        console.log("🚀 v1.3.7.0 Deployment completed successfully!");

    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

// Handle script execution
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main, NEW_ADDRESSES, OLD_ADDRESSES };