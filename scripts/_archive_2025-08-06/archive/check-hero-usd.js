// 檢查 Hero 合約是否有方法修改 USD 地址
const { ethers } = require("hardhat");

async function main() {
  console.log("\n=== 檢查 Hero 合約 USD 配置 ===\n");
  
  const hero = await ethers.getContractAt([
    "function owner() view returns (address)",
    "function paused() view returns (bool)",
    "function setDungeonCore(address) external",
    "function dungeonCore() view returns (address)"
  ], "0x6E4dF8F5413B42EC7b82D2Bc20254Db5A11DB374");
  
  try {
    // 嘗試獲取 DungeonCore 地址
    const dungeonCore = await hero.dungeonCore();
    console.log("Hero 的 DungeonCore:", dungeonCore);
    
    // 檢查 owner
    const owner = await hero.owner();
    console.log("Hero Owner:", owner);
    
    // 嘗試檢查是否有 setUsdToken 函數
    console.log("\n檢查可用函數...");
    
    // 獲取合約 ABI
    const artifact = await hre.artifacts.readArtifact("Hero");
    const writeFunctions = artifact.abi
      .filter(item => item.type === 'function' && (item.stateMutability === 'nonpayable' || item.stateMutability === 'payable'))
      .map(item => item.name);
    
    console.log("可寫函數列表:");
    writeFunctions.forEach(func => console.log(`- ${func}`));
    
    // 查找與 USD 相關的函數
    const usdRelatedFunctions = writeFunctions.filter(func => 
      func.toLowerCase().includes('usd') || 
      func.toLowerCase().includes('token') ||
      func.toLowerCase().includes('price')
    );
    
    console.log("\n與 USD/價格相關的函數:");
    usdRelatedFunctions.forEach(func => console.log(`- ${func}`));
    
  } catch (error) {
    console.error("錯誤:", error.message);
  }
  
  console.log("\n=== 分析 ===");
  console.log("Hero/Relic 合約通常不提供修改 USD 地址的功能");
  console.log("USD 地址在合約部署時就固定了");
  console.log("\n可能的解決方案：");
  console.log("1. 使用 MockOracle（目前的方案）✓");
  console.log("2. 部署新的 Hero/Relic 合約（V19 方案）");
  console.log("3. 通過代理合約升級（如果有實現）");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });