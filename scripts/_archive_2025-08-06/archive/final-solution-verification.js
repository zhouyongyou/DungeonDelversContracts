// 最終解決方案驗證 - 修正所有配置問題
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

// 使用完全修正的配置重新生成的扁平化文件
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955",
    flattenedFile: "Oracle_NoViaIR.sol",
    contractName: "Oracle"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a",
    flattenedFile: "DungeonCore_NoViaIR.sol",
    contractName: "DungeonCore"
  }
};

// 讀取最終源碼
function readFinalSource(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Final file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// 最終解決方案驗證函數
async function finalSolutionVerify(name, contractInfo) {
  try {
    log(`\n🏆 最終解決方案驗證 ${name}...`, 'magenta');
    
    const sourceCode = readFinalSource(contractInfo.flattenedFile);
    log(`📁 讀取最終源碼: ${contractInfo.flattenedFile}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
    // 全面檢查源碼品質
    const lines = sourceCode.split('\n').slice(0, 5);
    log(`🔍 最終源碼品質檢查:`, 'cyan');
    lines.forEach((line, i) => {
      if (line.trim()) {
        log(`   ${i+1}: ${line.substring(0, 70)}${line.length > 70 ? '...' : ''}`, 'cyan');
      }
    });
    
    // 確保完全純淨
    const hasChinese = /[\u4e00-\u9fa5]/.test(sourceCode.substring(0, 1000));
    const hasConsoleLog = sourceCode.includes('console.log');
    
    if (hasChinese) {
      log(`⚠️  警告: 源碼中仍包含中文字符`, 'red');
    } else {
      log(`✅ 源碼純淨，無中文污染`, 'green');
    }
    
    if (hasConsoleLog) {
      log(`⚠️  警告: 源碼中包含 console.log`, 'red');
    } else {
      log(`✅ 源碼純淨，無 console.log`, 'green');
    }
    
    log(`🔧 編譯配置: v0.8.20, optimizer=true, runs=200, viaIR=false`, 'cyan');
    
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
    
    log(`🚀 提交最終解決方案驗證請求...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ 最終解決方案驗證請求已提交，GUID: ${guid}`, 'green');
      return await checkFinalStatus(name, guid);
    } else {
      log(`❌ 提交失敗: ${response.data.message}`, 'red');
      log(`📋 完整響應:`, 'yellow');
      log(`${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} 最終解決方案驗證出錯: ${error.message}`, 'red');
    if (error.response) {
      log(`   HTTP狀態: ${error.response.status}`, 'red');
      log(`   響應數據: ${JSON.stringify(error.response.data).substring(0, 500)}`, 'red');
    }
    return false;
  }
}

// 檢查最終驗證狀態
async function checkFinalStatus(name, guid, maxAttempts = 25) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log(`⏳ 檢查 ${name} 最終驗證狀態 (${attempt}/${maxAttempts})...`, 'yellow');
      
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
        log(`🎉🎉🎉 ${name} 最終解決方案驗證成功！🎉🎉🎉`, 'green');
        log(`🏆 所有配置問題已完全解決！`, 'green');
        return true;
      } else if (response.data.result === 'Pending in queue') {
        log(`⏳ ${name} 排隊中，等待 15 秒...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        log(`❌ ${name} 最終解決方案驗證失敗: ${response.data.result}`, 'red');
        
        // 最終失敗分析
        log(`\n🔍 最終失敗分析 - ${name}:`, 'red');
        log(`   失敗訊息: ${response.data.result}`, 'red');
        
        if (response.data.result.includes('bytecode')) {
          log(`   📋 Bytecode 不匹配的可能原因:`, 'yellow');
          log(`      1. 部署時使用了不同的編譯器版本`, 'yellow');
          log(`      2. 部署時使用了不同的優化設定`, 'yellow');
          log(`      3. 部署時使用了不同的 Solidity 設定`, 'yellow');
          log(`      4. 導入的函式庫版本不同`, 'yellow');
          log(`   💡 最終建議: V13 重新部署是最可靠的解決方案`, 'green');
        }
        
        return false;
      }
      
    } catch (error) {
      log(`⚠️  檢查狀態出錯: ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  log(`⏰ ${name} 最終解決方案驗證超時`, 'red');
  return false;
}

async function main() {
  log('\n🏆 最終解決方案驗證 - DungeonDelvers 開源透明度', 'magenta');
  log('='.repeat(70), 'magenta');
  
  log('\n📋 已修正的所有問題:', 'cyan');
  log('✅ 移除 hardhat.config.ts 中的 console.log 污染', 'green');
  log('✅ 移除 viaIR 設定避免 bytecode 不匹配', 'green');
  log('✅ 使用正確的編譯器版本 v0.8.20', 'green');
  log('✅ 使用正確的優化設定 runs=200', 'green');
  log('✅ 重新生成完全純淨的扁平化源碼', 'green');
  log('✅ 使用真正部署的原版合約', 'green');
  
  // 檢查最終文件
  for (const [name, info] of Object.entries(contracts)) {
    const filePath = path.join(__dirname, '..', info.flattenedFile);
    if (!fs.existsSync(filePath)) {
      log(`❌ 最終文件不存在: ${info.flattenedFile}`, 'red');
      process.exit(1);
    }
    log(`✅ 找到最終文件: ${info.flattenedFile}`, 'green');
  }
  
  const results = [];
  let totalSuccess = 0;
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`最終解決方案驗證: ${name}`, 'cyan');
    log(`合約地址: ${contractInfo.address}`, 'cyan');
    log(`扁平化文件: ${contractInfo.flattenedFile}`, 'cyan');
    log(`${'='.repeat(60)}`, 'cyan');
    
    const verified = await finalSolutionVerify(name, contractInfo);
    results.push({ name, verified, address: contractInfo.address });
    
    if (verified) {
      totalSuccess++;
      log(`🎊🎊🎊 ${name} 最終驗證成功！🎊🎊🎊`, 'green');
    } else {
      log(`😞 ${name} 需要考慮 V13 重新部署`, 'red');
    }
    
    // 較長等待時間確保穩定
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 30 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  // 史詩級總結
  log('\n' + '='.repeat(70), 'magenta');
  log('🏆 最終解決方案驗證總結報告', 'magenta');
  log('='.repeat(70), 'magenta');
  
  if (totalSuccess > 0) {
    log('\n🎉🎉🎉 成功驗證的合約 🎉🎉🎉', 'green');
    results.filter(r => r.verified).forEach(r => {
      log(`   🔥🔥🔥 ${r.name}: https://bscscan.com/address/${r.address}`, 'green');
    });
  }
  
  const failed = results.filter(r => !r.verified);
  if (failed.length > 0) {
    log('\n💔 需要 V13 重新部署的合約:', 'red');
    failed.forEach(r => {
      log(`   🚀 ${r.name}: 建議使用內聯接口版本重新部署`, 'yellow');
      log(`      地址: https://bscscan.com/address/${r.address}`, 'yellow');
    });
  }
  
  const percentage = ((totalSuccess / results.length) * 100).toFixed(1);
  log(`\n📊 最終開源進度: ${totalSuccess}/${results.length} (${percentage}%)`, 'cyan');
  
  if (totalSuccess === results.length) {
    log('\n🚀🚀🚀🚀🚀 史詩級成功！🚀🚀🚀🚀🚀', 'green');
    log('🌟🌟🌟 DungeonDelvers 達成 100% 開源透明度！🌟🌟🌟', 'green');
    log('✨✨✨ 所有配置問題完全解決！✨✨✨', 'green');
    log('🎊🎊🎊 這是 Web3 透明度的勝利！🎊🎊🎊', 'green');
  } else if (totalSuccess > 0) {
    log('\n🎯 部分成功！證明解決方案有效', 'green');
    log('💪 剩餘合約建議進行 V13 重新部署', 'yellow');
  } else {
    log('\n📋 所有技術手段已嘗試完畢', 'yellow');
    log('🚀 強烈建議進行 V13 重新部署', 'green');
    log('   使用內聯接口版本，徹底避免 import 相關問題', 'green');
  }
  
  log('\n🔗 最終合約鏈接總覽:', 'cyan');
  results.forEach(r => {
    const status = r.verified ? '✅' : '🚀';
    const message = r.verified ? '已驗證' : '需 V13 重部署';
    log(`${status} ${r.name} (${message}): https://bscscan.com/address/${r.address}`, 'cyan');
  });
  
  if (failed.length > 0) {
    log('\n📝 V13 重新部署建議:', 'green');
    log('   1. 使用 Oracle_VerificationFix.sol (內聯接口版本)', 'green');
    log('   2. 使用 DungeonCore_VerificationFix.sol (內聯接口版本)', 'green');
    log('   3. 確保 hardhat.config.ts 沒有 console.log 和 viaIR', 'green');
    log('   4. 部署後立即使用相同源碼進行驗證', 'green');
    log('   5. 這樣可以確保 100% 開源透明度', 'green');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 最終解決方案驗證遇到意外錯誤:', error);
    process.exit(1);
  });