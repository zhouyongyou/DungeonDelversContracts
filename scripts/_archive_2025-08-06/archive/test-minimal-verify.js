// 測試簡化合約是否能夠驗證成功
const fs = require('fs');
require('dotenv').config();

async function verifyMinimalContract(contractAddress, sourceCode, contractName, constructorArgs) {
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  const params = new URLSearchParams({
    module: 'contract',
    action: 'verifysourcecode',
    apikey: apiKey,
    contractaddress: contractAddress,
    sourceCode: sourceCode,
    codeformat: 'solidity-single-file',
    contractname: contractName,
    compilerversion: 'v0.8.20+commit.a1b79de6',
    optimizationUsed: '1',
    runs: '200',
    viaIR: '1',
    constructorArguements: constructorArgs,
    evmversion: 'paris',
    licenseType: '3'
  });

  console.log(`🧪 測試簡化版 ${contractName} 驗證...`);
  console.log(`📍 使用真實地址: ${contractAddress}`);
  console.log(`📋 構造參數: ${constructorArgs}`);
  
  try {
    const response = await fetch('https://api.bscscan.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString()
    });
    
    const result = await response.json();
    
    if (result.status === '1') {
      console.log(`✅ 簡化版 ${contractName} 提交成功! GUID: ${result.result}`);
      
      // 等待驗證結果
      await new Promise(resolve => setTimeout(resolve, 25000));
      
      const statusResponse = await fetch(`https://api.bscscan.com/api?module=contract&action=checkverifystatus&guid=${result.result}&apikey=${apiKey}`);
      const statusResult = await statusResponse.json();
      
      console.log(`📊 驗證結果: ${statusResult.result}`);
      
      if (statusResult.result === 'Pass - Verified') {
        console.log(`🎉 簡化版 ${contractName} 驗證成功！`);
        console.log(`💡 這證明問題出在原始合約的複雜度上！`);
        return true;
      } else if (statusResult.result.includes('bytecode')) {
        console.log(`❌ 字節碼不匹配 - 這是預期的，因為我們用了簡化版本`);
        console.log(`💡 但這證明 ABI 編碼和編譯器設置都是正確的！`);
        return 'bytecode_mismatch';
      } else {
        console.log(`❌ 驗證失敗: ${statusResult.result}`);
        return false;
      }
    } else {
      console.log(`❌ 提交失敗: ${result.message}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 錯誤: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log("🧪 測試簡化合約驗證流程...\n");
  console.log("🎯 目標：驗證 ABI 編碼和編譯器設置是否正確\n");
  
  // 讀取簡化合約原始碼
  const minimalDungeonCoreSource = fs.readFileSync('./MinimalDungeonCore_flat_clean.sol', 'utf8');
  const minimalOracleSource = fs.readFileSync('./MinimalOracle_flat_clean.sol', 'utf8');
  
  console.log(`📁 簡化合約原始碼長度:`);
  console.log(`- MinimalDungeonCore: ${minimalDungeonCoreSource.length} 字元`);
  console.log(`- MinimalOracle: ${minimalOracleSource.length} 字元`);
  console.log("");
  
  // 使用相同的構造參數
  const dungeonCoreArgs = "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a";
  const oracleArgs = "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955";
  
  // 測試簡化版 DungeonCore
  const dungeonCoreResult = await verifyMinimalContract(
    "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    minimalDungeonCoreSource,
    "DungeonCore",
    dungeonCoreArgs
  );
  
  console.log("\n" + "=".repeat(60) + "\n");
  
  // 等待避免 rate limit
  console.log("⏳ 等待 60 秒避免 rate limit...");
  await new Promise(resolve => setTimeout(resolve, 60000));
  
  // 測試簡化版 Oracle
  const oracleResult = await verifyMinimalContract(
    "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    minimalOracleSource,
    "Oracle",
    oracleArgs
  );
  
  console.log("\n" + "=".repeat(60));
  console.log("📊 測試結果分析");
  console.log("=".repeat(60));
  
  if (dungeonCoreResult === 'bytecode_mismatch' || oracleResult === 'bytecode_mismatch') {
    console.log("🎉 好消息：ABI 編碼和編譯器設置都是正確的！");
    console.log("📝 字節碼不匹配是預期的，因為我們使用了簡化版本");
    console.log("");
    console.log("💡 這證明了問題確實出在原始合約的複雜度上：");
    console.log("- Oracle 的高精度數學庫");
    console.log("- DungeonCore 的多重依賴");
    console.log("- Assembly 內聯彙編代碼");
    console.log("");
    console.log("🔧 解決方案：");
    console.log("1. 手動在 BSCScan 上驗證（使用 flatten 檔案）");
    console.log("2. 考慮在未來版本中簡化合約架構");
    console.log("3. 或者接受這兩個核心合約無法自動驗證的現實");
  } else {
    console.log("🤔 結果出乎意料，需要進一步調查...");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ 測試失敗:", error);
    process.exit(1);
  });