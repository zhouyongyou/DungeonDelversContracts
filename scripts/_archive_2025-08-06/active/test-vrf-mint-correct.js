// test-vrf-mint-correct.js - Test VRF minting with correct function (mintFromWallet)
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🧪 Testing VRF Mint with mintFromWallet...\n");
    console.log("=" .repeat(60));

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Tester Address:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("BNB Balance:", ethers.formatEther(balance), "BNB\n");

    // Contract addresses
    const HERO_ADDRESS = '0xD48867dbac5f1c1351421726B6544f847D9486af';
    const VRF_MANAGER_V2PLUS = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';

    // Hero ABI with correct function
    const heroABI = [
        'function mintFromWallet(uint256 quantity) external payable',
        'function vrfManager() external view returns (address)',
        'function platformFee() external view returns (uint256)',
        'function vrfRequestPrice() external view returns (uint256)',
        'function paused() external view returns (bool)',
        'event VRFMintRequested(address indexed user, uint256 indexed requestId, uint256 quantity)',
        'event MintCommitted(address indexed user, bytes32 commitment, uint256 quantity)',
        'event Minted(address indexed to, uint256[] tokenIds, uint8[] rarities)'
    ];

    const vrfManagerABI = [
        'function getTotalFee() external view returns (uint256)',
        'function getVrfRequestPrice() external view returns (uint256)',
        'function platformFee() external view returns (uint256)',
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
        console.log("Hero Authorized:", isAuthorized ? "✅" : "❌");
        
        // Get fees from both contracts
        console.log("\n💰 Fee Information");
        console.log("=" .repeat(60));
        
        // From VRF Manager
        const vrfPrice = await vrfManager.getVrfRequestPrice();
        const platformFeeVrf = await vrfManager.platformFee();
        const totalFeeVrf = await vrfManager.getTotalFee();
        
        console.log("From VRF Manager:");
        console.log("  VRF Price:", ethers.formatEther(vrfPrice), "BNB");
        console.log("  Platform Fee:", ethers.formatEther(platformFeeVrf), "BNB");
        console.log("  Total Fee:", ethers.formatEther(totalFeeVrf), "BNB");
        
        // From Hero contract
        try {
            const heroPlatformFee = await hero.platformFee();
            const heroVrfPrice = await hero.vrfRequestPrice();
            console.log("\nFrom Hero Contract:");
            console.log("  Platform Fee:", ethers.formatEther(heroPlatformFee), "BNB");
            console.log("  VRF Price:", ethers.formatEther(heroVrfPrice), "BNB");
            console.log("  Total:", ethers.formatEther(heroPlatformFee + heroVrfPrice), "BNB");
        } catch (e) {
            console.log("\nHero contract fee methods not available");
        }
        
        // Calculate mint cost
        const quantity = 1;
        const mintCost = totalFeeVrf * BigInt(quantity);
        
        console.log("\n🎯 Mint Transaction Details");
        console.log("=" .repeat(60));
        console.log("Function: mintFromWallet");
        console.log("Quantity:", quantity);
        console.log("Value to Send:", ethers.formatEther(mintCost), "BNB");
        
        // Check balance
        if (balance < mintCost) {
            console.log("\n❌ Insufficient BNB balance");
            console.log("   Required:", ethers.formatEther(mintCost), "BNB");
            console.log("   Available:", ethers.formatEther(balance), "BNB");
            return;
        }

        // Send transaction
        console.log("\n🚀 Sending Mint Transaction...");
        console.log("=" .repeat(60));
        
        // Set up event listeners
        let requestId;
        hero.once("VRFMintRequested", (user, reqId, qty) => {
            console.log("\n📡 VRF Mint Requested Event!");
            console.log("   User:", user);
            console.log("   Request ID:", reqId.toString());
            console.log("   Quantity:", qty.toString());
            requestId = reqId;
        });
        
        hero.once("MintCommitted", (user, commitment, qty) => {
            console.log("\n📡 Mint Committed Event!");
            console.log("   User:", user);
            console.log("   Commitment:", commitment);
            console.log("   Quantity:", qty.toString());
        });
        
        console.log("Calling mintFromWallet(" + quantity + ") with value: " + ethers.formatEther(mintCost) + " BNB");
        
        const tx = await hero.mintFromWallet(quantity, {
            value: mintCost,
            gasLimit: 500000
        });
        
        console.log("\n✅ Transaction Sent!");
        console.log("Hash:", tx.hash);
        console.log("\n📝 BSCScan Link:");
        console.log(`https://bscscan.com/tx/${tx.hash}`);
        
        console.log("\nWaiting for confirmation...");
        const receipt = await tx.wait();
        
        if (receipt.status === 1) {
            console.log("\n✅ Transaction Successful!");
            console.log("Block Number:", receipt.blockNumber);
            console.log("Gas Used:", receipt.gasUsed.toString());
            
            // Parse events
            console.log("\n📋 Transaction Events:");
            console.log("Total Events:", receipt.logs.length);
            
            // Wait a bit for events to be processed
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Check VRF status
            console.log("\n🔍 Checking VRF Status...");
            const [fulfilled, randomWords] = await vrfManager.getRandomForUser(wallet.address);
            console.log("VRF Fulfilled:", fulfilled ? "✅" : "⏳ Pending");
            if (fulfilled) {
                console.log("Random Words:", randomWords.map(w => w.toString()));
            }
            
            // Monitor for VRF fulfillment
            if (!fulfilled) {
                console.log("\n⏳ Monitoring for VRF Fulfillment...");
                console.log("Waiting up to 30 seconds for Chainlink VRF...\n");
                
                for (let i = 0; i < 10; i++) {
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    
                    const [isFulfilled, words] = await vrfManager.getRandomForUser(wallet.address);
                    
                    if (isFulfilled) {
                        console.log("\n✅ VRF Request Fulfilled!");
                        console.log("Random Words:", words.map(w => w.toString()));
                        console.log("\n🎉 NFTs should be minted! Check your balance.");
                        break;
                    } else {
                        console.log(`Attempt ${i + 1}/10: VRF still pending...`);
                    }
                }
            }
            
            console.log("\n" + "=" .repeat(60));
            console.log("📋 Summary");
            console.log("=" .repeat(60));
            console.log("✅ Mint transaction successful!");
            console.log("✅ VRF request submitted to Chainlink");
            console.log("⏳ NFTs will be minted once VRF returns random numbers");
            console.log("\nYou can monitor the transaction on BSCScan");
            console.log("or check back later to see if NFTs were minted.");
            
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
        }
        
        if (error.transaction) {
            console.error("\nTransaction Details:");
            console.error("  To:", error.transaction.to);
            console.error("  Value:", ethers.formatEther(error.transaction.value || 0), "BNB");
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