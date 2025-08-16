// 終極驗證解決方案 - 修正所有編譯錯誤
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

// 使用修正後的扁平化文件
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955",
    flattenedFile: "Oracle_Fixed_Final.sol",
    contractName: "Oracle"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a",
    flattenedFile: "DungeonCore_Fixed_Final.sol",
    contractName: "DungeonCore"
  }
};

// 讀取修正後源碼
function readFixedSource(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fixed file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// 終極驗證函數
async function ultimateVerify(name, contractInfo) {
  try {
    log(`\n🎯 終極驗證 ${name}...`, 'magenta');
    
    const sourceCode = readFixedSource(contractInfo.flattenedFile);
    log(`📁 讀取修正源碼: ${contractInfo.flattenedFile}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
    // 檢查源碼開頭
    const lines = sourceCode.split('\n').slice(0, 3);
    log(`🔍 前三行檢查:`, 'cyan');
    lines.forEach((line, i) => {
      log(`   ${i+1}: ${line.substring(0, 60)}${line.length > 60 ? '...' : ''}`, 'cyan');
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
    
    log(`🚀 提交終極驗證請求...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ 終極驗證請求已提交，GUID: ${guid}`, 'green');
      return await checkUltimateStatus(name, guid);
    } else {
      log(`❌ 提交失敗: ${response.data.message}`, 'red');
      log(`📋 完整響應: ${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} 終極驗證出錯: ${error.message}`, 'red');
    if (error.response) {
      log(`   HTTP狀態: ${error.response.status}`, 'red');
      log(`   響應數據: ${JSON.stringify(error.response.data).substring(0, 500)}`, 'red');
    }
    return false;
  }
}

// 檢查終極驗證狀態
async function checkUltimateStatus(name, guid, maxAttempts = 15) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log(`⏳ 檢查 ${name} 終極驗證狀態 (${attempt}/${maxAttempts})...`, 'yellow');
      
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
        log(`🎉 ${name} 終極驗證成功！`, 'green');
        return true;
      } else if (response.data.result === 'Pending in queue') {
        log(`⏳ ${name} 排隊中，等待 15 秒...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        log(`❌ ${name} 終極驗證失敗: ${response.data.result}`, 'red');
        
        // 提供詳細的失敗信息
        if (response.data.result.includes('Compilation Error')) {
          log(`🔍 編譯錯誤詳情: ${response.data.result}`, 'red');
        }
        
        return false;
      }
      
    } catch (error) {
      log(`⚠️  檢查狀態出錯: ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  log(`⏰ ${name} 終極驗證超時`, 'red');
  return false;
}

async function main() {
  log('\n🏆 終極驗證解決方案 - 100% 開源透明度', 'magenta');
  log('='.repeat(60), 'magenta');
  
  // 檢查修正後文件
  for (const [name, info] of Object.entries(contracts)) {
    const filePath = path.join(__dirname, '..', info.flattenedFile);
    if (!fs.existsSync(filePath)) {
      log(`❌ 修正後文件不存在: ${info.flattenedFile}`, 'red');
      process.exit(1);
    }
    log(`✅ 找到修正後文件: ${info.flattenedFile}`, 'green');
  }
  
  const results = [];
  let totalSuccess = 0;
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    log(`\n${'='.repeat(40)}`, 'cyan');
    log(`開始處理: ${name}`, 'cyan');
    log(`地址: ${contractInfo.address}`, 'cyan');
    log(`${'='.repeat(40)}`, 'cyan');
    
    const verified = await ultimateVerify(name, contractInfo);
    results.push({ name, verified, address: contractInfo.address });
    
    if (verified) {
      totalSuccess++;
      log(`🎊 ${name} 成功加入開源透明名單！`, 'green');
    }
    
    // 更長等待時間避免 rate limit
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 25 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 25000));
    }
  }
  
  // 終極總結
  log('\n' + '='.repeat(60), 'magenta');
  log('🏆 終極驗證總結報告', 'magenta');
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
  }
  
  const percentage = ((totalSuccess / results.length) * 100).toFixed(1);
  log(`\n📊 開源進度: ${totalSuccess}/${results.length} (${percentage}%)`, 'cyan');
  
  if (totalSuccess === results.length) {
    log('\n🚀🚀🚀 恭喜！DungeonDelvers 達成 100% 開源透明度！ 🚀🚀🚀', 'green');
    log('🌟 這是 Web3 透明度的里程碑！', 'green');
    log('✨ 所有玩家現在都可以檢視和驗證合約代碼！', 'green');
  } else {
    log(`\n🎯 距離 100% 透明度還差 ${failed.length} 個合約`, 'yellow');
    log('💪 繼續努力，勝利就在前方！', 'yellow');
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
    console.error('💥 終極驗證遇到意外錯誤:', error);
    process.exit(1);
  });