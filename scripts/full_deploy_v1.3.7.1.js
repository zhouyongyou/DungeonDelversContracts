// Complete deployment pipeline for DungeonDelvers v1.3.9.6
// Target: AltarOfAscension + Party with uint16 optimizations
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

console.log("🚀 DungeonDelvers v1.3.9.6 Complete Deployment Pipeline");
console.log("==================================================");
console.log("Target Contracts:");
console.log("- AltarOfAscension: VRF integration + uint16 power optimization");
console.log("- Party: uint16 power compatibility + gas optimization");
console.log("");

async function runCommand(command, description) {
    try {
        console.log(`🔄 ${description}`);
        console.log(`📜 Running: ${command.split(' ').pop()}`);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        
        const { stdout, stderr } = await execAsync(command);
        
        if (stdout) console.log(stdout);
        if (stderr) console.warn(stderr);
        
        console.log(`✅ ${description} - COMPLETED\n`);
        return { success: true };
    } catch (error) {
        console.error(`❌ ${description} - FAILED`);
        console.error(`Error: ${error.message}`);
        console.error("");
        throw new Error(`Command failed: ${command}\n${error.message}`);
    }
}

async function main() {
    try {
        console.log("⏳ Starting complete deployment pipeline...\n");

        // Phase 1: Deploy contracts
        await runCommand(
            "npx hardhat run scripts/deploy_v1.3.9.6.js --network bsc",
            "Phase 1: Deploying AltarOfAscension and Party contracts"
        );

        // Wait for deployment to settle
        console.log("⏳ Waiting 30 seconds for deployment to settle...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Phase 2: Update DungeonCore
        await runCommand(
            "npx hardhat run scripts/update_core_v1.3.9.6.js --network bsc",
            "Phase 2: Updating DungeonCore with new contract addresses"
        );

        // Wait for core update to settle
        console.log("⏳ Waiting 30 seconds for core update to settle...");
        await new Promise(resolve => setTimeout(resolve, 30000));

        // Phase 3: Verify contracts
        await runCommand(
            "npx hardhat run scripts/verify_v1.3.9.6.js --network bsc",
            "Phase 3: Verifying contracts on BSCScan"
        );

        console.log("🎉 DEPLOYMENT PIPELINE COMPLETED SUCCESSFULLY!");
        console.log("=============================================");
        console.log("✅ All contracts deployed and configured");
        console.log("✅ DungeonCore updated with new addresses");
        console.log("✅ Contracts verified on BSCScan");
        console.log("");
        console.log("📋 Final Steps (Manual):");
        console.log("1. Update subgraph with new contract addresses");
        console.log("2. Update frontend contract addresses in .env");
        console.log("3. Update backend contract addresses (if needed)");
        console.log("");
        console.log("🔗 Check deployment details:");
        console.log("📄 deployments/v1.3.9.6_deployment.json");

    } catch (error) {
        console.error("\n❌ DEPLOYMENT PIPELINE FAILED");
        console.error("================================");
        console.error("Error:", error.message);
        console.error("");
        console.error("🔧 Troubleshooting:");
        console.error("1. Check network connection");
        console.error("2. Verify wallet has sufficient BNB");
        console.error("3. Check gas price (should be 0.11 gwei)");
        console.error("4. Verify all contracts compile successfully");
        console.error("5. Check BSCScan API rate limits");
        console.error("");
        console.error("📋 Manual Recovery:");
        console.error("- Run individual scripts separately:");
        console.error("  - npx hardhat run scripts/deploy_v1.3.9.6.js --network bsc");
        console.error("  - npx hardhat run scripts/update_core_v1.3.9.6.js --network bsc");
        console.error("  - npx hardhat run scripts/verify_v1.3.9.6.js --network bsc");
        
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Fatal pipeline error:", error);
        process.exit(1);
    });