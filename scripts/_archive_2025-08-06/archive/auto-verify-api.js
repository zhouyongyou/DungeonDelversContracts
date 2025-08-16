// 使用 BSCScan API 直接自動驗證
const { ethers } = require("hardhat");
const fs = require('fs');
require('dotenv').config();

// BSCScan API 驗證函數
async function verifyWithAPI(contractAddress, sourceCode, contractName, constructorArgs, compilerVersion) {
  const apiKey = process.env.BSCSCAN_API_KEY;
  
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
    constructorArguements: constructorArgs, // 注意：BSCScan API 的拼寫是 "Arguements"
    evmversion: '',
    licenseType: '3', // MIT
    libraryname1: '',
    libraryaddress1: '',
    libraryname2: '',
    libraryaddress2: '',
    libraryname3: '',
    libraryaddress3: '',
    libraryname4: '',
    libraryaddress4: '',
    libraryname5: '',
    libraryaddress5: '',
    libraryname6: '',
    libraryaddress6: '',
    libraryname7: '',
    libraryaddress7: '',
    libraryname8: '',
    libraryaddress8: '',
    libraryname9: '',
    libraryaddress9: '',
    libraryname10: '',
    libraryaddress10: ''
  });

  console.log(`🚀 開始 API 驗證 ${contractName}...`);
  console.log(`📍 地址: ${contractAddress}`);
  console.log(`🔧 編譯器: ${compilerVersion}`);
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
      console.log(`✅ ${contractName} API 提交成功！`);
      console.log(`📋 GUID: ${result.result}`);
      
      // 檢查驗證狀態
      await checkVerificationStatus(result.result, contractName, apiKey);
      return true;
    } else {
      console.log(`❌ ${contractName} API 提交失敗:`);
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
  console.log(`🔍 檢查 ${contractName} 驗證狀態...`);
  
  for (let i = 0; i < 20; i++) { // 最多檢查 20 次
    await new Promise(resolve => setTimeout(resolve, 10000)); // 等待 10 秒
    
    try {
      const response = await fetch(`https://api.bscscan.com/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`);
      const result = await response.json();
      
      console.log(`📊 第 ${i + 1} 次檢查: ${result.result}`);
      
      if (result.result === 'Pass - Verified') {
        console.log(`🎉 ${contractName} 驗證成功！`);
        return true;
      } else if (result.result.includes('Fail')) {
        console.log(`❌ ${contractName} 驗證失敗: ${result.result}`);
        return false;
      }
      // 否則繼續等待
    } catch (error) {
      console.log(`⚠️ 檢查狀態時發生錯誤: ${error.message}`);
    }
  }
  
  console.log(`⏰ ${contractName} 驗證超時，請手動檢查`);
  return false;
}

async function main() {
  console.log("🚀 開始全自動 BSCScan API 驗證...\n");
  
  // 讀取 flatten 檔案
  const dungeonCoreSource = fs.readFileSync('./DungeonCore_flat.sol', 'utf8');
  const oracleSource = fs.readFileSync('./Oracle_flat.sol', 'utf8');
  
  // 構造參數（已驗證正確的 ABI 編碼）
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
  
  // 等待 30 秒再驗證下一個
  console.log("⏳ 等待 30 秒再驗證下一個合約...");
  await new Promise(resolve => setTimeout(resolve, 30000));
  
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
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });