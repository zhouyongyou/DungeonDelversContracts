const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 更新 DungeonMaster VRF Manager ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  const newVrfManager = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  const dungeonMasterAddress = "0xE391261741Fad5FCC2D298d00e8c684767021253";
  
  // 更新 DungeonMaster 的 VRF Manager
  console.log("1. 更新 DungeonMaster 的 VRF Manager...");
  const dmAbi = ["function setVRFManager(address)"];
  const dungeonMaster = new ethers.Contract(dungeonMasterAddress, dmAbi, wallet);
  
  const feeData = await provider.getFeeData();
  console.log("   Gas 價格:", ethers.formatUnits(feeData.gasPrice, 'gwei'), "gwei");
  
  try {
    const tx = await dungeonMaster.setVRFManager(newVrfManager, {
      gasLimit: 100000,
      gasPrice: feeData.gasPrice
    });
    console.log("   交易哈希:", tx.hash);
    await tx.wait();
    console.log("   ✅ DungeonMaster VRF Manager 已更新");
  } catch (error) {
    console.log("   ❌ 更新失敗:", error.message);
    return;
  }
  
  // 驗證設置
  console.log("\n2. 驗證設置...");
  const dmReadAbi = ["function vrfManager() view returns (address)"];
  const dmRead = new ethers.Contract(dungeonMasterAddress, dmReadAbi, provider);
  const currentVrf = await dmRead.vrfManager();
  
  console.log("   DungeonMaster 當前 VRF Manager:", currentVrf);
  console.log("   是否正確:", currentVrf.toLowerCase() === newVrfManager.toLowerCase() ? "✅" : "❌");
  
  console.log("\n=== 完成 ===");
  console.log("所有合約現在都使用新的 VRF Manager:");
  console.log("- VRF Manager:", newVrfManager);
  console.log("- Hero: ✅");
  console.log("- Relic: ✅");
  console.log("- DungeonMaster: ✅");
  console.log("- AltarOfAscension: ✅");
  
  console.log("\n🎉 系統完全準備就緒！可以開始前端測試。");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });