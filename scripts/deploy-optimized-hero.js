const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

async function main() {
  console.log("=== 部署優化版 Hero 合約 ===\n");
  
  const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("操作者:", wallet.address);
  
  // 現有的合約地址
  const SOUL_TOKEN = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
  const ORACLE = "0x67989939163bCFC57302767722E1988FFac46d64";
  const VRF_MANAGER = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
  
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
  
  // 部署 Hero
  console.log("\n🚀 部署優化版 Hero");
  console.log("─".repeat(60));
  
  const heroPath = 'artifacts/contracts/current/nft/Hero.sol/Hero.json';
  const heroJson = JSON.parse(fs.readFileSync(heroPath, 'utf8'));
  
  try {
    const heroFactory = new ethers.ContractFactory(heroJson.abi, heroJson.bytecode, wallet);
    
    console.log("部署 Hero 合約...");
    const heroContract = await heroFactory.deploy(
      wallet.address, // initialOwner
      {
        gasLimit: 7000000 // 增加 gas limit
      }
    );
    
    console.log("Hero 交易哈希:", heroContract.deploymentTransaction().hash);
    await heroContract.waitForDeployment();
    const heroAddress = await heroContract.getAddress();
    console.log("✅ Hero 部署成功:", heroAddress);
    
    // 等待確認
    console.log("\n⏳ 等待區塊確認...");
    await heroContract.deploymentTransaction().wait(3);
    
    // 設置必要的合約地址
    console.log("\n🔧 配置合約");
    console.log("─".repeat(60));
    
    const hero = new ethers.Contract(heroAddress, heroJson.abi, wallet);
    
    console.log("設置 Hero 的 DungeonCore 地址...");
    const heroDungeonCoreTx = await hero.setDungeonCore(ORACLE);
    await heroDungeonCoreTx.wait();
    console.log("✅ Hero DungeonCore 已設置");
    
    console.log("設置 Hero 的 SOUL 代幣地址...");
    const heroSoulTx = await hero.setSoulShardToken(SOUL_TOKEN);
    await heroSoulTx.wait();
    console.log("✅ Hero SOUL 代幣已設置");
    
    console.log("設置 Hero 的 VRF Manager...");
    const heroVrfTx = await hero.setVRFManager(VRF_MANAGER);
    await heroVrfTx.wait();
    console.log("✅ Hero VRF Manager 已設置");
    
    // 設置價格
    console.log("\n💰 設置價格");
    console.log("─".repeat(60));
    
    const mintPriceUSD = 2; // 2 USD
    const heroSetPriceTx = await hero.setMintPriceUSD(mintPriceUSD);
    await heroSetPriceTx.wait();
    console.log("✅ Hero 價格設為", mintPriceUSD, "USD");
    
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
    
    // 保存部署信息
    const deploymentInfo = {
      timestamp: new Date().toISOString(),
      network: "BSC Mainnet",
      contract: "Hero (Optimized)",
      address: heroAddress,
      settings: {
        VRFManager: VRF_MANAGER,
        SoulToken: SOUL_TOKEN,
        Oracle: ORACLE,
        mintPriceUSD: mintPriceUSD
      },
      optimization: "tokenId + 單一隨機數生成所有屬性",
      savings: "節省 98% VRF 費用"
    };
    
    fs.writeFileSync(
      'optimized-hero-deployment.json',
      JSON.stringify(deploymentInfo, null, 2)
    );
    
    console.log("\n" + "=".repeat(60));
    console.log("✅ Hero 部署完成");
    console.log("─".repeat(60));
    console.log("Hero 合約:", heroAddress);
    console.log("VRF Manager:", VRF_MANAGER, "（已授權）");
    console.log("SOUL 代幣:", SOUL_TOKEN, "（已設置）");
    
    console.log("\n📋 下一步：");
    console.log("1. 部署優化版 Relic：node scripts/deploy-optimized-relic.js");
    console.log("2. 測試批量鑄造");
    console.log("3. 更新前端合約地址");
    
  } catch (error) {
    console.log("❌ 部署失敗:", error.shortMessage || error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("錯誤:", error);
    process.exit(1);
  });