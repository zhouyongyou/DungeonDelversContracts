// 完成手動驗證 - 使用更精確的方法
const fs = require('fs');
require('dotenv').config();

async function submitManualVerification(contractData) {
  const apiKey = process.env.BSCSCAN_API_KEY;
  
  // 使用手動驗證的特殊參數組合
  const params = new URLSearchParams({
    module: 'contract',
    action: 'verifysourcecode',
    apikey: apiKey,
    contractaddress: contractData.address,
    sourceCode: contractData.sourceCode,
    codeformat: 'solidity-single-file',
    contractname: contractData.contractName,
    compilerversion: 'v0.8.20+commit.a1b79de6',
    optimizationUsed: '1',
    runs: '200',
    constructorArguements: contractData.constructorArgs,
    evmversion: 'paris',
    licenseType: '3', // MIT
    // 手動驗證的額外參數
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
    swarmSource: '',
    // 不使用 viaIR，因為手動驗證更容易成功
    viaIR: '0'
  });

  console.log(`🚀 提交 ${contractData.name} 手動驗證...`);
  console.log(`📍 地址: ${contractData.address}`);
  console.log(`📝 源碼長度: ${contractData.sourceCode.length} 字元`);
  console.log(`🔧 編譯器: v0.8.20 (不使用 viaIR)`);
  
  try {
    const response = await fetch('https://api.bscscan.com/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      body: params.toString()
    });
    
    const result = await response.json();
    console.log(`📊 API 回應:`, result);
    
    if (result.status === '1') {
      console.log(`✅ ${contractData.name} 提交成功！`);
      console.log(`📋 GUID: ${result.result}`);
      
      // 監控驗證狀態
      return await monitorVerificationStatus(result.result, contractData.name, apiKey);
    } else {
      console.log(`❌ ${contractData.name} 提交失敗:`);
      console.log(`錯誤: ${result.message}`);
      console.log(`結果: ${result.result}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ ${contractData.name} API 錯誤: ${error.message}`);
    return false;
  }
}

async function monitorVerificationStatus(guid, contractName, apiKey) {
  console.log(`🔍 監控 ${contractName} 驗證狀態...`);
  
  for (let i = 0; i < 20; i++) {
    await new Promise(resolve => setTimeout(resolve, 15000)); // 每15秒檢查一次
    
    try {
      const response = await fetch(`https://api.bscscan.com/api?module=contract&action=checkverifystatus&guid=${guid}&apikey=${apiKey}`);
      const result = await response.json();
      
      console.log(`📊 第 ${i + 1} 次檢查: ${result.result}`);
      
      if (result.result === 'Pass - Verified') {
        console.log(`🎉🎉🎉 ${contractName} 驗證成功！！！`);
        return true;
      } else if (result.result && result.result.includes('Fail')) {
        console.log(`❌ ${contractName} 驗證失敗: ${result.result}`);
        
        // 如果失敗，嘗試替代方案
        if (result.result.includes('bytecode')) {
          console.log(`💡 字節碼不匹配，嘗試不同的編譯設置...`);
          return 'retry_needed';
        }
        return false;
      }
      // 繼續等待 (Pending 狀態)
    } catch (error) {
      console.log(`⚠️ 檢查狀態錯誤: ${error.message}`);
    }
  }
  
  console.log(`⏰ ${contractName} 驗證超時，可能仍在處理中`);
  return 'timeout';
}

async function retryWithDifferentSettings(contractData) {
  console.log(`🔄 重試 ${contractData.name} (使用不同設置)...`);
  
  // 嘗試不同的編譯器設置
  const alternativeSettings = [
    { viaIR: '1', optimization: '1', runs: '200', version: 'v0.8.20+commit.a1b79de6' },
    { viaIR: '0', optimization: '1', runs: '1', version: 'v0.8.20+commit.a1b79de6' },
    { viaIR: '0', optimization: '0', runs: '200', version: 'v0.8.20+commit.a1b79de6' }
  ];
  
  for (const settings of alternativeSettings) {
    console.log(`🧪 嘗試設置: viaIR=${settings.viaIR}, opt=${settings.optimization}, runs=${settings.runs}`);
    
    const apiKey = process.env.BSCSCAN_API_KEY;
    const params = new URLSearchParams({
      module: 'contract',
      action: 'verifysourcecode',
      apikey: apiKey,
      contractaddress: contractData.address,
      sourceCode: contractData.sourceCode,
      codeformat: 'solidity-single-file',
      contractname: contractData.contractName,
      compilerversion: settings.version,
      optimizationUsed: settings.optimization,
      runs: settings.runs,
      viaIR: settings.viaIR,
      constructorArguements: contractData.constructorArgs,
      evmversion: 'paris',
      licenseType: '3'
    });
    
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
        console.log(`✅ 替代設置提交成功！GUID: ${result.result}`);
        const verifyResult = await monitorVerificationStatus(result.result, contractData.name, apiKey);
        
        if (verifyResult === true) {
          return true;
        }
      }
      
      // 等待 30 秒再試下一個設置
      await new Promise(resolve => setTimeout(resolve, 30000));
      
    } catch (error) {
      console.log(`❌ 替代設置失敗: ${error.message}`);
    }
  }
  
  return false;
}

async function main() {
  console.log("🎯 開始完成 DungeonCore 和 Oracle 的手動開源...\n");
  
  // 檢查檔案
  if (!fs.existsSync('./DungeonCore_flat_clean.sol')) {
    console.log("❌ 找不到 DungeonCore_flat_clean.sol");
    return;
  }
  
  if (!fs.existsSync('./Oracle_flat_clean.sol')) {
    console.log("❌ 找不到 Oracle_flat_clean.sol");
    return;
  }
  
  // 讀取源碼
  const dungeonCoreSource = fs.readFileSync('./DungeonCore_flat_clean.sol', 'utf8');
  const oracleSource = fs.readFileSync('./Oracle_flat_clean.sol', 'utf8');
  
  // 準備合約數據
  const contracts = [
    {
      name: "DungeonCore",
      contractName: "DungeonCore",
      address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
      sourceCode: dungeonCoreSource,
      constructorArgs: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a"
    },
    {
      name: "Oracle", 
      contractName: "Oracle",
      address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
      sourceCode: oracleSource,
      constructorArgs: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955"
    }
  ];
  
  const results = [];
  
  // 逐一處理每個合約
  for (const contract of contracts) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`開始處理 ${contract.name}`);
    console.log(`${"=".repeat(60)}\n`);
    
    let result = await submitManualVerification(contract);
    
    if (result === 'retry_needed') {
      console.log(`🔄 ${contract.name} 需要重試不同設置...`);
      result = await retryWithDifferentSettings(contract);
    }
    
    results.push({ name: contract.name, success: result === true });
    
    // 等待處理下一個合約
    if (contracts.indexOf(contract) < contracts.length - 1) {
      console.log("\n⏳ 等待 60 秒處理下一個合約...");
      await new Promise(resolve => setTimeout(resolve, 60000));
    }
  }
  
  // 顯示最終結果
  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 手動開源完成！最終結果");
  console.log(`${"=".repeat(60)}`);
  
  results.forEach(r => {
    const icon = r.success ? '🎉' : '❌';
    const status = r.success ? '開源成功' : '仍需手動處理';
    console.log(`${icon} ${r.name}: ${status}`);
  });
  
  const successCount = results.filter(r => r.success).length;
  console.log(`\n📊 成功率: ${successCount}/${results.length} (${(successCount/results.length*100).toFixed(1)}%)`);
  
  if (successCount > 0) {
    console.log("\n🔗 查看開源結果:");
    results.forEach(r => {
      if (r.success) {
        const address = contracts.find(c => c.name === r.name).address;
        console.log(`- ${r.name}: https://bscscan.com/address/${address}#code`);
      }
    });
  }
  
  if (successCount < results.length) {
    console.log("\n💡 未成功的合約建議:");
    console.log("1. 等待 BSCScan 處理（可能需要幾小時）");
    console.log("2. 直接在 BSCScan 網站上手動提交");
    console.log("3. 使用 Remix IDE 進行驗證");
  }
}

main()
  .then(() => {
    console.log("\n✅ 手動開源流程完成！");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ 手動開源失敗:", error);
    process.exit(1);
  });