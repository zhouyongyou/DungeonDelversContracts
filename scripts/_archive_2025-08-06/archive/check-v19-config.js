// 檢查 V19 配置狀態
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 檢查 V19 配置 ===\n");
  
  const dungeonCore = "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9";
  
  // 檢查 DungeonCore 的合約設置
  const core = await ethers.getContractAt([
    "function oracle() view returns (address)",
    "function heroContract() view returns (address)", 
    "function relicContract() view returns (address)",
    "function getSoulShardAmountForUSD(uint256) view returns (uint256)"
  ], dungeonCore);
  
  try {
    // 使用正確的屬性名稱（不是函數）
    const DungeonCoreABI = [
      {
        "inputs": [],
        "name": "oracle",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [],
        "name": "heroContract",
        "outputs": [{"internalType": "address", "name": "", "type": "address"}],
        "stateMutability": "view",
        "type": "function"
      }
    ];
    
    const coreWithABI = await ethers.getContractAt(DungeonCoreABI, dungeonCore);
    
    const oracle = await coreWithABI.oracle();
    const hero = await coreWithABI.heroContract();
    
    console.log("DungeonCore 配置:");
    console.log("- Oracle:", oracle);
    console.log("- Hero:", hero);
    
    // 測試 getSoulShardAmountForUSD
    const testAmount = ethers.parseEther("2");
    const soulAmount = await core.getSoulShardAmountForUSD(testAmount);
    console.log("\nDungeonCore: 2 USD =", ethers.formatEther(soulAmount), "SOUL");
    
  } catch (error) {
    console.error("錯誤:", error.message);
    
    // 嘗試直接讀取 storage slots
    console.log("\n嘗試讀取 storage slots...");
    const provider = ethers.provider;
    
    // Oracle 通常在 slot 1
    const oracleSlot = await provider.getStorage(dungeonCore, 1);
    console.log("Oracle (slot 1):", oracleSlot);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });