const { ethers } = require("ethers");

async function testRewardSimple() {
  console.log("🧪 Simple Reward Test - Direct Web3 Calls");
  
  // Setup provider
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  
  // Contract addresses
  const DUNGEON_STORAGE = "0x063a9de0dac8b68c03c9d77f41fe8b20a2fe7683";
  const ORACLE = "0x21928de992cb31ede864b62bc94002fb449c2738";
  
  console.log("📍 DungeonStorage:", DUNGEON_STORAGE);
  console.log("📍 Oracle:", ORACLE);
  
  try {
    // Test 1: Check if contracts exist and have bytecode
    console.log("\n🔍 Contract Existence Check:");
    
    const storageCode = await provider.getCode(DUNGEON_STORAGE);
    const oracleCode = await provider.getCode(ORACLE);
    
    console.log(`📦 DungeonStorage bytecode length: ${storageCode.length} chars`);
    console.log(`📦 Oracle bytecode length: ${oracleCode.length} chars`);
    
    if (storageCode === "0x" || oracleCode === "0x") {
      throw new Error("One or more contracts not deployed");
    }
    
    // Test 2: Direct call to dungeons mapping using manual encoding
    console.log("\n🏰 Testing Dungeon Configs (Manual Call):");
    
    // dungeons(uint256) function selector: 0x1a6bbf82
    for (let dungeonId = 1; dungeonId <= 3; dungeonId++) {
      try {
        const selector = "0x1a6bbf82"; // keccak256("dungeons(uint256)").substring(0, 10)
        const paddedId = dungeonId.toString(16).padStart(64, '0');
        const callData = selector + paddedId;
        
        console.log(`\n--- Dungeon ${dungeonId} ---`);
        console.log(`🔧 Call data: ${callData}`);
        
        const result = await provider.call({
          to: DUNGEON_STORAGE,
          data: callData
        });
        
        console.log(`📥 Raw result: ${result}`);
        
        if (result !== "0x" && result.length >= 258) { // Should have 4 values (32 bytes each)
          // Parse the result manually
          // requiredPower (32 bytes), rewardAmountUSD (32 bytes), baseSuccessRate (32 bytes), isInitialized (32 bytes)
          
          const requiredPower = BigInt("0x" + result.slice(2, 66));
          const rewardAmountUSD = BigInt("0x" + result.slice(66, 130));
          const baseSuccessRate = BigInt("0x" + result.slice(130, 194));
          const isInitialized = BigInt("0x" + result.slice(194, 258)) > 0n;
          
          console.log(`⚡ Required Power: ${requiredPower.toString()}`);
          console.log(`💰 Reward Amount USD (wei): ${rewardAmountUSD.toString()}`);
          console.log(`💰 Reward Amount USD (formatted): ${ethers.formatEther(rewardAmountUSD)} USD`);
          console.log(`🎯 Base Success Rate: ${baseSuccessRate.toString()}%`);
          console.log(`✅ Is Initialized: ${isInitialized}`);
          
          // Check if this looks like the fixed version (should be in 18-decimal format)
          const usdInEther = parseFloat(ethers.formatEther(rewardAmountUSD));
          if (usdInEther >= 10) {
            console.log(`🎉 LOOKS GOOD! Reward is ${usdInEther} USD - properly formatted in 18 decimals!`);
          } else if (usdInEther > 0) {
            console.log(`⚠️  Small reward: ${usdInEther} USD - might still be old format`);
          } else {
            console.log(`❌ Zero reward - something is wrong`);
          }
        } else {
          console.log(`❌ Invalid or empty result`);
        }
        
      } catch (error) {
        console.log(`❌ Failed to get dungeon ${dungeonId} config:`, error.message);
      }
    }
    
    // Test 3: Test the problematic amount from before
    console.log("\n🔍 Testing Previous Problematic Amount:");
    console.log(`💰 Old amount was 225599 wei`);
    console.log(`💰 That converts to: ${ethers.formatEther("225599")} USD`);
    console.log(`📊 In scientific notation: ${parseFloat(ethers.formatEther("225599")).toExponential()}`);
    
    console.log("\n✅ New proper 18-decimal amounts:");
    const amounts = [12, 35, 85]; // Expected USD amounts for dungeons 1, 2, 3
    amounts.forEach((amount, index) => {
      const properAmount = ethers.parseEther(amount.toString());
      console.log(`💰 Dungeon ${index + 1}: $${amount} = ${properAmount} wei = ${ethers.formatEther(properAmount)} USD`);
    });
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the test
testRewardSimple()
  .then(() => {
    console.log("\n🏁 Test completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Test error:", error);
    process.exit(1);
  });