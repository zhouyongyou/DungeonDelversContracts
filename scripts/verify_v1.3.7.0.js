// Verify deployed contracts on BSCScan v1.3.9.6
const { run } = require("hardhat");
const fs = require('fs');
const path = require('path');

// Contract verification with constructor arguments
const VERIFICATION_CONFIG = {
    DUNGEONSTORAGE: {
        contractName: "DungeonStorage",
        constructorArguments: [] // No constructor args
    },
    PLAYERPROFILE: {
        contractName: "PlayerProfile", 
        constructorArguments: [] // No constructor args
    },
    VIPSTAKING: {
        contractName: "VIPStaking",
        constructorArguments: [] // No constructor args
    },
    HERO: {
        contractName: "Hero",
        constructorArguments: [] // No constructor args
    },
    RELIC: {
        contractName: "Relic", 
        constructorArguments: [] // No constructor args
    },
    PARTY: {
        contractName: "Party",
        constructorArguments: [] // No constructor args
    },
    PLAYERVAULT: {
        contractName: "PlayerVault",
        constructorArguments: [] // No constructor args
    },
    ALTAROFASCENSION: {
        contractName: "AltarOfAscension",
        constructorArguments: [] // No constructor args
    },
    DUNGEONMASTER: {
        contractName: "DungeonMaster",
        constructorArguments: [] // No constructor args
    }
};

async function verifyContract(contractName, address, constructorArguments = []) {
    console.log(`🔍 Verifying ${contractName} at ${address}...`);
    
    try {
        await run("verify:verify", {
            address: address,
            constructorArguments: constructorArguments,
        });
        console.log(`✅ ${contractName} verified successfully!`);
        return true;
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log(`⚠️ ${contractName} is already verified`);
            return true;
        } else {
            console.error(`❌ Failed to verify ${contractName}:`, error.message);
            return false;
        }
    }
}

async function main() {
    console.log("🔍 Starting BSCScan Verification for v1.3.9.6");
    
    try {
        // Load deployment info
        const deploymentPath = path.join(__dirname, '../deployments/v1.3.9.6_deployment.json');
        if (!fs.existsSync(deploymentPath)) {
            throw new Error("Deployment file not found. Run deploy_v1.3.9.6.js first.");
        }

        const deploymentInfo = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
        const addresses = deploymentInfo.newAddresses;

        if (!addresses) {
            throw new Error("New addresses not found in deployment file");
        }

        console.log("📋 Contracts to verify:");
        Object.entries(addresses).forEach(([name, address]) => {
            console.log(`  ${name}: ${address}`);
        });

        // Verification results
        const verificationResults = {};
        let successCount = 0;
        let totalCount = 0;

        // Wait a bit to ensure contracts are indexed by BSCScan
        console.log("\n⏳ Waiting 30 seconds for BSCScan indexing...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Verify each contract
        console.log("\n🔍 Starting verification process...");
        
        for (const [contractKey, contractAddress] of Object.entries(addresses)) {
            if (VERIFICATION_CONFIG[contractKey]) {
                totalCount++;
                const config = VERIFICATION_CONFIG[contractKey];
                
                const success = await verifyContract(
                    config.contractName,
                    contractAddress,
                    config.constructorArguments
                );
                
                verificationResults[contractKey] = {
                    address: contractAddress,
                    contractName: config.contractName,
                    verified: success,
                    timestamp: new Date().toISOString()
                };

                if (success) successCount++;

                // Wait between verifications to avoid rate limiting
                console.log("⏳ Waiting 5 seconds...");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }

        // ============ SAVE VERIFICATION RESULTS ============
        const verificationInfo = {
            ...deploymentInfo,
            verificationTimestamp: new Date().toISOString(),
            verificationResults: verificationResults,
            verificationSummary: {
                totalContracts: totalCount,
                successfullyVerified: successCount,
                failedVerifications: totalCount - successCount,
                successRate: `${Math.round((successCount / totalCount) * 100)}%`
            }
        };

        fs.writeFileSync(deploymentPath, JSON.stringify(verificationInfo, null, 2));

        // ============ SUMMARY ============
        console.log("\n🎉 Verification Summary v1.3.9.6");
        console.log("==================================");
        console.log(`📊 Total contracts: ${totalCount}`);
        console.log(`✅ Successfully verified: ${successCount}`);
        console.log(`❌ Failed verifications: ${totalCount - successCount}`);
        console.log(`📈 Success rate: ${Math.round((successCount / totalCount) * 100)}%`);

        console.log("\n📋 Verification Results:");
        Object.entries(verificationResults).forEach(([name, result]) => {
            const status = result.verified ? "✅ VERIFIED" : "❌ FAILED";
            console.log(`  ${name}: ${status} (${result.address})`);
        });

        if (successCount === totalCount) {
            console.log("\n🚀 All contracts verified successfully!");
            console.log("\n📋 Next Steps:");
            console.log("1. ✅ Deploy contracts - COMPLETED");
            console.log("2. ✅ Update DungeonCore - COMPLETED");
            console.log("3. ✅ Verify contracts - COMPLETED");
            console.log("4. 🔄 Update subgraph with new addresses");
            console.log("5. 🔄 Update frontend contract addresses");
            console.log("6. 🔄 Update backend contract addresses");
        } else {
            console.log("\n⚠️ Some contracts failed verification. Please check the errors above.");
            console.log("You can re-run this script to retry failed verifications.");
        }

        console.log(`\n✅ Verification results saved to: ${deploymentPath}`);

    } catch (error) {
        console.error("❌ Verification process failed:", error);
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

module.exports = { main, verifyContract };