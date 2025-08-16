// 檢查 V19 部署準備情況
const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("\n=== V19 部署前檢查 ===\n");
  
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("1. 部署者信息:");
  console.log("   - 地址:", deployer.address);
  console.log("   - BNB 餘額:", ethers.formatEther(balance), "BNB");
  console.log("   - 餘額是否充足:", parseFloat(ethers.formatEther(balance)) >= 0.2 ? "✅" : "❌ (建議至少 0.2 BNB)");
  
  console.log("\n2. 環境變數檢查:");
  console.log("   - MAINNET_USD_ADDRESS:", process.env.MAINNET_USD_ADDRESS || "❌ 未設置");
  console.log("   - MAINNET_SOULSHARD_ADDRESS:", process.env.MAINNET_SOULSHARD_ADDRESS || "❌ 未設置");
  console.log("   - POOL_ADDRESS:", process.env.POOL_ADDRESS || "❌ 未設置");
  
  console.log("\n3. V19 部署將會:");
  console.log("   ✅ 使用現有的 USD Token:", process.env.MAINNET_USD_ADDRESS);
  console.log("   ✅ 使用現有的 SOUL Token:", process.env.MAINNET_SOULSHARD_ADDRESS);
  console.log("   ✅ 使用真實 Uniswap V3 Pool:", process.env.POOL_ADDRESS);
  console.log("   ✅ 所有合約統一使用相同的 USD 地址");
  console.log("   ✅ 價格將顯示為非整數（約 33,944 SOUL）");
  
  console.log("\n4. 將部署的合約:");
  console.log("   - DungeonCore (總機)");
  console.log("   - Oracle (使用真實 Pool)");
  console.log("   - Hero NFT");
  console.log("   - Relic NFT");
  console.log("   - Party NFT");
  console.log("   - PlayerVault");
  console.log("   - PlayerProfile");
  console.log("   - VIPStaking");
  console.log("   - DungeonMaster");
  console.log("   - DungeonStorage");
  console.log("   - AltarOfAscension");
  
  console.log("\n5. 準備狀態:");
  const isReady = 
    parseFloat(ethers.formatEther(balance)) >= 0.2 &&
    process.env.MAINNET_USD_ADDRESS &&
    process.env.MAINNET_SOULSHARD_ADDRESS &&
    process.env.POOL_ADDRESS;
  
  if (isReady) {
    console.log("\n✅ 所有檢查通過，準備開始部署 V19！");
    console.log("\n執行命令：");
    console.log("npx hardhat run scripts/deploy/deploy-v19-complete-fix.js --network bsc");
  } else {
    console.log("\n❌ 請先解決上述問題再開始部署");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });