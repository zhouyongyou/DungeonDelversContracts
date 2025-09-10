const { ethers } = require("hardhat");

async function testRewardCalculation() {
  console.log("🧪 Testing Expedition Reward Calculation...");
  
  try {
    // Get contract addresses
    const DUNGEON_STORAGE = process.env.VITE_DUNGEONSTORAGE_ADDRESS;
    const ORACLE = process.env.VITE_ORACLE_ADDRESS;
    
    console.log("📍 DungeonStorage:", DUNGEON_STORAGE);
    console.log("📍 Oracle:", ORACLE);
    
    // Get contracts
    const DungeonStorage = await ethers.getContractAt("DungeonStorage", DUNGEON_STORAGE);
    const Oracle = await ethers.getContractAt("Oracle", ORACLE);
    
    // Test different dungeon types
    console.log("\n🏰 Testing Reward Calculations:");
    
    for (let dungeonId = 1; dungeonId <= 3; dungeonId++) {
      console.log(`\n--- Dungeon ${dungeonId} ---`);
      
      // Get dungeon config
      const config = await DungeonStorage.dungeons(dungeonId);
      console.log(`⚡ Required Power: ${config.requiredPower}`);
      console.log(`💰 Reward Amount USD: ${ethers.formatEther(config.rewardAmountUSD)} USD`);
      console.log(`🎯 Success Rate: ${config.baseSuccessRate}%`);
      
      // Get USD to SOUL conversion
      try {
        const soulAmount = await Oracle.convertUSDToSOUL(config.rewardAmountUSD);
        console.log(`🪙 SOUL Reward: ${ethers.formatEther(soulAmount)} SOUL`);
        
        // Check if the amount is reasonable (should be in millions for typical rewards)
        const soulInMillion = parseFloat(ethers.formatEther(soulAmount));
        if (soulInMillion > 1) {
          console.log(`✅ Reward amount looks correct: ${soulInMillion.toFixed(2)} SOUL`);
        } else if (soulInMillion > 0.001) {
          console.log(`⚠️  Small but non-zero reward: ${soulInMillion.toFixed(6)} SOUL`);
        } else {
          console.log(`❌ Reward too small: ${soulInMillion.toFixed(10)} SOUL - likely calculation error`);
        }
      } catch (error) {
        console.log(`❌ Oracle conversion failed:`, error.message);
      }
    }
    
    // Test specific reward amount that was problematic
    console.log("\n🔍 Testing Previous Problematic Amount (225599 wei):");
    const problemAmount = "225599";
    try {
      const soulFromProblem = await Oracle.convertUSDToSOUL(problemAmount);
      console.log(`💰 225599 wei converts to: ${ethers.formatEther(soulFromProblem)} SOUL`);
      console.log(`📊 In scientific notation: ${parseFloat(ethers.formatEther(soulFromProblem)).toExponential()} SOUL`);
    } catch (error) {
      console.log(`❌ Conversion failed:`, error.message);
    }
    
    // Test proper 18-decimal amount
    console.log("\n✅ Testing Proper 18-Decimal Amount ($12 = 12 * 1e18 wei):");
    const properAmount = ethers.parseEther("12"); // $12 in 18-decimal format
    try {
      const soulFromProper = await Oracle.convertUSDToSOUL(properAmount);
      console.log(`💰 12 USD (${properAmount} wei) converts to: ${ethers.formatEther(soulFromProper)} SOUL`);
      
      const soulInMillion = parseFloat(ethers.formatEther(soulFromProper));
      if (soulInMillion > 1) {
        console.log(`🎉 SUCCESS! Reward is now reasonable: ${soulInMillion.toFixed(2)} SOUL`);
      }
    } catch (error) {
      console.log(`❌ Conversion failed:`, error.message);
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testRewardCalculation()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test error:", error);
    process.exit(1);
  });