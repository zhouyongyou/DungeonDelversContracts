// AltarOfAscension 完整設置腳本
// 整合部署、配置、測試、驗證的一鍵式解決方案
const { deployAltarOfAscension } = require('./deploy-altar-of-ascension');
const { testAltarDeployment } = require('./test-altar-deployment');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置載入
require('dotenv').config({ path: '.env.v25' });

async function executeCommand(command, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit',
      shell: true 
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

async function updateEnvironmentVariable(key, value) {
  const envPath = path.join(__dirname, '../.env.v25');
  
  try {
    let envContent = '';
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }
    
    const lines = envContent.split('\n');
    let found = false;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`${key}=`)) {
        lines[i] = `${key}=${value}`;
        found = true;
        break;
      }
    }
    
    if (!found) {
      lines.push(`${key}=${value}`);
    }
    
    fs.writeFileSync(envPath, lines.join('\n'));
    console.log(`✅ 已更新 ${key} 到 .env.v25`);
    
  } catch (error) {
    console.warn(`⚠️ 無法自動更新 .env.v25: ${error.message}`);
    console.log(`請手動添加: ${key}=${value}`);
  }
}

async function syncConfiguration() {
  console.log("\n🔄 同步配置到其他項目...");
  
  try {
    await executeCommand('node', ['scripts/ultimate-config-system.js', 'sync']);
    console.log("✅ 配置同步完成");
    return true;
  } catch (error) {
    console.warn("⚠️ 配置同步失敗:", error.message);
    console.log("請手動執行: node scripts/ultimate-config-system.js sync");
    return false;
  }
}

async function verifyContract(address, constructorArgs = []) {
  console.log("\n🔍 開源驗證合約...");
  
  if (!process.env.BSCSCAN_API_KEY) {
    console.warn("⚠️ 缺少 BSCSCAN_API_KEY，跳過自動驗證");
    return false;
  }
  
  try {
    const args = [
      'hardhat', 'verify', 
      '--network', 'bsc',
      address,
      ...constructorArgs.map(arg => `"${arg}"`)
    ];
    
    await executeCommand('npx', args);
    console.log("✅ 合約驗證成功");
    return true;
  } catch (error) {
    console.warn("⚠️ 自動驗證失敗:", error.message);
    console.log("請手動執行驗證命令");
    return false;
  }
}

async function completeAltarSetup() {
  console.log("🚀 AltarOfAscension 完整設置流程");
  console.log("=" * 70);
  
  const startTime = Date.now();
  let altarAddress;
  let deploymentInfo;
  
  try {
    // Phase 1: 部署合約
    console.log("\n📋 Phase 1: 部署 AltarOfAscension 合約");
    console.log("-" * 50);
    
    const deployResult = await deployAltarOfAscension();
    altarAddress = deployResult.altarAddress;
    deploymentInfo = deployResult.deploymentInfo;
    
    if (!altarAddress) {
      throw new Error("部署失敗：未獲得合約地址");
    }
    
    console.log(`✅ Phase 1 完成 - 合約地址: ${altarAddress}`);
    
    // Phase 2: 更新環境變數
    console.log("\n📋 Phase 2: 更新環境配置");
    console.log("-" * 50);
    
    await updateEnvironmentVariable('VITE_ALTAROFASCENSION_ADDRESS', altarAddress);
    console.log("✅ Phase 2 完成 - 環境變數已更新");
    
    // Phase 3: 同步配置到其他項目
    console.log("\n📋 Phase 3: 同步配置到前端、後端、子圖");
    console.log("-" * 50);
    
    const syncSuccess = await syncConfiguration();
    if (syncSuccess) {
      console.log("✅ Phase 3 完成 - 配置同步成功");
    } else {
      console.log("⚠️ Phase 3 部分完成 - 請手動同步配置");
    }
    
    // Phase 4: 等待區塊確認
    console.log("\n📋 Phase 4: 等待區塊鏈確認");
    console.log("-" * 50);
    
    console.log("等待 5 個區塊確認...");
    await new Promise(resolve => setTimeout(resolve, 15000)); // 等待約 15 秒
    console.log("✅ Phase 4 完成 - 區塊確認等待結束");
    
    // Phase 5: 功能測試
    console.log("\n📋 Phase 5: 部署後功能測試");
    console.log("-" * 50);
    
    const testSuccess = await testAltarDeployment(altarAddress);
    if (testSuccess) {
      console.log("✅ Phase 5 完成 - 功能測試通過");
    } else {
      console.log("⚠️ Phase 5 部分完成 - 部分功能測試失敗");
    }
    
    // Phase 6: 開源驗證
    console.log("\n📋 Phase 6: BSCScan 開源驗證");
    console.log("-" * 50);
    
    const verifySuccess = await verifyContract(altarAddress, deploymentInfo.constructorArgs);
    if (verifySuccess) {
      console.log("✅ Phase 6 完成 - 開源驗證成功");
    } else {
      console.log("⚠️ Phase 6 需要手動操作 - 請執行生成的驗證腳本");
    }
    
    // 完成總結
    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log("\n" + "=" * 70);
    console.log("🎉 AltarOfAscension 完整設置流程完成!");
    console.log("=" * 70);
    
    console.log(`⏱️  總耗時: ${duration} 秒`);
    console.log(`📍 合約地址: ${altarAddress}`);
    console.log(`🔗 BSCScan: https://bscscan.com/address/${altarAddress}`);
    console.log(`📊 部署者: ${deploymentInfo.deployer}`);
    console.log(`⛽ Gas 消耗: ${deploymentInfo.gasUsed}`);
    
    console.log("\n🔄 後續操作檢查清單:");
    console.log("□ 檢查前端是否已同步新的合約地址");
    console.log("□ 檢查後端是否已同步新的合約地址"); 
    console.log("□ 檢查子圖是否已同步新的合約地址");
    console.log("□ 測試前端升星功能是否正常");
    console.log("□ 確認 Hero/Relic 合約能正確調用 Altar");
    console.log("□ 設置升星相關的遊戲參數（如需要）");
    
    console.log("\n📝 重要文件位置:");
    console.log(`- 部署信息: ${deployResult.verifyScriptPath.replace('verify-altar-', 'altar-deployment-').replace('.sh', '.json')}`);
    console.log(`- 驗證腳本: ${deployResult.verifyScriptPath}`);
    console.log("- 主配置文件: .env.v25");
    
    console.log("\n💡 如需手動操作:");
    console.log("1. 同步配置: node scripts/ultimate-config-system.js sync");
    console.log("2. 驗證合約: 執行生成的 verify-altar-*.sh 腳本");
    console.log("3. 測試功能: node scripts/test-altar-deployment.js <ALTAR_ADDRESS>");
    
    return {
      success: true,
      altarAddress,
      deploymentInfo,
      duration
    };
    
  } catch (error) {
    console.error("\n💥 設置流程中發生錯誤:");
    console.error(error);
    
    // 錯誤恢復建議
    console.log("\n🛠️ 錯誤恢復建議:");
    
    if (altarAddress) {
      console.log(`- 合約已部署到: ${altarAddress}`);
      console.log("- 可以繼續手動完成後續步驟");
      console.log(`- 測試命令: node scripts/test-altar-deployment.js ${altarAddress}`);
    } else {
      console.log("- 合約未成功部署，請檢查部署錯誤");
      console.log("- 確認錢包餘額和網絡連接");
      console.log("- 檢查 .env.v25 中的配置");
    }
    
    console.log("- 查看詳細錯誤信息並手動重試失敗的步驟");
    
    return {
      success: false,
      error: error.message,
      altarAddress
    };
  }
}

// 主函數
async function main() {
  console.log("AltarOfAscension 完整設置工具");
  console.log("此腳本將依序執行：部署 → 配置 → 測試 → 驗證");
  console.log("");
  
  // 預檢查
  console.log("🔍 執行前置檢查...");
  
  if (!process.env.PRIVATE_KEY) {
    console.error("❌ 缺少 PRIVATE_KEY 環境變數");
    return;
  }
  
  if (!process.env.VITE_DUNGEONCORE_ADDRESS) {
    console.error("❌ 缺少 DUNGEONCORE_ADDRESS，請檢查 .env.v25");
    return;
  }
  
  console.log("✅ 前置檢查通過");
  
  // 用戶確認
  console.log("\n⚠️  重要提醒:");
  console.log("- 此操作將部署新的 AltarOfAscension 合約");
  console.log("- 將消耗約 0.01-0.02 BNB 的 Gas 費用");
  console.log("- 將自動更新所有項目的配置文件");
  console.log("- 建議在測試網先行驗證");
  
  // 在生產環境中，這裡可以添加用戶確認提示
  // 目前直接執行，因為腳本是手動運行的
  
  const result = await completeAltarSetup();
  
  if (result.success) {
    console.log("\n🚀 設置完成！AltarOfAscension 已可投入使用。");
    process.exitCode = 0;
  } else {
    console.log("\n🛑 設置未完全成功，請檢查錯誤信息並手動完成剩餘步驟。");
    process.exitCode = 1;
  }
}

// 只有直接執行時才運行
if (require.main === module) {
  main().catch((error) => {
    console.error("完整設置腳本執行失敗:", error);
    process.exitCode = 1;
  });
}

module.exports = { completeAltarSetup };