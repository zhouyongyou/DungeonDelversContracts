const { ethers } = require("hardhat");

async function main() {
  console.log("=== 檢查 DungeonMaster Owner ===\n");
  
  const [signer] = await ethers.getSigners();
  console.log("當前錢包地址:", signer.address);
  
  // DungeonMaster 合約地址 (V22)
  const dungeonMasterAddress = "0x9ccF46E49DdA7D2DF7cE8064FB879D786D8b12D0";
  console.log("DungeonMaster 地址:", dungeonMasterAddress);
  
  // 簡單的 ABI，只包含需要的函數
  const abi = [
    "function owner() view returns (address)",
    "function explorationFee() view returns (uint256)",
    "function setExplorationFee(uint256)",
    "function paused() view returns (bool)"
  ];
  
  const dungeonMaster = new ethers.Contract(dungeonMasterAddress, abi, signer);
  
  try {
    // 1. 檢查 owner
    const owner = await dungeonMaster.owner();
    console.log("\n合約 Owner:", owner);
    console.log("您是 Owner 嗎?", owner.toLowerCase() === signer.address.toLowerCase());
    
    // 2. 檢查當前探索費
    const currentFee = await dungeonMaster.explorationFee();
    console.log("\n當前探索費:", ethers.formatEther(currentFee), "BNB");
    
    // 3. 檢查是否暫停
    const paused = await dungeonMaster.paused();
    console.log("合約是否暫停:", paused);
    
    // 4. 如果不是 owner，顯示可能的原因
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log("\n❌ 您不是合約的 Owner!");
      console.log("可能的解決方案:");
      console.log("1. 確認您使用的是正確的錢包地址");
      console.log("2. 如果合約 Owner 是多簽或其他地址，需要使用該地址執行交易");
      console.log("3. 檢查是否需要通過 DungeonCore 執行操作");
    }
    
  } catch (error) {
    console.log("\n錯誤:", error.message);
    if (error.reason) {
      console.log("原因:", error.reason);
    }
  }
  
  // 額外檢查：查看合約是否存在
  const code = await ethers.provider.getCode(dungeonMasterAddress);
  if (code === "0x") {
    console.log("\n❌ 合約地址沒有部署任何代碼!");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("腳本執行錯誤:", error);
    process.exit(1);
  });