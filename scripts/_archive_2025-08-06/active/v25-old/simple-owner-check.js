const ethers = require('ethers');
require('dotenv').config();

async function main() {
  // 使用公共 RPC
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
  
  // DungeonMaster 地址
  const dungeonMasterAddress = "0x9ccF46E49DdA7D2DF7cE8064FB879D786D8b12D0";
  
  // 簡單 ABI
  const abi = [
    "function owner() view returns (address)",
    "function explorationFee() view returns (uint256)"
  ];
  
  const contract = new ethers.Contract(dungeonMasterAddress, abi, provider);
  
  try {
    const owner = await contract.owner();
    const fee = await contract.explorationFee();
    
    console.log("=== DungeonMaster 合約資訊 ===");
    console.log("合約地址:", dungeonMasterAddress);
    console.log("合約 Owner:", owner);
    console.log("當前探索費:", ethers.formatEther(fee), "BNB");
    
    // 檢查是否為您的地址
    const yourAddress = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
    console.log("\n您的地址:", yourAddress);
    console.log("是 Owner 嗎?", owner.toLowerCase() === yourAddress.toLowerCase());
    
    // 可能的 Owner 地址
    console.log("\n可能的情況:");
    if (owner === "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9") {
      console.log("Owner 是 DungeonCore 合約!");
      console.log("需要通過 DungeonCore 執行操作");
    }
    
  } catch (error) {
    console.error("錯誤:", error.message);
  }
}

main();