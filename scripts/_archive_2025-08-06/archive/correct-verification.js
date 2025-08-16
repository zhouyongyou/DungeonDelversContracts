// 正確驗證解決方案 - 使用真正部署的原版合約
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

// 使用真正部署的原版合約
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955",
    flattenedFile: "Oracle_Original_Clean.sol",
    contractName: "Oracle",
    originalPath: "contracts/defi/Oracle.sol"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a",
    flattenedFile: "DungeonCore_Original_Clean.sol",
    contractName: "DungeonCore",
    originalPath: "contracts/core/DungeonCore.sol"
  }
};

// 讀取原版源碼
function readOriginalSource(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Original file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// 正確驗證函數
async function correctVerify(name, contractInfo) {
  try {
    log(`\n🎯 正確驗證 ${name} (使用原版部署合約)...`, 'magenta');
    
    const sourceCode = readOriginalSource(contractInfo.flattenedFile);
    log(`📁 讀取原版源碼: ${contractInfo.flattenedFile}`, 'cyan');
    log(`🔗 對應部署合約: ${contractInfo.originalPath}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
    // 檢查源碼開頭確保正確
    const lines = sourceCode.split('\n').slice(0, 5);
    log(`🔍 源碼結構檢查:`, 'cyan');
    lines.forEach((line, i) => {
      if (line.trim()) {
        log(`   ${i+1}: ${line.substring(0, 70)}${line.length > 70 ? '...' : ''}`, 'cyan');
      }
    });
    
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
    
    log(`🚀 提交正確驗證請求...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ 正確驗證請求已提交，GUID: ${guid}`, 'green');
      return await checkCorrectStatus(name, guid);
    } else {
      log(`❌ 提交失敗: ${response.data.message}`, 'red');
      log(`📋 完整響應:`, 'yellow');
      log(`${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} 正確驗證出錯: ${error.message}`, 'red');
    if (error.response) {
      log(`   HTTP狀態: ${error.response.status}`, 'red');
      log(`   響應數據: ${JSON.stringify(error.response.data).substring(0, 500)}`, 'red');
    }
    return false;
  }
}

// 檢查正確驗證狀態
async function checkCorrectStatus(name, guid, maxAttempts = 20) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log(`⏳ 檢查 ${name} 正確驗證狀態 (${attempt}/${maxAttempts})...`, 'yellow');
      
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
        log(`🎉 ${name} 正確驗證成功！Bytecode 完全匹配！`, 'green');
        return true;
      } else if (response.data.result === 'Pending in queue') {
        log(`⏳ ${name} 排隊中，等待 15 秒...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        log(`❌ ${name} 正確驗證失敗: ${response.data.result}`, 'red');
        
        // 提供詳細的失敗信息
        if (response.data.result.includes('Compilation Error')) {
          log(`🔍 編譯錯誤詳情:`, 'red');
          log(`${response.data.result}`, 'red');
          
          // 如果是 import 相關錯誤，提供解決建議
          if (response.data.result.includes('import')) {
            log(`💡 建議: 這可能是 import 路徑問題，需要檢查相對路徑是否正確`, 'yellow');
          }
        }
        
        if (response.data.result.includes('bytecode')) {
          log(`🔍 Bytecode 不匹配詳情:`, 'red');
          log(`${response.data.result}`, 'red');
          log(`💡 這意味著源碼與實際部署的合約不匹配`, 'yellow');
        }
        
        return false;
      }
      
    } catch (error) {
      log(`⚠️  檢查狀態出錯: ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  log(`⏰ ${name} 正確驗證超時`, 'red');
  return false;
}

async function main() {
  log('\n🏆 正確驗證解決方案 - 使用真正部署的原版合約', 'magenta');
  log('='.repeat(70), 'magenta');
  
  log('\n📋 重要說明:', 'cyan');
  log('✅ 本次使用真正部署的原版合約進行驗證', 'green');
  log('✅ 已確認部署腳本中使用的合約路徑', 'green');
  log('✅ Bytecode 應該完全匹配', 'green');
  
  // 檢查原版扁平化文件
  for (const [name, info] of Object.entries(contracts)) {
    const filePath = path.join(__dirname, '..', info.flattenedFile);
    if (!fs.existsSync(filePath)) {
      log(`❌ 原版扁平化文件不存在: ${info.flattenedFile}`, 'red');
      process.exit(1);
    }
    log(`✅ 找到原版扁平化文件: ${info.flattenedFile}`, 'green');
  }
  
  const results = [];
  let totalSuccess = 0;
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    log(`\n${'='.repeat(50)}`, 'cyan');
    log(`開始處理: ${name}`, 'cyan');
    log(`部署地址: ${contractInfo.address}`, 'cyan');
    log(`原版路徑: ${contractInfo.originalPath}`, 'cyan');
    log(`${'='.repeat(50)}`, 'cyan');
    
    const verified = await correctVerify(name, contractInfo);
    results.push({ name, verified, address: contractInfo.address });
    
    if (verified) {
      totalSuccess++;
      log(`🎊 ${name} 成功通過正確驗證！`, 'green');
    } else {
      log(`😞 ${name} 驗證仍然失敗`, 'red');
    }
    
    // 更長等待時間避免 rate limit
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 30 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  // 最終總結
  log('\n' + '='.repeat(70), 'magenta');
  log('🏆 正確驗證總結報告', 'magenta');
  log('='.repeat(70), 'magenta');
  
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
    
    log('\n🔍 如果仍然失敗，可能的原因:', 'yellow');
    log('   1. 相對 import 路徑在扁平化時處理不當', 'yellow');
    log('   2. 編譯器設定或優化參數不匹配', 'yellow');
    log('   3. 需要考慮 V13 重新部署策略', 'yellow');
  }
  
  const percentage = ((totalSuccess / results.length) * 100).toFixed(1);
  log(`\n📊 開源進度: ${totalSuccess}/${results.length} (${percentage}%)`, 'cyan');
  
  if (totalSuccess === results.length) {
    log('\n🚀🚀🚀 恭喜！DungeonDelvers 達成 100% 開源透明度！ 🚀🚀🚀', 'green');
    log('🌟 問題解決！Import 路徑問題已克服！', 'green');
    log('✨ 所有玩家現在都可以檢視和驗證合約代碼！', 'green');
  } else {
    log(`\n🎯 如果正確驗證仍然失敗，建議考慮 V13 重新部署策略`, 'yellow');
    log('💪 使用完全乾淨的合約結構，避免 import 路徑問題', 'yellow');
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
    console.error('💥 正確驗證遇到意外錯誤:', error);
    process.exit(1);
  });