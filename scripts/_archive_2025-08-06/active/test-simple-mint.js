// test-simple-mint.js - Test VRF minting without checking totalSupply
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🧪 Testing VRF Mint (Simple Version)...\n");
    console.log("=" .repeat(60));

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("Tester Address:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("BNB Balance:", ethers.formatEther(balance), "BNB\n");

    // Contract addresses
    const HERO_ADDRESS = '0xD48867dbac5f1c1351421726B6544f847D9486af';
    const VRF_MANAGER_V2PLUS = '0xFac10cd51981ED3aE85a05c5CFF6ab5b8e145038';

    // ABIs
    const heroABI = [
        'function mintWithVRF(uint256 quantity) external payable',
        'function vrfManager() external view returns (address)',
        'function paused() external view returns (bool)',
        'event VRFMintRequested(address indexed user, uint256 indexed requestId, uint256 quantity)',
        'event Minted(address indexed to, uint256[] tokenIds, uint8[] rarities)'
    ];

    const vrfManagerABI = [
        'function getTotalFee() external view returns (uint256)',
        'function isAuthorized(address) external view returns (bool)',
        'function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] randomWords)'
    ];

    try {
        const hero = new ethers.Contract(HERO_ADDRESS, heroABI, wallet);
        const vrfManager = new ethers.Contract(VRF_MANAGER_V2PLUS, vrfManagerABI, provider);

        // Check basic configuration
        console.log("📋 Configuration Check");
        console.log("=" .repeat(60));
        
        const paused = await hero.paused();
        console.log("Contract Paused:", paused ? "⏸️ YES" : "▶️ NO");
        
        if (paused) {
            console.log("❌ Contract is paused! Cannot mint.");
            return;
        }
        
        const heroVrfManager = await hero.vrfManager();
        console.log("VRF Manager Set:", heroVrfManager === VRF_MANAGER_V2PLUS ? "✅" : "❌");
        
        const isAuthorized = await vrfManager.isAuthorized(HERO_ADDRESS);
        console.log("Hero Authorized:", isAuthorized ? "✅" : "❌");
        
        const totalFee = await vrfManager.getTotalFee();
        console.log("Total Fee per Mint:", ethers.formatEther(totalFee), "BNB");
        
        // Calculate mint cost
        const quantity = 1;
        const mintCost = totalFee * BigInt(quantity);
        
        console.log("\n🎯 Minting Parameters");
        console.log("=" .repeat(60));
        console.log("Quantity to Mint:", quantity);
        console.log("Total Cost:", ethers.formatEther(mintCost), "BNB");
        
        // Check if user has enough BNB
        if (balance < mintCost) {
            console.log("❌ Insufficient BNB balance");
            return;
        }

        // Perform mint
        console.log("\n🚀 Initiating VRF Mint...");
        console.log("=" .repeat(60));
        
        // Set up event listener
        let requestId;
        const requestPromise = new Promise((resolve) => {
            hero.once("VRFMintRequested", (user, reqId, qty) => {
                console.log("✅ VRF Mint Requested!");
                console.log("   User:", user);
                console.log("   Request ID:", reqId.toString());
                console.log("   Quantity:", qty.toString());
                requestId = reqId;
                resolve(reqId);
            });
        });

        // Send mint transaction
        console.log("Sending transaction...");
        const tx = await hero.mintWithVRF(quantity, {
            value: mintCost,
            gasLimit: 500000
        });
        
        console.log("Transaction Hash:", tx.hash);
        console.log("Waiting for confirmation...");
        
        const receipt = await tx.wait();
        console.log("✅ Transaction Confirmed!");
        console.log("   Block Number:", receipt.blockNumber);
        console.log("   Gas Used:", receipt.gasUsed.toString());
        console.log("\n📝 BSCScan Link:");
        console.log(`https://bscscan.com/tx/${tx.hash}`);
        
        // Wait for request event with timeout
        console.log("\n⏳ Waiting for VRF request event...");
        const eventTimeout = new Promise((_, reject) => 
            setTimeout(() => reject(new Error("Event timeout")), 10000)
        );
        
        try {
            await Promise.race([requestPromise, eventTimeout]);
        } catch (e) {
            console.log("⚠️ VRF request event not received within 10 seconds");
            console.log("   This may be normal - check transaction on BSCScan");
        }
        
        // Check VRF status
        if (requestId) {
            console.log("\n🔍 Monitoring VRF Status...");
            console.log("=" .repeat(60));
            
            for (let i = 0; i < 5; i++) {
                const [fulfilled, randomWords] = await vrfManager.getRandomForUser(wallet.address);
                
                if (fulfilled) {
                    console.log("✅ VRF Request Fulfilled!");
                    console.log("Random Words:", randomWords.map(w => w.toString()));
                    break;
                } else {
                    console.log(`Attempt ${i + 1}/5: VRF pending...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
        }
        
        console.log("\n" + "=" .repeat(60));
        console.log("🎉 Mint Transaction Successful!");
        console.log("=" .repeat(60));
        console.log("Monitor the transaction on BSCScan for VRF fulfillment.");
        console.log("NFTs will be minted once Chainlink VRF returns the random numbers.");

    } catch (error) {
        console.error("\n❌ Mint Failed:", error.message);
        
        // Try to decode the error
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
        
        if (error.transaction) {
            console.error("\nFailed Transaction:");
            console.error("  To:", error.transaction.to);
            console.error("  Value:", ethers.formatEther(error.transaction.value || 0), "BNB");
            console.error("  Function:", error.transaction.data?.slice(0, 10));
        }
        
        throw error;
    }
}

main()
    .then(() => {
        console.log("\n✅ Test Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });