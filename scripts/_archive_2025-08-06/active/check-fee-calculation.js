// check-fee-calculation.js - Check fee calculation discrepancy
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔍 Checking Fee Calculation...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    
    const HERO_ADDRESS = '0xD48867dbac5f1c1351421726B6544f847D9486af';
    const VRF_MANAGER_V2PLUS = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';

    const heroABI = [
        'function platformFee() external view returns (uint256)',
        'function vrfManager() external view returns (address)'
    ];

    const vrfManagerABI = [
        'function getVrfRequestPrice() external view returns (uint256)',
        'function platformFee() external view returns (uint256)',
        'function getTotalFee() external view returns (uint256)'
    ];

    try {
        const hero = new ethers.Contract(HERO_ADDRESS, heroABI, provider);
        const vrfManager = new ethers.Contract(VRF_MANAGER_V2PLUS, vrfManagerABI, provider);
        
        // Get fees
        const heroPlatformFee = await hero.platformFee();
        const vrfPrice = await vrfManager.getVrfRequestPrice();
        const vrfPlatformFee = await vrfManager.platformFee();
        
        console.log("📊 Fee Configuration:");
        console.log("=" .repeat(60));
        
        console.log("\nHero Contract:");
        console.log("  Platform Fee:", ethers.formatEther(heroPlatformFee), "BNB");
        
        console.log("\nVRF Manager:");
        console.log("  VRF Price:", ethers.formatEther(vrfPrice), "BNB");
        console.log("  Platform Fee:", ethers.formatEther(vrfPlatformFee), "BNB");
        
        // Calculate for different quantities
        console.log("\n💰 Fee Calculations:");
        console.log("=" .repeat(60));
        
        for (const quantity of [1, 2, 5, 10]) {
            console.log(`\nQuantity: ${quantity}`);
            
            // Hero's expectation (based on code)
            const heroExpects = (heroPlatformFee * BigInt(quantity)) + vrfPrice;
            console.log("  Hero expects:", ethers.formatEther(heroExpects), "BNB");
            console.log("    = (platformFee * quantity) + vrfFee");
            console.log(`    = (${ethers.formatEther(heroPlatformFee)} * ${quantity}) + ${ethers.formatEther(vrfPrice)}`);
            
            // What we were sending
            const vrfManagerTotal = await vrfManager.getTotalFee();
            const weSend = vrfManagerTotal * BigInt(quantity);
            console.log("  We were sending:", ethers.formatEther(weSend), "BNB");
            console.log("    = vrfManager.getTotalFee() * quantity");
            console.log(`    = ${ethers.formatEther(vrfManagerTotal)} * ${quantity}`);
            
            // Difference
            if (heroExpects > weSend) {
                console.log("  ❌ SHORT BY:", ethers.formatEther(heroExpects - weSend), "BNB");
            } else if (weSend > heroExpects) {
                console.log("  ✅ EXCESS:", ethers.formatEther(weSend - heroExpects), "BNB");
            } else {
                console.log("  ✅ EXACT MATCH");
            }
        }
        
        console.log("\n🔍 Analysis:");
        console.log("=" .repeat(60));
        console.log("The issue is a fee calculation mismatch:");
        console.log("- Hero: (platformFee * quantity) + vrfFee");
        console.log("- VRFManager: (platformFee + vrfFee) * quantity");
        console.log("\nFor quantity=1, both should be the same, but Hero's");
        console.log("platformFee might be different from VRFManager's platformFee.");
        
        if (heroPlatformFee !== vrfPlatformFee) {
            console.log("\n⚠️ Platform fees don't match!");
            console.log("Hero platformFee:", ethers.formatEther(heroPlatformFee), "BNB");
            console.log("VRF platformFee:", ethers.formatEther(vrfPlatformFee), "BNB");
        }
        
    } catch (error) {
        console.error("\n❌ Error:", error.message);
    }
}

main()
    .then(() => {
        console.log("\n✅ Analysis Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });