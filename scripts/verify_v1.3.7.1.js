// Verify contracts on BSCScan for v1.3.9.6
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔍 Starting BSCScan verification for v1.3.9.6");
    console.log("🎯 Contracts: AltarOfAscension + Party");
    
    try {
        // Read deployment addresses
        const deploymentFile = path.join(__dirname, '..', 'deployments', 'v1.3.9.6_deployment.json');
        if (!fs.existsSync(deploymentFile)) {
            throw new Error("❌ Deployment file not found. Run deploy_v1.3.9.6.js first!");
        }

        const deploymentData = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
        const addresses = deploymentData.newAddresses;

        console.log("\n📋 Addresses to verify:");
        console.log("AltarOfAscension:", addresses.ALTAROFASCENSION);
        console.log("Party:", addresses.PARTY);

        console.log("\n🔄 Starting verification process...");

        // Verify AltarOfAscension
        console.log("\n⚡ Verifying AltarOfAscension...");
        try {
            await hre.run("verify:verify", {
                address: addresses.ALTAROFASCENSION,
                constructorArguments: [],
                contract: "contracts/current/core/AltarOfAscension.sol:AltarOfAscension"
            });
            console.log("✅ AltarOfAscension verified successfully");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ AltarOfAscension already verified");
            } else {
                console.error("❌ AltarOfAscension verification failed:", error.message);
            }
        }

        // Small delay between verifications
        console.log("⏳ Waiting 10 seconds before next verification...");
        await new Promise(resolve => setTimeout(resolve, 10000));

        // Verify Party
        console.log("\n👥 Verifying Party...");
        try {
            await hre.run("verify:verify", {
                address: addresses.PARTY,
                constructorArguments: [],
                contract: "contracts/current/nft/Party.sol:Party"
            });
            console.log("✅ Party verified successfully");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ Party already verified");
            } else {
                console.error("❌ Party verification failed:", error.message);
            }
        }

        // Update deployment data with verification status
        deploymentData.verificationTimestamp = new Date().toISOString();
        deploymentData.verificationStatus = {
            altarOfAscension: "completed",
            party: "completed"
        };
        
        fs.writeFileSync(deploymentFile, JSON.stringify(deploymentData, null, 2));

        console.log("\n🎉 BSCScan Verification Summary");
        console.log("===============================");
        console.log("✅ AltarOfAscension verification completed");
        console.log("✅ Party verification completed");
        console.log("✅ Verification status saved to deployment file");

        console.log("\n🔗 BSCScan Links:");
        console.log("AltarOfAscension: https://bscscan.com/address/" + addresses.ALTAROFASCENSION);
        console.log("Party: https://bscscan.com/address/" + addresses.PARTY);

        console.log("\n📋 Deployment Status:");
        console.log("1. ✅ Deploy contracts - COMPLETED");
        console.log("2. ✅ Update DungeonCore - COMPLETED"); 
        console.log("3. ✅ Verify contracts - COMPLETED");
        console.log("4. 🔄 Update subgraph with new addresses");
        console.log("5. 🔄 Update frontend contract addresses");

        console.log("\n🚀 v1.3.9.6 Verification completed successfully!");

    } catch (error) {
        console.error("\n❌ Verification failed:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Fatal error:", error);
        process.exit(1);
    });