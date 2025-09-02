const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  console.log("=== 驗證所有 VRF Manager 授權狀態 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  
  // 新 VRF Manager
  const vrfManagerAddress = "0xBCC8821d3727C4339d2917Fb33D708c6C006c034";
  const vrfAbi = [
    "function authorizedContracts(address) view returns (bool)",
    "function owner() view returns (address)"
  ];
  
  const vrfManager = new ethers.Contract(vrfManagerAddress, vrfAbi, provider);
  
  // 所有需要授權的合約
  const contracts = [
    { name: "DungeonMaster", address: "0xE391261741Fad5FCC2D298d00e8c684767021253" },
    { name: "Hero", address: "0x575e7407C06ADeb47067AD19663af50DdAe460CF" },
    { name: "Relic", address: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739" },
    { name: "AltarOfAscension", address: "0x095559778C0BAA2d8FA040Ab0f8752cF07779D33" }
  ];
  
  console.log("VRF Manager:", vrfManagerAddress);
  const owner = await vrfManager.owner();
  console.log("VRF Manager Owner:", owner);
  console.log("環境變數錢包:", process.env.PRIVATE_KEY ? "0xEbCF4A36Ad1485A9737025e9d72186b604487274" : "未設置");
  console.log("\n授權狀態檢查：");
  console.log("─".repeat(60));
  
  let allAuthorized = true;
  
  for (const contract of contracts) {
    const isAuthorized = await vrfManager.authorizedContracts(contract.address);
    const status = isAuthorized ? "✅ 已授權" : "❌ 未授權";
    console.log(`${contract.name.padEnd(20)} ${contract.address} ${status}`);
    
    if (!isAuthorized) {
      allAuthorized = false;
    }
  }
  
  console.log("─".repeat(60));
  
  // 檢查每個合約的 VRF Manager 設置
  console.log("\n各合約 VRF Manager 設置：");
  console.log("─".repeat(60));
  
  const contractAbi = ["function vrfManager() view returns (address)"];
  
  for (const contract of contracts) {
    try {
      const instance = new ethers.Contract(contract.address, contractAbi, provider);
      const currentVrf = await instance.vrfManager();
      const isCorrect = currentVrf.toLowerCase() === vrfManagerAddress.toLowerCase();
      const status = isCorrect ? "✅ 正確" : `❌ 錯誤 (${currentVrf})`;
      console.log(`${contract.name.padEnd(20)} ${status}`);
    } catch (error) {
      console.log(`${contract.name.padEnd(20)} ⚠️  無 vrfManager 函數或讀取失敗`);
    }
  }
  
  console.log("─".repeat(60));
  
  if (allAuthorized) {
    console.log("\n🎉 所有合約都已正確授權！");
    console.log("✅ 系統已準備就緒，可以開始測試。");
  } else {
    console.log("\n⚠️  有合約尚未授權，需要執行授權操作。");
    console.log("請運行授權腳本來完成設置。");
  }
  
  // 檢查餘額
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  const balance = await provider.getBalance(wallet.address);
  console.log("\n錢包餘額:", ethers.formatEther(balance), "BNB");
  
  if (parseFloat(ethers.formatEther(balance)) < 0.1) {
    console.log("⚠️  餘額較低，建議充值以確保操作順利");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });