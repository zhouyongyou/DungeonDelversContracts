// check-all-contracts-status.js - Check all contracts status and configuration
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔍 Checking All Contracts Status...\n");
    console.log("=" .repeat(70));

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    
    // Contract addresses
    const contracts = {
        HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
        RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
        ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
        DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
        VRF_MANAGER_V2PLUS: '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038'
    };

    // Common ABI elements
    const commonABI = [
        'function vrfManager() external view returns (address)',
        'function platformFee() external view returns (uint256)',
        'function owner() external view returns (address)',
        'function paused() external view returns (bool)'
    ];

    const vrfManagerABI = [
        'function getVrfRequestPrice() external view returns (uint256)',
        'function platformFee() external view returns (uint256)',
        'function isAuthorized(address) external view returns (bool)'
    ];

    try {
        const vrfManager = new ethers.Contract(contracts.VRF_MANAGER_V2PLUS, vrfManagerABI, provider);
        
        // Get VRF Manager fees
        const vrfPrice = await vrfManager.getVrfRequestPrice();
        const vrfPlatformFee = await vrfManager.platformFee();
        
        console.log("📊 VRF Manager Configuration");
        console.log("=" .repeat(70));
        console.log("Address:", contracts.VRF_MANAGER_V2PLUS);
        console.log("VRF Price:", ethers.formatEther(vrfPrice), "BNB");
        console.log("Platform Fee:", ethers.formatEther(vrfPlatformFee), "BNB");
        console.log("Total Fee:", ethers.formatEther(vrfPrice + vrfPlatformFee), "BNB");
        
        // Check each contract
        console.log("\n📋 Contract Status");
        console.log("=" .repeat(70));
        
        for (const [name, address] of Object.entries(contracts)) {
            if (name === 'VRF_MANAGER_V2PLUS') continue;
            
            console.log(`\n${name}:`);
            console.log("  Address:", address);
            
            const contract = new ethers.Contract(address, commonABI, provider);
            
            try {
                // Check VRF Manager
                const vrfManagerAddress = await contract.vrfManager();
                const isCorrectVRF = vrfManagerAddress.toLowerCase() === contracts.VRF_MANAGER_V2PLUS.toLowerCase();
                console.log("  VRF Manager:", vrfManagerAddress);
                console.log("  VRF Correct:", isCorrectVRF ? "✅" : "❌ NEEDS UPDATE");
                
                // Check authorization
                const isAuthorized = await vrfManager.isAuthorized(address);
                console.log("  Authorized in VRF:", isAuthorized ? "✅" : "❌ NEEDS AUTHORIZATION");
                
                // Check platform fee
                try {
                    const platformFee = await contract.platformFee();
                    console.log("  Platform Fee:", ethers.formatEther(platformFee), "BNB");
                    
                    if (platformFee === 0n && name !== 'DUNGEONMASTER') {
                        console.log("  ⚠️ Platform fee is 0 - may need to be set");
                    }
                } catch (e) {
                    console.log("  Platform Fee: N/A (no fee method)");
                }
                
                // Check paused status
                const paused = await contract.paused();
                console.log("  Paused:", paused ? "⏸️ YES" : "▶️ NO");
                
            } catch (error) {
                console.log("  ❌ Error checking contract:", error.message);
            }
        }
        
        // Summary
        console.log("\n" + "=" .repeat(70));
        console.log("📝 SUMMARY - Current Contract Addresses");
        console.log("=" .repeat(70));
        console.log("```javascript");
        console.log("// V26 Contract Addresses (VRF Fixed)");
        console.log("const contracts = {");
        for (const [name, address] of Object.entries(contracts)) {
            console.log(`  ${name}: '${address}',`);
        }
        console.log("};");
        console.log("```");
        
        console.log("\n📌 Action Items:");
        console.log("=" .repeat(70));
        console.log("1. RELIC Contract:");
        console.log("   - Check if platformFee needs to be set (currently checking...)");
        console.log("\n2. Frontend Updates Needed:");
        console.log("   - Update contract addresses in frontend config");
        console.log("   - Ensure calculateMintFee uses correct fee structure");
        console.log("   - Handle SoulShard token approval before minting");
        console.log("\n3. Subgraph Updates Needed:");
        console.log("   - Update contract addresses in subgraph.yaml");
        console.log("   - Add VRFManagerV2Plus as a data source");
        console.log("   - Re-deploy subgraph with new addresses");
        
    } catch (error) {
        console.error("\n❌ Error:", error.message);
    }
}

main()
    .then(() => {
        console.log("\n✅ Status Check Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });