// set-relic-platform-fee.js - Set platform fee for Relic contract
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔧 Setting Relic Contract Platform Fee...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const RELIC_ADDRESS = '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce';
    const NEW_PLATFORM_FEE = ethers.parseEther("0.0003"); // 0.0003 BNB per NFT
    
    const relicABI = [
        'function platformFee() external view returns (uint256)',
        'function setPlatformFee(uint256 _newFee) external',
        'function owner() external view returns (address)'
    ];

    try {
        const relic = new ethers.Contract(RELIC_ADDRESS, relicABI, wallet);
        
        // Check current state
        const owner = await relic.owner();
        console.log("Contract Owner:", owner);
        console.log("Caller Address:", wallet.address);
        console.log("Is Owner:", owner.toLowerCase() === wallet.address.toLowerCase() ? "✅" : "❌");
        
        const currentFee = await relic.platformFee();
        console.log("Current Platform Fee:", ethers.formatEther(currentFee), "BNB");
        console.log("Target Platform Fee:", ethers.formatEther(NEW_PLATFORM_FEE), "BNB");
        
        if (currentFee === NEW_PLATFORM_FEE) {
            console.log("\n✅ Platform fee is already set correctly!");
            return;
        }
        
        // Set new platform fee
        console.log("\n🚀 Setting new platform fee...");
        const tx = await relic.setPlatformFee(NEW_PLATFORM_FEE, {
            gasLimit: 100000
        });
        
        console.log("Transaction Hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction Confirmed!");
        console.log("Block Number:", receipt.blockNumber);
        
        // Verify the change
        const newFee = await relic.platformFee();
        console.log("\nNew Platform Fee:", ethers.formatEther(newFee), "BNB");
        
        if (newFee === NEW_PLATFORM_FEE) {
            console.log("✅ Relic platform fee successfully updated!");
        }
        
    } catch (error) {
        console.error("\n❌ Error:", error.message);
    }
}

main()
    .then(() => {
        console.log("\n✅ Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });