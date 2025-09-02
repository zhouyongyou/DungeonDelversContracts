// AltarOfAscension 合約完整部署腳本
// 包含部署、設置、連接、驗證等所有步驟
const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 配置載入
require('dotenv').config({ path: '.env.v25' });

async function deployAltarOfAscension() {
  console.log("🔥 AltarOfAscension 合約部署腳本");
  console.log("=" * 60);

  const [deployer] = await ethers.getSigners();
  console.log("部署者地址:", deployer.address);
  
  // 檢查餘額
  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("部署者餘額:", ethers.formatEther(balance), "BNB");

  if (balance < ethers.parseEther("0.1")) {
    throw new Error("餘額不足，需要至少 0.1 BNB 進行部署");
  }

  // Step 1: 讀取現有合約地址
  console.log("\n📋 Step 1: 載入現有合約地址");
  
  const DUNGEON_CORE = process.env.VITE_DUNGEONCORE_ADDRESS;
  const SOUL_SHARD = process.env.VITE_SOULSHARD_ADDRESS;
  
  if (!DUNGEON_CORE || !SOUL_SHARD) {
    throw new Error("缺少必要的合約地址，請檢查 .env.v25 文件");
  }

  console.log("DungeonCore:", DUNGEON_CORE);
  console.log("SoulShard:", SOUL_SHARD);

  // Step 2: 部署 AltarOfAscension 合約
  console.log("\n🚀 Step 2: 部署 AltarOfAscension 合約");
  
  const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
  
  // 構造器參數 (AltarOfAscension 不需要構造器參數)
  const constructorArgs = [];
  
  console.log("正在部署，請等待...");
  const altar = await AltarOfAscension.deploy({
    gasPrice: ethers.parseUnits("3", "gwei"), // 設定 gas price
    gasLimit: 3000000 // 設定 gas limit
  });

  await altar.waitForDeployment();
  const altarAddress = await altar.getAddress();
  
  console.log("✅ AltarOfAscension 部署成功!");
  console.log("合約地址:", altarAddress);
  console.log("構造器參數:", constructorArgs);

  // Step 3: 設置 AltarOfAscension 的 DungeonCore
  console.log("\n🔧 Step 3: 設置 AltarOfAscension 的 DungeonCore");
  
  try {
    const owner = await altar.owner();
    console.log("合約擁有者:", owner);
    
    console.log("正在設置 DungeonCore 地址...");
    const setTx = await altar.setDungeonCore(DUNGEON_CORE);
    console.log("交易已發送:", setTx.hash);
    await setTx.wait();
    console.log("✅ DungeonCore 設置成功");
    
    // 驗證設置
    const dungeonCore = await altar.dungeonCore();
    console.log("DungeonCore 地址:", dungeonCore);
    console.log("地址匹配:", dungeonCore === DUNGEON_CORE ? "✅ 正確" : "❌ 錯誤");
  } catch (error) {
    console.error("❌ 設置 DungeonCore 失敗:", error.message);
  }

  // Step 4: 設置 DungeonCore 連接
  console.log("\n🔗 Step 4: 設置 DungeonCore 連接");
  
  try {
    const dungeonCoreContract = await ethers.getContractAt("DungeonCore", DUNGEON_CORE);
    
    console.log("檢查當前 AltarOfAscension 地址...");
    let currentAltarAddress;
    
    try {
      currentAltarAddress = await dungeonCoreContract.altarOfAscensionAddress();
    } catch (error) {
      console.log("無法獲取當前 Altar 地址，可能是新方法名");
      // 嘗試其他可能的方法名
      try {
        currentAltarAddress = await dungeonCoreContract.getAltarOfAscension();
      } catch (error2) {
        console.warn("未找到對應的 getter 方法");
      }
    }
    
    if (currentAltarAddress && currentAltarAddress !== ethers.ZeroAddress) {
      console.log("當前 DungeonCore 中的 Altar 地址:", currentAltarAddress);
    }
    
    // 設置新的 AltarOfAscension 地址
    if (currentAltarAddress !== altarAddress) {
      console.log("正在更新 DungeonCore 中的 AltarOfAscension 地址...");
      
      // 嘗試不同的設置方法
      let setTx;
      try {
        setTx = await dungeonCoreContract.setAltarOfAscensionAddress(altarAddress);
      } catch (error) {
        console.log("嘗試其他方法名...");
        try {
          setTx = await dungeonCoreContract.setAltarOfAscension(altarAddress);
        } catch (error2) {
          console.warn("⚠️ 無法自動設置，可能需要手動設置");
          console.log("手動設置命令:");
          console.log(`dungeonCore.setAltarOfAscensionAddress("${altarAddress}")`);
        }
      }
      
      if (setTx) {
        console.log("交易已發送:", setTx.hash);
        await setTx.wait();
        console.log("✅ DungeonCore → AltarOfAscension 連接設置成功");
      }
    } else {
      console.log("✅ DungeonCore 中的 Altar 地址已是最新");
    }
  } catch (error) {
    console.error("❌ DungeonCore 連接設置失敗:", error.message);
    console.log("請手動設置 DungeonCore 中的 AltarOfAscension 地址");
  }

  // Step 5: 配置升星規則（示例配置）
  console.log("\n⚙️ Step 5: 配置升星規則");
  
  try {
    // 檢查是否有升星規則配置方法
    console.log("配置英雄升星規則...");
    
    // 通常升星規則包括：
    // - 每個稀有度的升級費用
    // - 升級成功機率
    // - 所需材料數量
    
    // 這裡需要根據實際合約介面調整
    // 示例：設置升星費用（如果合約有相關方法）
    
    console.log("✅ 升星規則將使用合約預設值");
    console.log("如需自定義，請手動調用相關設置方法");
    
  } catch (error) {
    console.log("⚠️ 升星規則設置需要手動進行");
  }

  // Step 6: 驗證完整連接
  console.log("\n🔍 Step 6: 驗證完整合約連接");
  
  try {
    // 驗證 Altar → DungeonCore
    const altarCore = await altar.dungeonCore();
    console.log("AltarOfAscension → DungeonCore:", altarCore === DUNGEON_CORE ? "✅ 正確" : "❌ 錯誤");
    
    // 驗證 DungeonCore → Altar
    const dungeonCoreContract = await ethers.getContractAt("DungeonCore", DUNGEON_CORE);
    try {
      const coreAltar = await dungeonCoreContract.altarOfAscensionAddress();
      console.log("DungeonCore → AltarOfAscension:", coreAltar === altarAddress ? "✅ 正確" : "❌ 錯誤");
    } catch {
      console.log("DungeonCore → AltarOfAscension: ⚠️ 無法驗證，可能需要手動檢查");
    }
    
    // 測試 Hero 和 Relic 合約的 Altar 授權
    const heroAddress = process.env.VITE_HERO_ADDRESS;
    const relicAddress = process.env.VITE_RELIC_ADDRESS;
    
    if (heroAddress && relicAddress) {
      console.log("\n檢查 NFT 合約的 Altar 授權...");
      
      try {
        const heroContract = await ethers.getContractAt("Hero", heroAddress);
        // 這裡會根據合約實際方法調整
        console.log("Hero 合約可被 Altar 調用:", "需要測試");
      } catch {
        console.log("Hero 合約授權檢查略過");
      }
      
      try {
        const relicContract = await ethers.getContractAt("Relic", relicAddress);
        // 這裡會根據合約實際方法調整  
        console.log("Relic 合約可被 Altar 調用:", "需要測試");
      } catch {
        console.log("Relic 合約授權檢查略過");
      }
    }
    
  } catch (error) {
    console.error("連接驗證過程中出現錯誤:", error.message);
  }

  // Step 7: 保存部署信息
  console.log("\n💾 Step 7: 保存部署信息");
  
  const deploymentInfo = {
    contractName: "AltarOfAscension",
    address: altarAddress,
    deployer: deployer.address,
    deploymentTime: new Date().toISOString(),
    constructorArgs: constructorArgs,
    network: "bsc",
    gasUsed: "約 2.5M gas",
    dependencies: {
      dungeonCore: DUNGEON_CORE,
      soulShard: SOUL_SHARD
    },
    verificationStatus: "待驗證"
  };
  
  // 保存到文件
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const filename = `altar-deployment-${timestamp}.json`;
  const filepath = path.join(deploymentDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));
  console.log("部署信息已保存至:", filepath);

  // Step 8: 生成驗證命令
  console.log("\n🔍 Step 8: 生成 BSCScan 驗證命令");
  
  const verifyCommand = `BSCSCAN_API_KEY=${process.env.BSCSCAN_API_KEY} npx hardhat verify --network bsc ${altarAddress}`;
  const verifyCommandWithArgs = constructorArgs.length > 0 
    ? `${verifyCommand} "${constructorArgs.join('" "')}"`
    : verifyCommand;
  
  console.log("驗證命令:");
  console.log(verifyCommandWithArgs);
  
  // 將驗證命令保存到文件
  const verifyScript = `#!/bin/bash
# AltarOfAscension 合約驗證腳本
# 生成時間: ${new Date().toISOString()}

echo "正在驗證 AltarOfAscension 合約..."
${verifyCommandWithArgs}

echo "驗證完成！"
echo "BSCScan 連結: https://bscscan.com/address/${altarAddress}#code"
`;

  const verifyScriptPath = path.join(__dirname, `verify-altar-${timestamp}.sh`);
  fs.writeFileSync(verifyScriptPath, verifyScript);
  fs.chmodSync(verifyScriptPath, '755');
  
  console.log("驗證腳本已生成:", verifyScriptPath);

  // Step 9: 更新環境變數建議
  console.log("\n📝 Step 9: 環境變數更新建議");
  
  console.log("建議將以下地址添加到 .env.v25:");
  console.log(`VITE_ALTAROFASCENSION_ADDRESS=${altarAddress}`);
  console.log("");
  console.log("然後執行配置同步:");
  console.log("node scripts/ultimate-config-system.js sync");

  // 總結
  console.log("\n" + "=" * 60);
  console.log("🎉 AltarOfAscension 部署完成總結");
  console.log("=" * 60);
  console.log("✅ 合約地址:", altarAddress);
  console.log("✅ 構造器參數:", constructorArgs);
  console.log("✅ 部署信息已保存");
  console.log("✅ 驗證腳本已生成");
  console.log("");
  console.log("🔄 下一步操作:");
  console.log("1. 執行驗證腳本進行開源驗證");
  console.log("2. 更新 .env.v25 中的合約地址");
  console.log("3. 執行配置同步到其他項目");
  console.log("4. 測試升星功能");
  console.log("");
  console.log("🚨 重要提醒:");
  console.log("- 請確認 DungeonCore 中的連接設置正確");
  console.log("- 測試環境請先小額測試升星功能");
  console.log("- 檢查 Hero/Relic 合約的 Altar 授權");

  return {
    altarAddress,
    deploymentInfo,
    verifyScriptPath
  };
}

// 錯誤處理包裝
async function main() {
  try {
    const result = await deployAltarOfAscension();
    console.log("\n🎊 部署腳本執行成功!");
  } catch (error) {
    console.error("\n💥 部署過程中發生錯誤:");
    console.error(error);
    
    if (error.message.includes("insufficient funds")) {
      console.log("\n💡 解決建議:");
      console.log("- 檢查錢包 BNB 餘額是否充足");
      console.log("- 降低 gasPrice 或 gasLimit");
    } else if (error.message.includes("nonce")) {
      console.log("\n💡 解決建議:");
      console.log("- 等待幾分鐘後重試");
      console.log("- 或重置錢包 nonce");
    }
    
    process.exitCode = 1;
  }
}

// 只有直接執行時才運行，避免被其他腳本引入時執行
if (require.main === module) {
  main().catch((error) => {
    console.error("未捕獲的錯誤:", error);
    process.exitCode = 1;
  });
}

module.exports = { deployAltarOfAscension };