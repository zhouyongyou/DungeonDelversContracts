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
    console.log("🎯 Target: AltarOfAscension + Party only");
    console.log("⚡ Gas Price:", ethers.formatUnits(GAS_PRICE, "gwei"), "gwei");
    
    const [deployer] = await ethers.getSigners();
    console.log("📝 Updating with account:", deployer.address);

    // Gas price configuration
    const gasConfig = {
        gasPrice: GAS_PRICE
    };

    try {
        // Read deployment addresses
        const deploymentFile = path.join(__dirname, '..', 'deployments', 'v1.3.9.6_deployment.json');
        if (!fs.existsSync(deploymentFile)) {
            throw new Error("❌ Deployment file not found. Run deploy_v1.3.9.6.js first!");
        }

        const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        const newAddresses = deploymentData.newAddresses;

        console.log("📋 New addresses to update:");
        console.log("  ALTAROFASCENSION:", newAddresses.ALTAROFASCENSION);
        console.log("  PARTY:", newAddresses.PARTY);

        // Get DungeonCore contract
        const dungeonCore = await ethers.getContractAt("DungeonCore", DUNGEONCORE_ADDRESS);
        
        // Verify ownership
        const owner = await dungeonCore.owner();
        console.log("🔐 DungeonCore owner:", owner);
        console.log("🔐 Deployer address:", deployer.address);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            throw new Error("❌ Only DungeonCore owner can update addresses!");
        }

        console.log("\n🔄 Updating DungeonCore addresses...");
        
        // Update AltarOfAscension address
        console.log("⚡ Updating AltarOfAscension contract address...");
        const updateAltarTx = await dungeonCore.setAltarOfAscension(newAddresses.ALTAROFASCENSION, gasConfig);
        await updateAltarTx.wait();
        console.log("✅ AltarOfAscension updated:", newAddresses.ALTAROFASCENSION);

        // Update Party address
        console.log("👥 Updating Party contract address...");
        const updatePartyTx = await dungeonCore.setPartyContract(newAddresses.PARTY, gasConfig);
        await updatePartyTx.wait();
        console.log("✅ Party updated:", newAddresses.PARTY);

        console.log("\n🔍 Verifying updated addresses...");
        
        // Verify addresses in DungeonCore
        const verifiedAltarAddress = await dungeonCore.altarOfAscensionAddress();
        const verifiedPartyAddress = await dungeonCore.partyContractAddress();
        
        console.log("\n📋 Verified DungeonCore addresses:");
        console.log("AltarOfAscension:", verifiedAltarAddress);
        console.log("Party:", verifiedPartyAddress);

        // Validate addresses match
        if (verifiedAltarAddress.toLowerCase() !== newAddresses.ALTAROFASCENSION.toLowerCase()) {
            throw new Error("❌ AltarOfAscension address mismatch in DungeonCore!");
        }
        if (verifiedPartyAddress.toLowerCase() !== newAddresses.PARTY.toLowerCase()) {
            throw new Error("❌ Party address mismatch in DungeonCore!");
        }

        // Update deployment info with core update status
        deploymentData.coreUpdateTimestamp = new Date().toISOString();
        deploymentData.verifiedAddresses = {
            altarOfAscension: verifiedAltarAddress,
            party: verifiedPartyAddress
        };
        deploymentData.updateStatus = "completed";

        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

        console.log("\n🎉 DungeonCore Update Summary");
        console.log("============================");
        console.log("✅ AltarOfAscension address updated in DungeonCore");
        console.log("✅ Party address updated in DungeonCore");
        console.log("✅ Addresses verified successfully");
        console.log("✅ Update info saved to:", deploymentFile);

        console.log("\n📋 Next Steps:");
        console.log("1. ✅ Deploy contracts - COMPLETED");
        console.log("2. ✅ Update DungeonCore - COMPLETED");
        console.log("3. 🔄 Verify contracts on BSCScan (run verify_v1.3.9.6.js)");
        console.log("4. 🔄 Update subgraph with new addresses");
        console.log("5. 🔄 Update frontend contract addresses");

        console.log("\n🚀 DungeonCore v1.3.9.6 update completed successfully!");

    } catch (error) {
        console.error("\n❌ Core update failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    });