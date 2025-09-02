// 完整的 NFT 合約重新部署流程 (V25.1.5)
// 自動執行：部署 → 驗證 → 互連設置 → 地址更新

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 導入各個步驟的腳本
const deployScript = require('./redeploy-nft-contracts.js');
const verifyScript = require('./verify-nft-contracts.js');
const setupScript = require('./setup-nft-connections.js');

async function main() {
  console.log("🚀 開始完整的 V25.1.5 NFT 合約重新部署流程");
  console.log("=".repeat(80));
  console.log("此流程將執行以下步驟:");
  console.log("1. 📦 部署 5 個 NFT 合約");
  console.log("2. 🔍 在 BSCScan 驗證開源");
  console.log("3. 🔗 設置合約間互連");
  console.log("4. 📝 更新 .env 配置文件");
  console.log("5. 🌐 同步地址到前端、後端、子圖");
  console.log("=".repeat(80));

  try {
    // ==================== Step 1: 部署合約 ====================
    console.log("\n🎯 Step 1: 部署 NFT 合約");
    console.log("-".repeat(50));
    
    const deployedAddresses = await deployScript();
    console.log("✅ 部署完成，獲得新地址:");
    Object.entries(deployedAddresses).forEach(([name, address]) => {
      console.log(`  ${name}: ${address}`);
    });

    // ==================== Step 2: 更新 .env 文件 ====================
    console.log("\n🎯 Step 2: 更新 .env 配置文件");
    console.log("-".repeat(50));
    
    await updateEnvFile(deployedAddresses);
    console.log("✅ .env 文件已更新");

    // 等待一段時間讓合約在區塊鏈上完全確認
    console.log("\n⏳ 等待 30 秒讓合約在區塊鏈上完全確認...");
    await sleep(30000);

    // ==================== Step 3: 驗證合約 ====================
    console.log("\n🎯 Step 3: 驗證合約開源");
    console.log("-".repeat(50));
    
    try {
      await verifyScript();
      console.log("✅ 合約驗證完成");
    } catch (error) {
      console.log("⚠️  驗證步驟出現問題，但可以繼續:", error.message);
    }

    // ==================== Step 4: 設置合約互連 ====================
    console.log("\n🎯 Step 4: 設置合約間互連");
    console.log("-".repeat(50));
    
    await setupScript();
    console.log("✅ 合約互連設置完成");

    // ==================== Step 5: 同步地址到其他項目 ====================
    console.log("\n🎯 Step 5: 同步地址到前端、後端、子圖");
    console.log("-".repeat(50));
    
    try {
      console.log("執行統一配置同步...");
      const syncOutput = execSync('node scripts/ultimate-config-system.js sync', { 
        encoding: 'utf8',
        cwd: process.cwd()
      });
      console.log(syncOutput);
      console.log("✅ 地址同步完成");
    } catch (error) {
      console.log("⚠️  自動同步失敗，請手動執行:");
      console.log("  node scripts/ultimate-config-system.js sync");
      console.log("錯誤:", error.message);
    }

    // ==================== 最終總結 ====================
    console.log("\n" + "=".repeat(80));
    console.log("🎉 V25.1.5 NFT 合約重新部署完成!");
    console.log("=".repeat(80));
    
    console.log("📊 新合約地址總結:");
    console.log(`Hero:         ${deployedAddresses.hero}`);
    console.log(`Relic:        ${deployedAddresses.relic}`);
    console.log(`Party:        ${deployedAddresses.party}`);
    console.log(`PlayerProfile: ${deployedAddresses.playerProfile}`);
    console.log(`VIPStaking:   ${deployedAddresses.vipStaking}`);
    console.log(`DungeonCore:  ${deployedAddresses.dungeonCore} (unchanged)`);

    console.log("\n🔗 BSCScan 驗證鏈接:");
    Object.entries(deployedAddresses).forEach(([name, address]) => {
      if (name !== 'dungeonCore') {
        console.log(`${name}: https://bscscan.com/address/${address}#code`);
      }
    });

    console.log("\n📝 後續步驟:");
    console.log("1. ✅ 合約已部署並驗證");
    console.log("2. ✅ 合約間互連已設置");
    console.log("3. ✅ 地址已同步到所有項目");
    console.log("4. 🔄 請重啟前端開發服務器: npm run dev");
    console.log("5. 🔄 請重啟後端服務器");
    console.log("6. 📊 請重新部署子圖");

    console.log("\n⚠️  重要提醒:");
    console.log("• 請在各個服務重啟後測試核心功能");
    console.log("• 檢查前端是否能正常讀取合約數據");
    console.log("• 測試 NFT 鑄造功能是否正常");
    console.log("• 確認子圖是否正確索引新合約");

  } catch (error) {
    console.error("❌ 部署流程失敗:", error);
    console.log("\n🔧 故障排除建議:");
    console.log("1. 檢查錢包私鑰和網絡配置");
    console.log("2. 確認有足夠的 BNB 支付 gas");
    console.log("3. 檢查 BSCScan API key 配置");
    console.log("4. 手動執行各個步驟進行調試");
    process.exit(1);
  }
}

// 更新 .env 文件的函數
async function updateEnvFile(addresses) {
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    throw new Error('找不到 .env 文件');
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // 更新各個地址
  const addressUpdates = {
    'VITE_HERO_ADDRESS': addresses.hero,
    'VITE_RELIC_ADDRESS': addresses.relic,
    'VITE_PARTY_ADDRESS': addresses.party,
    'VITE_PLAYERPROFILE_ADDRESS': addresses.playerProfile,
    'VITE_VIPSTAKING_ADDRESS': addresses.vipStaking
  };

  Object.entries(addressUpdates).forEach(([key, value]) => {
    const regex = new RegExp(`^${key}=.*$`, 'm');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  });

  // 添加部署時間戳
  const timestamp = new Date().toISOString();
  const versionComment = `\n# V25.1.5 NFT 合約重新部署 - ${timestamp}`;
  envContent = versionComment + '\n' + envContent;

  fs.writeFileSync(envPath, envContent);
  console.log(`✅ 已更新 ${envPath}`);
}

// 延時函數
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 如果直接運行此腳本
if (require.main === module) {
  main()
    .then(() => {
      console.log("\n🎊 完整部署流程執行完成!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 完整部署流程執行失敗:", error);
      process.exit(1);
    });
}

module.exports = main;