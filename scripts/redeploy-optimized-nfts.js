const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 重新部署優化的 NFT 合約 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // 現有的合約地址（需要保持相關配置）
  const SOUL_TOKEN = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const ORACLE = "0x67989939163bCFC57302767722E1988FFac46d64";
  const VRF_MANAGER = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1"; // 已測試成功的
  
  console.log("📊 優化內容");
  console.log("─".repeat(60));
  console.log("✅ 用 tokenId + 1個隨機數生成所有屬性");
  console.log("✅ 大幅節省 VRF 費用（98%）");
  console.log("✅ 保持原有的 SOUL + BNB 支付邏輯");
  
  // 編譯合約
  console.log("\n🔨 編譯合約...");
  const { execSync } = require('child_process');
  try {
    execSync('npx hardhat compile', { stdio: 'inherit' });
    console.log("✅ 編譯成功");
  } catch (error) {
    console.log("❌ 編譯失敗");
    return;
  }
  
  const deployedContracts = {};
  
  // 部署 Hero
  console.log("\n🚀 部署優化版 Hero");
  console.log("─".repeat(60));
  
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  const heroFactory = new ethers.ContractFactory(heroJson.abi, heroJson.bytecode, wallet);
  
  const heroContract = await heroFactory.deploy(
    wallet.address, // initialOwner
    {
      gasLimit: 5000000
    }
  );
  
  console.log("Hero 交易哈希:", heroContract.deploymentTransaction().hash);
  await heroContract.waitForDeployment();
  const heroAddress = await heroContract.getAddress();
  console.log("✅ Hero 部署成功:", heroAddress);
  
  deployedContracts.Hero = heroAddress;
  
  // 部署 Relic
  console.log("\n🚀 部署優化版 Relic");
  console.log("─".repeat(60));
  
  const relicPath = 'artifacts/contracts/current/nft/Relic.sol/Relic.json';
  const relicJson = JSON.parse(fs.readFileSync(relicPath, 'utf8'));
  const relicFactory = new ethers.ContractFactory(relicJson.abi, relicJson.bytecode, wallet);
  
  const relicContract = await relicFactory.deploy(
    wallet.address, // initialOwner
    {
      gasLimit: 5000000
    }
  );
  
  console.log("Relic 交易哈希:", relicContract.deploymentTransaction().hash);
  await relicContract.waitForDeployment();
  const relicAddress = await relicContract.getAddress();
  console.log("✅ Relic 部署成功:", relicAddress);
  
  deployedContracts.Relic = relicAddress;
  
  // 等待確認
  console.log("\n⏳ 等待區塊確認...");
  await heroContract.deploymentTransaction().wait(3);
  await relicContract.deploymentTransaction().wait(3);
  
  // 設置必要的合約地址
  console.log("\n🔧 配置合約");
  console.log("─".repeat(60));
  
  const hero = new ethers.Contract(heroAddress, heroJson.abi, wallet);
  const relic = new ethers.Contract(relicAddress, relicJson.abi, wallet);
  
  console.log("設置 Hero 的 DungeonCore 地址...");
  const heroDungeonCoreTx = await hero.setDungeonCore(ORACLE);
  await heroDungeonCoreTx.wait();
  console.log("✅ Hero DungeonCore 已設置");
  
  console.log("設置 Relic 的 DungeonCore 地址...");
  const relicDungeonCoreTx = await relic.setDungeonCore(ORACLE);
  await relicDungeonCoreTx.wait();
  console.log("✅ Relic DungeonCore 已設置");

  console.log("設置 Hero 的 SOUL 代幣地址...");
  const heroSoulTx = await hero.setSoulShardToken(SOUL_TOKEN);
  await heroSoulTx.wait();
  console.log("✅ Hero SOUL 代幣已設置");
  
  console.log("設置 Relic 的 SOUL 代幣地址...");
  const relicSoulTx = await relic.setSoulShardToken(SOUL_TOKEN);
  await relicSoulTx.wait();
  console.log("✅ Relic SOUL 代幣已設置");
  
  console.log("設置 Hero 的 VRF Manager...");
  const heroVrfTx = await hero.setVRFManager(VRF_MANAGER);
  await heroVrfTx.wait();
  console.log("✅ Hero VRF Manager 已設置");
  
  console.log("設置 Relic 的 VRF Manager...");
  const relicVrfTx = await relic.setVRFManager(VRF_MANAGER);
  await relicVrfTx.wait();
  console.log("✅ Relic VRF Manager 已設置");
  
  // 設置價格
  console.log("\n💰 設置價格");
  console.log("─".repeat(60));
  
  const mintPriceUSD = 2; // 2 USD
  
  const heroSetPriceTx = await hero.setMintPriceUSD(mintPriceUSD);
  await heroSetPriceTx.wait();
  console.log("✅ Hero 價格設為", mintPriceUSD, "USD");
  
  const relicSetPriceTx = await relic.setMintPriceUSD(mintPriceUSD);
  await relicSetPriceTx.wait();
  console.log("✅ Relic 價格設為", mintPriceUSD, "USD");
  
  // 更新 VRF Manager 授權
  console.log("\n🔐 更新 VRF Manager 授權");
  console.log("─".repeat(60));
  
  const vrfPath = 'artifacts/contracts/current/core/VRFConsumerV2Plus.sol/VRFConsumerV2Plus.json';
  const vrfJson = JSON.parse(fs.readFileSync(vrfPath, 'utf8'));
  const vrfManager = new ethers.Contract(VRF_MANAGER, vrfJson.abi, wallet);
  
  console.log("授權新的 Hero 合約...");
  const authHeroTx = await vrfManager.setAuthorizedContract(heroAddress, true);
  await authHeroTx.wait();
  console.log("✅ 新 Hero 已授權");
  
  console.log("授權新的 Relic 合約...");
  const authRelicTx = await vrfManager.setAuthorizedContract(relicAddress, true);
  await authRelicTx.wait();
  console.log("✅ 新 Relic 已授權");
  
  // 保存部署信息
  const deploymentInfo = {
    timestamp: new Date().toISOString(),
    network: "BSC Mainnet",
    contracts: {
      Hero: heroAddress,
      Relic: relicAddress,
      VRFManager: VRF_MANAGER,
      SoulToken: SOUL_TOKEN,
      Oracle: ORACLE
    },
    optimizations: [
      "tokenId + 單一隨機數生成所有屬性",
      "節省 98% VRF 費用",
      "保持 SOUL + BNB 支付邏輯"
    ],
    oldContracts: {
      Hero: "0x575e7407C06ADeb47067AD19663af50DdAe460CF",
      Relic: "0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739"
    }
  };
  
  fs.writeFileSync(
    'optimized-nft-deployment.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("\n" + "=".repeat(60));
  console.log("✅ 部署完成");
  console.log("─".repeat(60));
  console.log("Hero 合約:", heroAddress);
  console.log("Relic 合約:", relicAddress);
  console.log("VRF Manager:", VRF_MANAGER, "（已設置）");
  
  console.log("\n📋 下一步：");
  console.log("1. 測試批量鑄造：node scripts/test-optimized-minting.js");
  console.log("2. 更新前端合約地址");
  console.log("3. 更新子圖配置（如果有）");
  
  console.log("\n💰 費用優化效果：");
  console.log("50 個 NFT 的 VRF 費用：");
  console.log("- 優化前：0.0025 BNB（50 × 0.00005）");
  console.log("- 優化後：0.00005 BNB（1 × 0.00005）");
  console.log("- 節省：98% 🎉");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });