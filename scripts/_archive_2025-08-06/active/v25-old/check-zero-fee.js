const ethers = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 測試設置 0 探索費 ===\n");
  
  const provider = new ethers.JsonRpcProvider(process.env.VITE_ALCHEMY_BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org/");
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const dungeonMasterAddress = "0x9ccF46E49DdA7D2DF7cE8064FB879D786D8b12D0";
  
  // 更完整的 ABI
  const abi = [
    "function owner() view returns (address)",
    "function explorationFee() view returns (uint256)",
    "function setExplorationFee(uint256 _newFee)",
    "function paused() view returns (bool)",
    "function provisionPriceUSD() view returns (uint256)",
    "function globalRewardMultiplier() view returns (uint256)"
  ];
  
  const contract = new ethers.Contract(dungeonMasterAddress, abi, wallet);
  
  try {
    const currentFee = await contract.explorationFee();
    console.log("當前探索費:", ethers.formatEther(currentFee), "BNB");
    
    // 嘗試設置為 0
    console.log("\n嘗試設置探索費為 0...");
    const tx = await contract.setExplorationFee(0);
    console.log("交易已發送:", tx.hash);
    
    const receipt = await tx.wait();
    console.log("交易狀態:", receipt.status === 1 ? "成功" : "失敗");
    
    const newFee = await contract.explorationFee();
    console.log("新探索費:", ethers.formatEther(newFee), "BNB");
    
  } catch (error) {
    console.error("\n❌ 錯誤:", error.message);
    
    // 檢查是否有 require 驗證
    if (error.reason) {
      console.log("錯誤原因:", error.reason);
    }
    
    // 嘗試其他值
    console.log("\n嘗試設置為 0.001 BNB...");
    try {
      const newFee = ethers.parseEther("0.001");
      const tx2 = await contract.setExplorationFee(newFee);
      console.log("交易已發送:", tx2.hash);
      await tx2.wait();
      console.log("✅ 成功設置為:", ethers.formatEther(newFee), "BNB");
    } catch (err2) {
      console.error("也失敗了:", err2.message);
    }
  }
}

main();