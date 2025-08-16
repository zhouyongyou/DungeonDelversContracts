// 測試選擇性編譯驗證效果
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

// V12 地址 + 選擇性編譯源碼
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955",
    flattenedFile: "Oracle_Selective_NoViaIR.sol",
    contractName: "Oracle"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a",
    flattenedFile: "DungeonCore_Selective_NoViaIR.sol", 
    contractName: "DungeonCore"
  }
};

// 快速驗證測試
async function quickVerifyTest(name, contractInfo) {
  try {
    log(`\n🧪 選擇性編譯測試 ${name}...`, 'magenta');
    
    const filePath = path.join(__dirname, '..', contractInfo.flattenedFile);
    if (!fs.existsSync(filePath)) {
      log(`❌ 文件不存在: ${contractInfo.flattenedFile}`, 'red');
      return false;
    }
    
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    log(`📁 選擇性編譯源碼: ${contractInfo.flattenedFile}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
    // 檢查純淨度
    const hasChinese = /[\u4e00-\u9fa5]/.test(sourceCode.substring(0, 500));
    log(`🔍 源碼純淨度: ${hasChinese ? '❌ 有中文' : '✅ 純淨'}`, hasChinese ? 'red' : 'green');
    
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
    
    log(`🚀 提交選擇性編譯驗證...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ 選擇性編譯驗證已提交，GUID: ${guid}`, 'green');
      
      // 快速檢查（只檢查 3 次）
      for (let i = 1; i <= 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        const statusResponse = await axios.get(BSCSCAN_API_URL, {
          params: {
            module: 'contract',
            action: 'checkverifystatus',
            guid: guid,
            apikey: BSCSCAN_API_KEY
          }
        });
        
        if (statusResponse.data.status === '1') {
          log(`🎉 ${name} 選擇性編譯驗證成功！`, 'green');
          return true;
        } else if (statusResponse.data.result !== 'Pending in queue') {
          log(`❌ ${name} 選擇性編譯驗證失敗: ${statusResponse.data.result}`, 'red');
          return false;
        }
        
        log(`⏳ ${name} 排隊中 (${i}/3)...`, 'yellow');
      }
      
      log(`⏰ ${name} 快速測試超時，但請求已提交`, 'yellow');
      return 'pending';
      
    } else {
      log(`❌ 選擇性編譯提交失敗: ${response.data.message}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} 選擇性編譯測試出錯: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🧪 選擇性編譯驗證測試', 'magenta');
  log('='.repeat(50), 'magenta');
  log('🎯 測試混合編譯策略是否解決驗證問題', 'cyan');
  log('='.repeat(50), 'magenta');
  
  const results = [];
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    const result = await quickVerifyTest(name, contractInfo);
    results.push({ name, result, address: contractInfo.address });
    
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 20 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
  }
  
  // 測試總結
  log('\n' + '='.repeat(50), 'magenta');
  log('🧪 選擇性編譯測試總結', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const success = results.filter(r => r.result === true).length;
  const pending = results.filter(r => r.result === 'pending').length;
  const failed = results.filter(r => r.result === false).length;
  
  if (success > 0) {
    log('\n🎉 選擇性編譯成功:', 'green');
    results.filter(r => r.result === true).forEach(r => {
      log(`   ✅ ${r.name}: https://bscscan.com/address/${r.address}`, 'green');
    });
  }
  
  if (pending > 0) {
    log('\n⏳ 處理中 (請稍後檢查):', 'yellow');
    results.filter(r => r.result === 'pending').forEach(r => {
      log(`   ⏳ ${r.name}: https://bscscan.com/address/${r.address}`, 'yellow');
    });
  }
  
  if (failed > 0) {
    log('\n❌ 仍然失敗:', 'red');
    results.filter(r => r.result === false).forEach(r => {
      log(`   ❌ ${r.name}: https://bscscan.com/address/${r.address}`, 'red');
    });
  }
  
  log(`\n📊 選擇性編譯測試結果: ${success} 成功, ${pending} 處理中, ${failed} 失敗`, 'cyan');
  
  if (success > 0) {
    log('\n🎯 選擇性編譯策略有效！', 'green');
    log('💡 建議：', 'cyan');
    log('   1. 如果全部成功 → V12 問題解決！', 'green');
    log('   2. 如果部分成功 → 策略正確，可用於 V13', 'green');
    log('   3. 如果仍然失敗 → 需要其他解決方案', 'yellow');
  } else if (pending > 0) {
    log('\n⏳ 請等待驗證完成後檢查結果', 'yellow');
    log('🔗 可直接到 BSCScan 查看驗證狀態', 'cyan');
  } else {
    log('\n🤔 選擇性編譯仍然無效', 'yellow');
    log('💡 建議進行 V13 完整重新部署', 'cyan');
  }
  
  log('\n🔗 所有合約鏈接:', 'cyan');
  results.forEach(r => {
    const status = r.result === true ? '✅' : r.result === 'pending' ? '⏳' : '❌';
    log(`${status} ${r.name}: https://bscscan.com/address/${r.address}`, 'cyan');
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 選擇性編譯測試出錯:', error);
    process.exit(1);
  });