// test-mint-with-correct-data.js - Test VRF minting with correct function call
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🧪 Testing VRF Mint with Correct Function Call...\n");
    console.log("=" .repeat(60));

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Tester Address:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("BNB Balance:", ethers.formatEther(balance), "BNB\n");

    // Contract addresses
    const HERO_ADDRESS = '0xD48867dbac5f1c1351421726B6544f847D9486af';
    const VRF_MANAGER_V2PLUS = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';

    // Full Hero ABI with mintWithVRF function
    const heroABI = [
        {
            "inputs": [{"internalType": "uint256", "name": "quantity", "type": "uint256"}],
            "name": "mintWithVRF",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "vrfManager",
            "outputs": [{"internalType": "address", "name": "", "type": "address"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "paused",
            "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "anonymous": false,
            "inputs": [
                {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
                {"indexed": true, "internalType": "uint256", "name": "requestId", "type": "uint256"},
                {"indexed": false, "internalType": "uint256", "name": "quantity", "type": "uint256"}
            ],
            "name": "VRFMintRequested",
            "type": "event"
        }
    ];

    const vrfManagerABI = [
        'function getTotalFee() external view returns (uint256)',
        'function isAuthorized(address) external view returns (bool)',
        'function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] randomWords)'
    ];

    try {
        const hero = new ethers.Contract(HERO_ADDRESS, heroABI, wallet);
        const vrfManager = new ethers.Contract(VRF_MANAGER_V2PLUS, vrfManagerABI, provider);

        // Check configuration
        console.log("📋 Pre-Flight Checks");
        console.log("=" .repeat(60));
        
        const paused = await hero.paused();
        console.log("Contract Paused:", paused ? "⏸️ YES" : "▶️ NO");
        
        if (paused) {
            console.log("❌ Contract is paused! Cannot mint.");
            return;
        }
        
        const heroVrfManager = await hero.vrfManager();
        console.log("VRF Manager:", heroVrfManager);
        console.log("Expected:", VRF_MANAGER_V2PLUS);
        console.log("Match:", heroVrfManager.toLowerCase() === VRF_MANAGER_V2PLUS.toLowerCase() ? "✅" : "❌");
        
        const isAuthorized = await vrfManager.isAuthorized(HERO_ADDRESS);
        console.log("Hero Authorized in VRF:", isAuthorized ? "✅" : "❌");
        
        const totalFee = await vrfManager.getTotalFee();
        console.log("Fee per NFT:", ethers.formatEther(totalFee), "BNB");
        
        // Prepare mint
        const quantity = 1;
        const mintCost = totalFee * BigInt(quantity);
        
        console.log("\n🎯 Mint Transaction Details");
        console.log("=" .repeat(60));
        console.log("Function: mintWithVRF");
        console.log("Quantity:", quantity);
        console.log("Value to Send:", ethers.formatEther(mintCost), "BNB");
        console.log("Gas Limit:", "500000");
        
        // Check balance
        if (balance < mintCost) {
            console.log("\n❌ Insufficient BNB balance");
            console.log("   Required:", ethers.formatEther(mintCost), "BNB");
            console.log("   Available:", ethers.formatEther(balance), "BNB");
            return;
        }

        // Encode function call
        const mintData = hero.interface.encodeFunctionData("mintWithVRF", [quantity]);
        console.log("\nEncoded Data:", mintData);
        console.log("Function Selector:", mintData.slice(0, 10));

        // Send transaction
        console.log("\n🚀 Sending Mint Transaction...");
        console.log("=" .repeat(60));
        
        const tx = await wallet.sendTransaction({
            to: HERO_ADDRESS,
            data: mintData,
            value: mintCost,
            gasLimit: 500000
        });
        
        console.log("✅ Transaction Sent!");
        console.log("Hash:", tx.hash);
        console.log("\n📝 BSCScan Link:");
        console.log(`https://bscscan.com/tx/${tx.hash}`);
        
        console.log("\nWaiting for confirmation...");
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("\n✅ Transaction Successful!");
            console.log("Block Number:", receipt.blockNumber);
            console.log("Gas Used:", receipt.gasUsed.toString());
            
            // Check for events
            console.log("\n📋 Transaction Events:");
            console.log("Events Count:", receipt.logs.length);
            
            if (receipt.logs.length > 0) {
                for (const log of receipt.logs) {
                    console.log("\nLog:");
                    console.log("  Address:", log.address);
                    console.log("  Topics:", log.topics);
                }
            }
            
            // Check VRF status
            console.log("\n🔍 Checking VRF Status...");
            const [fulfilled, randomWords] = await vrfManager.getRandomForUser(wallet.address);
            console.log("VRF Fulfilled:", fulfilled ? "✅" : "⏳ Pending");
            if (fulfilled) {
                console.log("Random Words:", randomWords.map(w => w.toString()));
            }
            
        } else {
            console.log("\n❌ Transaction Failed!");
            console.log("Status:", receipt.status);
        }

    } catch (error) {
        console.error("\n❌ Error:", error.message);
        
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
        
        if (error.data) {
            console.error("Error Data:", error.data);
            
            // Try to decode error
            try {
                const errorInterface = new ethers.Interface([
                    'error Paused()',
                    'error InsufficientFee(uint256 required, uint256 provided)',
                    'error MaxSupplyReached()',
                    'error ExceedsMaxPerTx()',
                    'error InvalidQuantity()'
                ]);
                
                const decoded = errorInterface.parseError(error.data);
                if (decoded) {
                    console.error("Decoded Error:", decoded.name);
                    if (decoded.args) {
                        console.error("Error Args:", decoded.args);
                    }
                }
            } catch (e) {
                // Could not decode
            }
        }
        
        if (error.transaction) {
            console.error("\nTransaction Details:");
            console.error("  To:", error.transaction.to);
            console.error("  Value:", ethers.formatEther(error.transaction.value || 0), "BNB");
            console.error("  Data:", error.transaction.data);
        }
        
        throw error;
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