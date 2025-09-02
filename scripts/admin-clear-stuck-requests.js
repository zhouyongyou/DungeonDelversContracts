// Admin script to clear stuck VRF requests
// This is a temporary solution until contract upgrade

const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 Admin Clear Stuck VRF Requests");
  console.log("=" .repeat(60));
  
  // Contract addresses
  const HERO_ADDRESS = process.env.VITE_HERO_ADDRESS || "0x428486A4860E54e5ACAFEfdD07FF8E23E18877Cc";
  const RELIC_ADDRESS = process.env.VITE_RELIC_ADDRESS || "0xbA7e324c92F81C42E9F639602B1766765E93002d";
  
  // Users to clear (can be passed as arguments or hardcoded)
  const stuckUsers = process.argv.slice(2);
  
  if (stuckUsers.length === 0) {
    console.log("Usage: npx hardhat run scripts/admin-clear-stuck-requests.js --network bsc 0xUSER1 0xUSER2");
    console.log("\n❓ 或者手動輸入要清除的用戶地址（以逗號分隔）：");
    return;
  }
  
  const [signer] = await ethers.getSigners();
  console.log("Admin wallet:", signer.address);
  
  // Hero contract ABI (only needed functions)
  const contractABI = [
    "function owner() view returns (address)",
    "function userRequests(address) view returns (uint256 quantity, uint256 payment, bool fulfilled, uint8 maxRarity, bool fromVault, uint256[] pendingTokenIds, uint256 requestId)",
    "function emergencyResetUserRequest(address user) external", // 🎯 現有功能
    "function pause() external",
    "function unpause() external",
    "function paused() view returns (bool)"
  ];
  
  // Connect to Hero contract
  const heroContract = new ethers.Contract(HERO_ADDRESS, contractABI, signer);
  
  // Check if signer is owner
  const owner = await heroContract.owner();
  if (owner.toLowerCase() !== signer.address.toLowerCase()) {
    console.error("❌ Error: Signer is not the contract owner");
    console.log("Contract owner:", owner);
    console.log("Your address:", signer.address);
    return;
  }
  
  console.log("✅ Verified: You are the contract owner\n");
  
  // Check each stuck user
  for (const userAddress of stuckUsers) {
    console.log(`\n📍 Checking user: ${userAddress}`);
    
    try {
      // Get user request data
      const request = await heroContract.userRequests(userAddress);
      
      if (request.quantity > 0 && !request.fulfilled) {
        console.log("  ⚠️ Found stuck request:");
        console.log(`    - Quantity: ${request.quantity}`);
        console.log(`    - Request ID: ${request.requestId}`);
        console.log(`    - Pending tokens: ${request.pendingTokenIds.length} NFTs`);
        
        // Use existing emergencyResetUserRequest function
        try {
          console.log("  🔧 Using emergencyResetUserRequest...");
          const tx = await heroContract.emergencyResetUserRequest(userAddress);
          console.log(`  📤 Transaction sent: ${tx.hash}`);
          await tx.wait();
          console.log("  ✅ Hero request cleared successfully!");
        } catch (error) {
          console.log("  ❌ emergencyResetUserRequest failed:", error.message);
          console.log("  💡 Possible causes: Not owner, no pending request, or gas issues");
        }
      } else if (request.fulfilled) {
        console.log("  ✅ Request already fulfilled");
      } else {
        console.log("  ℹ️ No pending request found");
      }
      
    } catch (error) {
      console.error(`  ❌ Error checking user: ${error.message}`);
    }
  }
  
  // Check Relic contract too
  console.log("\n" + "=".repeat(60));
  console.log("📍 Checking Relic contract...\n");
  
  const relicContract = new ethers.Contract(RELIC_ADDRESS, contractABI, signer);
  
  for (const userAddress of stuckUsers) {
    console.log(`📍 Checking user in Relic: ${userAddress}`);
    
    try {
      const request = await relicContract.userRequests(userAddress);
      
      if (request.quantity > 0 && !request.fulfilled) {
        console.log("  ⚠️ Found stuck request in Relic:");
        console.log(`    - Quantity: ${request.quantity}`);
        console.log(`    - Request ID: ${request.requestId}`);
        console.log("  ❌ Relic 合約沒有 emergencyResetUserRequest 功能");
        console.log("  💡 需要部署升級版 Relic 合約或等待 VRF 成功");
      } else {
        console.log("  ✅ No stuck request in Relic");
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error.message}`);
    }
  }
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 Summary:");
  console.log("If forceResetRequest doesn't exist, you need to:");
  console.log("1. Deploy upgraded contracts with cancel mechanism");
  console.log("2. Or wait for VRF to eventually succeed");
  console.log("3. Or manually send successful VRF callback (risky)");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });