// 清理配置後的驗證解決方案
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC';
const BSCSCAN_API_URL = 'https://api.bscscan.com/api';

// 使用清理配置後重新生成的扁平化文件
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955",
    flattenedFile: "Oracle_CleanConfig.sol",
    contractName: "Oracle"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a",
    flattenedFile: "DungeonCore_CleanConfig.sol",
    contractName: "DungeonCore"
  }
};

// 讀取清理後源碼
function readCleanSource(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Clean file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// 清理配置驗證函數
async function cleanConfigVerify(name, contractInfo) {
  try {
    log(`\n🧹 清理配置驗證 ${name}...`, 'magenta');
    
    const sourceCode = readCleanSource(contractInfo.flattenedFile);
    log(`📁 讀取清理源碼: ${contractInfo.flattenedFile}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
    // 檢查源碼開頭確保沒有污染
    const lines = sourceCode.split('\n').slice(0, 5);
    log(`🔍 源碼純淨度檢查:`, 'cyan');
    lines.forEach((line, i) => {
      if (line.trim()) {
        log(`   ${i+1}: ${line.substring(0, 70)}${line.length > 70 ? '...' : ''}`, 'cyan');
      }
    });
    
    // 確保沒有中文字符
    const hasChinese = /[\u4e00-\u9fa5]/.test(sourceCode.substring(0, 500));
    if (hasChinese) {
      log(`⚠️  警告: 源碼前 500 字符中仍包含中文`, 'yellow');
    } else {
      log(`✅ 源碼前 500 字符純淨，無中文污染`, 'green');
    }
    
    const data = {
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractInfo.address,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: contractInfo.contractName,
      compilerversion: 'v0.8.20+commit.a1b79de6',
      optimizationUsed: '1',
      runs: '200',
      constructorArguements: contractInfo.constructorParams,
      apikey: BSCSCAN_API_KEY
    };
    
    log(`🚀 提交清理配置驗證請求...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ 清理配置驗證請求已提交，GUID: ${guid}`, 'green');
      return await checkCleanStatus(name, guid);
    } else {
      log(`❌ 提交失敗: ${response.data.message}`, 'red');
      log(`📋 完整響應:`, 'yellow');
      log(`${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} 清理配置驗證出錯: ${error.message}`, 'red');
    if (error.response) {
      log(`   HTTP狀態: ${error.response.status}`, 'red');
      log(`   響應數據: ${JSON.stringify(error.response.data).substring(0, 500)}`, 'red');
    }
    return false;
  }
}

// 檢查清理驗證狀態
async function checkCleanStatus(name, guid, maxAttempts = 20) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log(`⏳ 檢查 ${name} 清理驗證狀態 (${attempt}/${maxAttempts})...`, 'yellow');
      
      const response = await axios.get(BSCSCAN_API_URL, {
        params: {
          module: 'contract',
          action: 'checkverifystatus',
          guid: guid,
          apikey: BSCSCAN_API_KEY
        },
        timeout: 15000
      });
      
      if (response.data.status === '1') {
        log(`🎉 ${name} 清理配置驗證成功！配置污染問題已解決！`, 'green');
        return true;
      } else if (response.data.result === 'Pending in queue') {
        log(`⏳ ${name} 排隊中，等待 15 秒...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        log(`❌ ${name} 清理配置驗證失敗: ${response.data.result}`, 'red');
        
        // 詳細分析失敗原因
        if (response.data.result.includes('bytecode')) {
          log(`🔍 Bytecode 問題分析:`, 'red');
          log(`   可能原因: viaIR 設定或其他編譯參數不匹配`, 'red');
          log(`   建議: 考慮修改 hardhat.config.ts 中的 viaIR 設定`, 'yellow');
        }
        
        if (response.data.result.includes('Compilation Error')) {
          log(`🔍 編譯錯誤分析:`, 'red');
          log(`   ${response.data.result}`, 'red');
        }
        
        return false;
      }
      
    } catch (error) {
      log(`⚠️  檢查狀態出錯: ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  log(`⏰ ${name} 清理配置驗證超時`, 'red');
  return false;
}

async function main() {
  log('\n🧹 清理配置驗證解決方案', 'magenta');
  log('='.repeat(60), 'magenta');
  
  log('\n📋 修正內容:', 'cyan');
  log('✅ 移除 hardhat.config.ts 中的 console.log 污染', 'green');
  log('✅ 重新生成純淨的扁平化源碼', 'green');
  log('✅ 使用與部署時相同的編譯設定', 'green');
  
  // 檢查清理後文件
  for (const [name, info] of Object.entries(contracts)) {
    const filePath = path.join(__dirname, '..', info.flattenedFile);
    if (!fs.existsSync(filePath)) {
      log(`❌ 清理後文件不存在: ${info.flattenedFile}`, 'red');
      process.exit(1);
    }
    log(`✅ 找到清理後文件: ${info.flattenedFile}`, 'green');
  }
  
  const results = [];
  let totalSuccess = 0;
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    log(`\n${'='.repeat(50)}`, 'cyan');
    log(`清理配置驗證: ${name}`, 'cyan');
    log(`地址: ${contractInfo.address}`, 'cyan');
    log(`${'='.repeat(50)}`, 'cyan');
    
    const verified = await cleanConfigVerify(name, contractInfo);
    results.push({ name, verified, address: contractInfo.address });
    
    if (verified) {
      totalSuccess++;
      log(`🎊 ${name} 清理配置驗證成功！`, 'green');
    } else {
      log(`😞 ${name} 仍需進一步處理`, 'red');
    }
    
    // 等待避免 rate limit
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 30 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  // 最終總結
  log('\n' + '='.repeat(60), 'magenta');
  log('🧹 清理配置驗證總結', 'magenta');
  log('='.repeat(60), 'magenta');
  
  if (totalSuccess > 0) {
    log('\n🎉 成功驗證的合約:', 'green');
    results.filter(r => r.verified).forEach(r => {
      log(`   🔥 ${r.name}: https://bscscan.com/address/${r.address}`, 'green');
    });
  }
  
  const failed = results.filter(r => !r.verified);
  if (failed.length > 0) {
    log('\n💔 仍需處理的合約:', 'red');
    failed.forEach(r => {
      log(`   😞 ${r.name}: https://bscscan.com/address/${r.address}`, 'red');
    });
    
    log('\n🔍 如果清理配置後仍然失敗，最終建議:', 'yellow');
    log('   1. 檢查 viaIR 設定是否與部署時一致', 'yellow');
    log('   2. 確認所有編譯參數完全匹配', 'yellow');
    log('   3. 考慮 V13 重新部署使用內聯接口版本', 'yellow');
  }
  
  const percentage = ((totalSuccess / results.length) * 100).toFixed(1);
  log(`\n📊 開源進度: ${totalSuccess}/${results.length} (${percentage}%)`, 'cyan');
  
  if (totalSuccess === results.length) {
    log('\n🚀🚀🚀 恭喜！清理配置解決了驗證問題！ 🚀🚀🚀', 'green');
    log('🌟 DungeonDelvers 達成 100% 開源透明度！', 'green');
    log('✨ 配置污染問題已完全解決！', 'green');
  } else if (totalSuccess > 0) {
    log('\n🎯 部分成功！清理配置確實有效果', 'green');
    log('💪 剩餘問題可能需要更深入的配置調整', 'yellow');
  } else {
    log('\n🔧 需要考慮其他解決策略', 'yellow');
    log('📋 建議進行 V13 重新部署', 'yellow');
  }
  
  log('\n🔗 所有合約鏈接:', 'cyan');
  results.forEach(r => {
    const status = r.verified ? '✅' : '❌';
    const emoji = r.verified ? '🎊' : '🔧';
    log(`${status} ${emoji} ${r.name}: https://bscscan.com/address/${r.address}`, 'cyan');
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 清理配置驗證遇到意外錯誤:', error);
    process.exit(1);
  });