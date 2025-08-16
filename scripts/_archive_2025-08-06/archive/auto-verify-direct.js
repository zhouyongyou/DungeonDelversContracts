// 直接使用 Node.js 和 BSCScan API 自動驗證
const fs = require('fs');
require('dotenv').config();

// BSCScan API 驗證函數
async function verifyWithAPI(contractAddress, sourceCode, contractName, constructorArgs, compilerVersion) {
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  if (!apiKey) {
    console.log("❌ 找不到 BSCSCAN_API_KEY 環境變數");
    return false;
  }
  
  const params = new URLSearchParams({
    module: 'contract',
    action: 'verifysourcecode',
    apikey: apiKey,
    contractaddress: contractAddress,
    sourceCode: sourceCode,
    codeformat: 'solidity-single-file',
    contractname: contractName,
    compilerversion: compilerVersion,
    optimizationUsed: '1',
    runs: '200',
    viaIR: '1',
    constructorArguements: constructorArgs, // 注意：BSCScan API 的拼寫
    evmversion: 'paris',
    licenseType: '3' // MIT
  });

  console.log(`🚀 開始 API 驗證 ${contractName}...`);
  console.log(`📍 地址: ${contractAddress}`);
  console.log(`🔧 編譯器: ${compilerVersion}`);
  console.log(`📋 構造參數長度: ${constructorArgs.length} 字元`);
  
  try {
    const response = await fetch('https://api.bscscan.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    
    const result = await response.json();
    
    console.log(`📊 API 回應:`, result);
    
    if (result.status === '1') {
      console.log(`✅ ${contractName} API 提交成功！`);
      console.log(`📋 GUID: ${result.result}`);
      
      // 檢查驗證狀態
      await checkVerificationStatus(result.result, contractName, apiKey);
      return true;
    } else {
      console.log(`❌ ${contractName} API 提交失敗:`);
      console.log(`狀態: ${result.status}`);
      console.log(`錯誤: ${result.message}`);
      console.log(`結果: ${result.result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${contractName} API 呼叫失敗: ${error.message}`);
    return false;
  }
}

// 檢查驗證狀態
async function checkVerificationStatus(guid, contractName, apiKey) {
  console.log(`🔍 檢查 ${contractName} 驗證狀態 (GUID: ${guid})...`);
  
  for (let i = 0; i < 15; i++) { // 最多檢查 15 次
    await new Promise(resolve => setTimeout(resolve, 15000)); // 等待 15 秒
    
    try {
      const response = await fetch(`https://api.bscscan.com/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`);
      const result = await response.json();
      
      console.log(`📊 第 ${i + 1} 次檢查: ${result.result}`);
      
      if (result.result === 'Pass - Verified') {
        console.log(`🎉 ${contractName} 驗證成功！`);
        return true;
      } else if (result.result && result.result.includes('Fail')) {
        console.log(`❌ ${contractName} 驗證失敗: ${result.result}`);
        return false;
      }
      // 否則繼續等待 (Pending 狀態)
    } catch (error) {
      console.log(`⚠️ 檢查狀態時發生錯誤: ${error.message}`);
    }
  }
  
  console.log(`⏰ ${contractName} 驗證超時，請手動檢查 BSCScan`);
  return false;
}

async function main() {
  console.log("🚀 開始全自動 BSCScan API 驗證...\n");
  console.log("📋 檢查環境:");
  console.log(`- API Key: ${process.env.BSCSCAN_API_KEY ? '✅ 已設置' : '❌ 未設置'}`);
  console.log("");
  
  // 檢查 flatten 檔案是否存在
  if (!fs.existsSync('./DungeonCore_flat_clean.sol')) {
    console.log("❌ 找不到 DungeonCore_flat_clean.sol 檔案");
    return;
  }
  
  if (!fs.existsSync('./Oracle_flat_clean.sol')) {
    console.log("❌ 找不到 Oracle_flat_clean.sol 檔案");
    return;
  }
  
  // 讀取 flatten 檔案
  console.log("📁 讀取原始碼檔案...");
  const dungeonCoreSource = fs.readFileSync('./DungeonCore_flat_clean.sol', 'utf8');
  const oracleSource = fs.readFileSync('./Oracle_flat_clean.sol', 'utf8');
  
  console.log(`- DungeonCore 原始碼: ${dungeonCoreSource.length} 字元`);
  console.log(`- Oracle 原始碼: ${oracleSource.length} 字元`);
  console.log("");
  
  // 構造參數（已驗證正確的 ABI 編碼，不含 0x）
  const dungeonCoreArgs = "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a";
  const oracleArgs = "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955";
  
  // 驗證 DungeonCore
  const dungeonCoreSuccess = await verifyWithAPI(
    "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    dungeonCoreSource,
    "DungeonCore",
    dungeonCoreArgs,
    "v0.8.20+commit.a1b79de6"
  );
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  // 等待 60 秒再驗證下一個（避免 rate limit）
  console.log("⏳ 等待 60 秒再驗證下一個合約...");
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // 驗證 Oracle
  const oracleSuccess = await verifyWithAPI(
    "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    oracleSource,
    "Oracle", 
    oracleArgs,
    "v0.8.20+commit.a1b79de6"
  );
  
  // 總結
  console.log("\n" + "=".repeat(60));
  console.log("📊 驗證總結");
  console.log("=".repeat(60));
  console.log(`🏰 DungeonCore: ${dungeonCoreSuccess ? '✅ 成功' : '❌ 失敗'}`);
  console.log(`🔮 Oracle: ${oracleSuccess ? '✅ 成功' : '❌ 失敗'}`);
  
  if (dungeonCoreSuccess || oracleSuccess) {
    console.log("\n🎉 至少一個合約驗證成功！");
    console.log("查看結果:");
    if (dungeonCoreSuccess) {
      console.log("- DungeonCore: https://bscscan.com/address/0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5#code");
    }
    if (oracleSuccess) {
      console.log("- Oracle: https://bscscan.com/address/0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806#code");
    }
  } else {
    console.log("\n💡 如果自動驗證失敗，可能需要:");
    console.log("1. 檢查構造函數參數是否正確");
    console.log("2. 確認編譯器版本和優化設置");
    console.log("3. 手動在 BSCScan 上驗證");
  }
}

main()
  .then(() => {
    console.log("\n✅ 腳本執行完成");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 腳本執行失敗:", error);
    process.exit(1);
  });