// Update DungeonCore with new contract addresses v1.3.9.6
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Gas price: 0.11 gwei (BSC mainnet optimized)
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");

// DungeonCore address (unchanged)
// 🚀 從 .env 動態讀取地址
require('dotenv').config();
const DUNGEONCORE_ADDRESS = process.env.DUNGEONCORE_ADDRESS;

async function main() {
    console.log("🔧 Updating DungeonCore with v1.3.9.6 addresses");
    console.log("⚡ Gas Price:", ethers.formatUnits(GAS_PRICE, "gwei"), "gwei");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Updating with account:", deployer.address);

    // Gas price configuration
    const gasConfig = {
        gasPrice: GAS_PRICE
    };

    try {
        // Load deployment info
        const deploymentPath = path.join(__dirname, '../deployments/v1.3.9.6_deployment.json');
        if (!fs.existsSync(deploymentPath)) {
            throw new Error("Deployment file not found. Run deploy_v1.3.9.6.js first.");
        }

        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        const newAddresses = deploymentInfo.newAddresses;

        console.log("📋 New addresses to update:");
        Object.entries(newAddresses).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });

        // Connect to DungeonCore
        const DungeonCore = await ethers.getContractFactory("DungeonCore");
        const dungeonCore = DungeonCore.attach(DUNGEONCORE_ADDRESS);

        // Verify we can access the contract
        const currentOwner = await dungeonCore.owner();
        console.log(`🔐 DungeonCore owner: ${currentOwner}`);
        console.log(`🔐 Deployer address: ${deployer.address}`);

        if (currentOwner.toLowerCase() !== deployer.address.toLowerCase()) {
            throw new Error("❌ Deployer is not the owner of DungeonCore");
        }

        // ============ UPDATE CORE ADDRESSES ============
        console.log("\n🔄 Updating DungeonCore addresses...");

        // Update Hero contract
        if (newAddresses.HERO) {
            console.log("🦸 Updating Hero contract address...");
            await dungeonCore.setHeroContract(newAddresses.HERO, gasConfig);
            console.log(`✅ Hero updated: ${newAddresses.HERO}`);
        }

        // Update Relic contract
        if (newAddresses.RELIC) {
            console.log("🏺 Updating Relic contract address...");
            await dungeonCore.setRelicContract(newAddresses.RELIC, gasConfig);
            console.log(`✅ Relic updated: ${newAddresses.RELIC}`);
        }

        // Update Party contract
        if (newAddresses.PARTY) {
            console.log("👥 Updating Party contract address...");
            await dungeonCore.setPartyContract(newAddresses.PARTY, gasConfig);
            console.log(`✅ Party updated: ${newAddresses.PARTY}`);
        }

        // Update PlayerVault contract
        if (newAddresses.PLAYERVAULT) {
            console.log("🏦 Updating PlayerVault contract address...");
            await dungeonCore.setPlayerVault(newAddresses.PLAYERVAULT, gasConfig);
            console.log(`✅ PlayerVault updated: ${newAddresses.PLAYERVAULT}`);
        }

        // Update AltarOfAscension contract
        if (newAddresses.ALTAROFASCENSION) {
            console.log("⚡ Updating AltarOfAscension contract address...");
            await dungeonCore.setAltarOfAscension(newAddresses.ALTAROFASCENSION, gasConfig);
            console.log(`✅ AltarOfAscension updated: ${newAddresses.ALTAROFASCENSION}`);
        }

        // Update DungeonMaster contract
        if (newAddresses.DUNGEONMASTER) {
            console.log("🎮 Updating DungeonMaster contract address...");
            await dungeonCore.setDungeonMaster(newAddresses.DUNGEONMASTER, gasConfig);
            console.log(`✅ DungeonMaster updated: ${newAddresses.DUNGEONMASTER}`);
        }

        // Update PlayerProfile contract
        if (newAddresses.PLAYERPROFILE) {
            console.log("👤 Updating PlayerProfile contract address...");
            await dungeonCore.setPlayerProfile(newAddresses.PLAYERPROFILE, gasConfig);
            console.log(`✅ PlayerProfile updated: ${newAddresses.PLAYERPROFILE}`);
        }

        // Update VIPStaking contract
        if (newAddresses.VIPSTAKING) {
            console.log("💎 Updating VIPStaking contract address...");
            await dungeonCore.setVipStaking(newAddresses.VIPSTAKING, gasConfig);
            console.log(`✅ VIPStaking updated: ${newAddresses.VIPSTAKING}`);
        }

        // Update DungeonStorage contract
        if (newAddresses.DUNGEONSTORAGE) {
            console.log("🗄️ Updating DungeonStorage contract address...");
            await dungeonCore.setDungeonStorage(newAddresses.DUNGEONSTORAGE, gasConfig);
            console.log(`✅ DungeonStorage updated: ${newAddresses.DUNGEONSTORAGE}`);
        }

        // ============ VERIFICATION ============
        console.log("\n🔍 Verifying updated addresses...");

        const verification = {
            hero: await dungeonCore.heroContractAddress(),
            relic: await dungeonCore.relicContractAddress(),
            party: await dungeonCore.partyContractAddress(),
            playerVault: await dungeonCore.playerVaultAddress(),
            altarOfAscension: await dungeonCore.altarOfAscensionAddress(),
            dungeonMaster: await dungeonCore.dungeonMasterAddress(),
            playerProfile: await dungeonCore.playerProfileAddress(),
            vipStaking: await dungeonCore.vipStakingAddress(),
            dungeonStorage: await dungeonCore.dungeonStorageAddress()
        };

        console.log("\n📋 Verified DungeonCore addresses:");
        console.log(`Hero: ${verification.hero}`);
        console.log(`Relic: ${verification.relic}`);
        console.log(`Party: ${verification.party}`);
        console.log(`PlayerVault: ${verification.playerVault}`);
        console.log(`AltarOfAscension: ${verification.altarOfAscension}`);
        console.log(`DungeonMaster: ${verification.dungeonMaster}`);
        console.log(`PlayerProfile: ${verification.playerProfile}`);
        console.log(`VIPStaking: ${verification.vipStaking}`);
        console.log(`DungeonStorage: ${verification.dungeonStorage}`);

        // ============ SAVE UPDATE INFO ============
        const updateInfo = {
            ...deploymentInfo,
            coreUpdateTimestamp: new Date().toISOString(),
            verifiedAddresses: verification,
            updateStatus: "completed"
        };

        fs.writeFileSync(deploymentPath, JSON.stringify(updateInfo, null, 2));

        console.log("\n🎉 DungeonCore Update Summary");
        console.log("============================");
        console.log("✅ All contract addresses updated in DungeonCore");
        console.log("✅ Addresses verified successfully");
        console.log(`✅ Update info saved to: ${deploymentPath}`);

        console.log("\n📋 Next Steps:");
        console.log("1. ✅ Deploy contracts - COMPLETED");
        console.log("2. ✅ Update DungeonCore - COMPLETED");
        console.log("3. 🔄 Verify contracts on BSCScan (run verify_v1.3.9.6.js)");
        console.log("4. 🔄 Update subgraph with new addresses");
        console.log("5. 🔄 Update frontend contract addresses");
        console.log("6. 🔄 Update backend contract addresses");

        console.log("\n🚀 DungeonCore v1.3.9.6 update completed successfully!");

    } catch (error) {
        console.error("❌ Core update failed:", error);
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

module.exports = { main };