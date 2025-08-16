// set-hero-platform-fee.js - Set platform fee for Hero contract
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔧 Setting Hero Contract Platform Fee...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const HERO_ADDRESS = '0xD48867dbac5f1c1351421726B6544f847D9486af';
    const NEW_PLATFORM_FEE = ethers.parseEther("0.0003"); // 0.0003 BNB per NFT
    
    const heroABI = [
        'function platformFee() external view returns (uint256)',
        'function setPlatformFee(uint256 _newFee) external',
        'function owner() external view returns (address)'
    ];

    try {
        const hero = new ethers.Contract(HERO_ADDRESS, heroABI, wallet);
        
        // Check current state
        console.log("📋 Current State:");
        console.log("=" .repeat(60));
        
        const owner = await hero.owner();
        console.log("Contract Owner:", owner);
        console.log("Caller Address:", wallet.address);
        console.log("Is Owner:", owner.toLowerCase() === wallet.address.toLowerCase() ? "✅" : "❌");
        
        const currentFee = await hero.platformFee();
        console.log("Current Platform Fee:", ethers.formatEther(currentFee), "BNB");
        console.log("Target Platform Fee:", ethers.formatEther(NEW_PLATFORM_FEE), "BNB");
        
        if (currentFee === NEW_PLATFORM_FEE) {
            console.log("\n✅ Platform fee is already set correctly!");
            return;
        }
        
        if (owner.toLowerCase() !== wallet.address.toLowerCase()) {
            console.log("\n❌ Error: You are not the owner of the Hero contract!");
            console.log("   Only the owner can set the platform fee.");
            return;
        }
        
        // Set new platform fee
        console.log("\n🚀 Setting New Platform Fee...");
        console.log("=" .repeat(60));
        
        const tx = await hero.setPlatformFee(NEW_PLATFORM_FEE, {
            gasLimit: 100000
        });
        
        console.log("Transaction Hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction Confirmed!");
        console.log("Block Number:", receipt.blockNumber);
        console.log("Gas Used:", receipt.gasUsed.toString());
        
        // Verify the change
        console.log("\n🔍 Verifying Change...");
        const newFee = await hero.platformFee();
        console.log("New Platform Fee:", ethers.formatEther(newFee), "BNB");
        
        if (newFee === NEW_PLATFORM_FEE) {
            console.log("✅ Platform fee successfully updated!");
            
            console.log("\n📊 Updated Fee Structure:");
            console.log("=" .repeat(60));
            console.log("Platform Fee: 0.0003 BNB per NFT");
            console.log("VRF Fee: 0.005 BNB per mint transaction");
            console.log("\nExamples:");
            console.log("- Mint 1 NFT: 0.0003 + 0.005 = 0.0053 BNB");
            console.log("- Mint 5 NFTs: (0.0003 * 5) + 0.005 = 0.0065 BNB");
            console.log("- Mint 10 NFTs: (0.0003 * 10) + 0.005 = 0.008 BNB");
        } else {
            console.log("❌ Platform fee update failed!");
        }
        
    } catch (error) {
        console.error("\n❌ Error:", error.message);
        
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
    }
}

main()
    .then(() => {
        console.log("\n✅ Script Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });