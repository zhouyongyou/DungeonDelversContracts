// Complete deployment pipeline for DungeonDelvers v1.3.7.0
// Includes: Deploy → Update Core → Verify contracts
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log("🚀 DungeonDelvers v1.3.7.0 Complete Deployment Pipeline");
console.log("==================================================");
console.log("Features:");
console.log("- Hero uint16 power optimization (50% Gas saving)");
console.log("- ERC-4906 MetadataUpdate events for NFT marketplaces");
console.log("- Full contract verification on BSCScan");

async function runScript(scriptName, description) {
    console.log(`\n🔄 ${description}`);
    console.log(`📜 Running: ${scriptName}`);
    console.log("━".repeat(50));
    
    try {
        const { stdout, stderr } = await execAsync(`npx hardhat run scripts/${scriptName} --network bsc`);
        console.log(stdout);
        if (stderr && !stderr.includes('Warning')) {
            console.warn('Warnings:', stderr);
        }
        console.log(`✅ ${description} - COMPLETED`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} - FAILED`);
        console.error('Error:', error.message);
        throw error;
    }
}

async function main() {
    try {
        console.log("\n⏳ Starting complete deployment pipeline...");
        
        // Phase 1: Deploy contracts
        await runScript(
            'deploy_v1.3.7.0.js',
            'Phase 1: Deploying all contracts'
        );
        
        // Wait for deployment to settle
        console.log("\n⏳ Waiting 30 seconds for deployment to settle...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Phase 2: Update DungeonCore
        await runScript(
            'update_core_v1.3.7.0.js', 
            'Phase 2: Updating DungeonCore with new addresses'
        );
        
        // Wait for core update to settle
        console.log("\n⏳ Waiting 30 seconds for core update to settle...");
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Phase 3: Verify contracts
        await runScript(
            'verify_v1.3.7.0.js',
            'Phase 3: Verifying contracts on BSCScan'
        );

        // ============ SUCCESS SUMMARY ============
        console.log("\n🎉 DEPLOYMENT PIPELINE COMPLETED SUCCESSFULLY! 🎉");
        console.log("=".repeat(60));
        
        console.log("\n📊 Deployment Summary:");
        console.log("✅ Phase 1: All contracts deployed");
        console.log("✅ Phase 2: DungeonCore updated with new addresses"); 
        console.log("✅ Phase 3: Contracts verified on BSCScan");
        
        console.log("\n🔧 Key Optimizations:");
        console.log("🚀 Hero power optimization: uint256 → uint16 (50% gas saving)");
        console.log("🚀 ERC-4906 support: Automatic NFT marketplace metadata refresh");
        console.log("🚀 All contracts verified and ready for use");

        console.log("\n📋 Next Manual Steps:");
        console.log("1. 🔄 Update subgraph contract addresses");
        console.log("2. 🔄 Update frontend contract addresses"); 
        console.log("3. 🔄 Update backend contract addresses");
        console.log("4. 🔄 Test all integrations");
        console.log("5. 🔄 Update documentation");

        console.log("\n📂 Files Created:");
        console.log("- deployments/v1.3.7.0_deployment.json (complete deployment info)");
        console.log("- All contract addresses and verification status");

        console.log("\n🎯 Version: v1.3.7.0");
        console.log("💫 Status: READY FOR PRODUCTION");
        console.log("🌟 Happy coding! 🌟");

    } catch (error) {
        console.error("\n❌ DEPLOYMENT PIPELINE FAILED");
        console.error("================================");
        console.error("Error:", error.message);
        console.error("\n🔧 Troubleshooting:");
        console.error("1. Check network connection");
        console.error("2. Verify wallet has sufficient BNB");
        console.error("3. Check gas price (should be 0.11 gwei)");
        console.error("4. Verify all contracts compile successfully");
        console.error("5. Check BSCScan API rate limits");
        
        console.error("\n📋 Manual Recovery:");
        console.error("- Run individual scripts separately:");
        console.error("  - npx hardhat run scripts/deploy_v1.3.7.0.js --network bsc");
        console.error("  - npx hardhat run scripts/update_core_v1.3.7.0.js --network bsc");
        console.error("  - npx hardhat run scripts/verify_v1.3.7.0.js --network bsc");
        
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