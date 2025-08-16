// simulate-mint-call.js - Simulate the mint call to get error reason
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔍 Simulating mintFromWallet call...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    const HERO_ADDRESS = '0xD48867dbac5f1c1351421726B6544f847D9486af';
    const VRF_MANAGER_V2PLUS = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';

    const heroABI = [
        'function mintFromWallet(uint256 quantity) external payable',
        'function platformFee() external view returns (uint256)',
        'function vrfRequestPrice() external view returns (uint256)',
        'function paused() external view returns (bool)'
    ];

    const vrfManagerABI = [
        'function getTotalFee() external view returns (uint256)'
    ];

    try {
        const hero = new ethers.Contract(HERO_ADDRESS, heroABI, wallet);
        const vrfManager = new ethers.Contract(VRF_MANAGER_V2PLUS, vrfManagerABI, provider);
        
        const totalFee = await vrfManager.getTotalFee();
        const quantity = 1;
        const mintCost = totalFee * BigInt(quantity);
        
        console.log("Simulating mintFromWallet call:");
        console.log("  Quantity:", quantity);
        console.log("  Value:", ethers.formatEther(mintCost), "BNB");
        console.log("  From:", wallet.address);
        console.log("  To:", HERO_ADDRESS);
        
        // Try to simulate the call
        console.log("\n🧪 Simulating transaction...");
        
        try {
            // Use staticCall to simulate without sending
            const result = await hero.mintFromWallet.staticCall(quantity, {
                value: mintCost,
                from: wallet.address
            });
            console.log("✅ Simulation successful!");
            console.log("Result:", result);
        } catch (simError) {
            console.log("\n❌ Simulation failed!");
            console.log("Error:", simError.message);
            
            // Try to extract error reason
            if (simError.data) {
                console.log("\nError data:", simError.data);
                
                // Try to decode common errors
                const errorSignatures = {
                    '0x64a0ae92': 'InsufficientFee',
                    '0x30cd7471': 'Paused',
                    '0xd05cb609': 'MaxSupplyReached',
                    '0x2c5211c6': 'InvalidQuantity',
                    '0x2022603e': 'ExceedsMaxPerTx',
                    '0x08c379a0': 'Error(string)'
                };
                
                const selector = simError.data.slice(0, 10);
                console.log("Error selector:", selector);
                
                if (errorSignatures[selector]) {
                    console.log("Error type:", errorSignatures[selector]);
                }
                
                // If it's a string error, try to decode it
                if (selector === '0x08c379a0') {
                    try {
                        const abiCoder = ethers.AbiCoder.defaultAbiCoder();
                        const decoded = abiCoder.decode(['string'], '0x' + simError.data.slice(10));
                        console.log("Error message:", decoded[0]);
                    } catch (e) {
                        console.log("Could not decode error message");
                    }
                }
            }
            
            // Also check if it's a fee issue
            console.log("\n📊 Fee Check:");
            try {
                const heroPlatformFee = await hero.platformFee();
                const heroVrfPrice = await hero.vrfRequestPrice();
                const heroTotalFee = heroPlatformFee + heroVrfPrice;
                
                console.log("Hero expects:");
                console.log("  Platform Fee:", ethers.formatEther(heroPlatformFee), "BNB");
                console.log("  VRF Price:", ethers.formatEther(heroVrfPrice), "BNB");
                console.log("  Total:", ethers.formatEther(heroTotalFee), "BNB");
                
                console.log("\nWe're sending:", ethers.formatEther(mintCost), "BNB");
                
                if (mintCost < heroTotalFee) {
                    console.log("⚠️ We're sending less than Hero expects!");
                    console.log("  Difference:", ethers.formatEther(heroTotalFee - mintCost), "BNB");
                }
            } catch (e) {
                console.log("Could not check Hero's fee expectations");
            }
        }
        
    } catch (error) {
        console.error("\n❌ Script Error:", error.message);
    }
}

main()
    .then(() => {
        console.log("\n✅ Simulation Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });