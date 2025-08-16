// test-vrf-minting.js - Test VRF minting functionality with VRFManagerV2Plus
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🧪 Testing VRF Minting with VRFManagerV2Plus...\n");
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
        'function platformFee() external view returns (uint256)',
        'function vrfRequestPrice() external view returns (uint256)',
        'function vrfManager() external view returns (address)',
        'function totalSupply() external view returns (uint256)',
        'function balanceOf(address owner) external view returns (uint256)',
        'event VRFMintRequested(address indexed user, uint256 indexed requestId, uint256 quantity)',
        'event Minted(address indexed to, uint256[] tokenIds, uint8[] rarities)'
    ];

    const vrfManagerABI = [
        'function getVrfRequestPrice() external view returns (uint256)',
        'function platformFee() external view returns (uint256)',
        'function getTotalFee() external view returns (uint256)',
        'function isAuthorized(address) external view returns (bool)',
        'function requests(uint256) external view returns (tuple(address requester, uint8 requestType, bytes data, bool fulfilled, uint256[] randomWords))',
        'function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] randomWords)'
    ];

    try {
        const hero = new ethers.Contract(HERO_ADDRESS, heroABI, wallet);
        const vrfManager = new ethers.Contract(VRF_MANAGER_V2PLUS, vrfManagerABI, provider);

        // Check configuration
        console.log("📋 Configuration Check");
        console.log("=" .repeat(60));
        
        // Check Hero contract VRF Manager
        const heroVrfManager = await hero.vrfManager();
        console.log("Hero Contract VRF Manager:", heroVrfManager);
        console.log("Expected VRF Manager:", VRF_MANAGER_V2PLUS);
        console.log("VRF Manager Match:", heroVrfManager.toLowerCase() === VRF_MANAGER_V2PLUS.toLowerCase() ? "✅" : "❌");
        
        // Check authorization
        const isAuthorized = await vrfManager.isAuthorized(HERO_ADDRESS);
        console.log("Hero Contract Authorized:", isAuthorized ? "✅" : "❌");
        
        // Check fees
        console.log("\n💰 Fee Information");
        console.log("=" .repeat(60));
        
        const vrfPrice = await vrfManager.getVrfRequestPrice();
        console.log("VRF Request Price:", ethers.formatEther(vrfPrice), "BNB");
        
        const platformFee = await vrfManager.platformFee();
        console.log("Platform Fee:", ethers.formatEther(platformFee), "BNB");
        
        const totalFee = await vrfManager.getTotalFee();
        console.log("Total Fee per Mint:", ethers.formatEther(totalFee), "BNB");
        
        // Get current supply
        const totalSupplyBefore = await hero.totalSupply();
        const userBalanceBefore = await hero.balanceOf(wallet.address);
        console.log("\n📊 Current State");
        console.log("=" .repeat(60));
        console.log("Total Supply:", totalSupplyBefore.toString());
        console.log("User Balance:", userBalanceBefore.toString());
        
        // Calculate mint cost
        const quantity = 1;
        const mintCost = totalFee * BigInt(quantity);
        console.log("\n🎯 Minting Parameters");
        console.log("=" .repeat(60));
        console.log("Quantity to Mint:", quantity);
        console.log("Total Cost:", ethers.formatEther(mintCost), "BNB");
        
        // Check if user has enough BNB
        if (balance < mintCost) {
            console.log("❌ Insufficient BNB balance for minting");
            console.log("   Required:", ethers.formatEther(mintCost), "BNB");
            console.log("   Available:", ethers.formatEther(balance), "BNB");
            return;
        }

        // Perform mint
        console.log("\n🚀 Initiating VRF Mint...");
        console.log("=" .repeat(60));
        
        // Set up event listeners
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
        
        // Wait for request event
        await requestPromise;
        
        // Check request status
        console.log("\n🔍 Checking VRF Request Status...");
        console.log("=" .repeat(60));
        
        if (requestId) {
            const request = await vrfManager.requests(requestId);
            console.log("Request Details:");
            console.log("   Requester:", request.requester);
            console.log("   Request Type:", request.requestType);
            console.log("   Fulfilled:", request.fulfilled);
            
            // Check user's random status
            const [fulfilled, randomWords] = await vrfManager.getRandomForUser(wallet.address);
            console.log("\nUser Random Status:");
            console.log("   Fulfilled:", fulfilled);
            console.log("   Random Words:", randomWords.length > 0 ? randomWords.map(w => w.toString()) : "Pending...");
        }
        
        // Monitor for fulfillment
        console.log("\n⏳ Monitoring for VRF Fulfillment...");
        console.log("=" .repeat(60));
        console.log("Waiting up to 60 seconds for Chainlink VRF callback...\n");
        
        let fulfilled = false;
        let attempts = 0;
        const maxAttempts = 20; // 60 seconds / 3 seconds per attempt
        
        while (!fulfilled && attempts < maxAttempts) {
            attempts++;
            console.log(`Attempt ${attempts}/${maxAttempts}...`);
            
            // Check if request is fulfilled
            const [userFulfilled, userRandomWords] = await vrfManager.getRandomForUser(wallet.address);
            
            if (userFulfilled) {
                fulfilled = true;
                console.log("\n✅ VRF Request Fulfilled!");
                console.log("Random Words:", userRandomWords.map(w => w.toString()));
                
                // Check if NFTs were minted
                const totalSupplyAfter = await hero.totalSupply();
                const userBalanceAfter = await hero.balanceOf(wallet.address);
                
                console.log("\n📊 Final State");
                console.log("=" .repeat(60));
                console.log("Total Supply Before:", totalSupplyBefore.toString());
                console.log("Total Supply After:", totalSupplyAfter.toString());
                console.log("User Balance Before:", userBalanceBefore.toString());
                console.log("User Balance After:", userBalanceAfter.toString());
                console.log("NFTs Minted:", (userBalanceAfter - userBalanceBefore).toString());
                
                if (userBalanceAfter > userBalanceBefore) {
                    console.log("\n🎉 SUCCESS! NFTs were minted successfully!");
                } else {
                    console.log("\n⚠️ VRF fulfilled but NFTs not minted yet. May need manual reveal.");
                }
                
                break;
            }
            
            // Wait 3 seconds before next check
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
        if (!fulfilled) {
            console.log("\n⏱️ VRF request not fulfilled within 60 seconds.");
            console.log("This is normal - Chainlink VRF may take a few minutes.");
            console.log("You can check the status later or monitor on BSCScan.");
            
            if (requestId) {
                console.log("\n📝 Request Details for Manual Check:");
                console.log("Request ID:", requestId.toString());
                console.log("VRF Manager:", VRF_MANAGER_V2PLUS);
                console.log("Hero Contract:", HERO_ADDRESS);
            }
        }
        
        // Summary
        console.log("\n" + "=" .repeat(60));
        console.log("📋 Test Summary");
        console.log("=" .repeat(60));
        console.log("Test Type: VRF Minting with VRFManagerV2Plus");
        console.log("Contract: Hero NFT");
        console.log("VRF Manager: VRFManagerV2Plus");
        console.log("Transaction Status: ✅ Confirmed");
        console.log("VRF Request Status:", fulfilled ? "✅ Fulfilled" : "⏳ Pending");
        console.log("NFT Minting Status:", fulfilled ? "✅ Complete" : "⏳ Awaiting VRF");
        console.log("=" .repeat(60));

    } catch (error) {
        console.error("\n❌ Test Failed:", error.message);
        
        if (error.data) {
            console.error("Error Data:", error.data);
        }
        
        if (error.transaction) {
            console.error("\nFailed Transaction:");
            console.error("  To:", error.transaction.to);
            console.error("  Value:", ethers.formatEther(error.transaction.value || 0), "BNB");
            console.error("  Data:", error.transaction.data?.slice(0, 10) + "...");
        }
        
        throw error;
    }
}

main()
    .then(() => {
        console.log("\n✅ VRF Minting Test Complete!");
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });