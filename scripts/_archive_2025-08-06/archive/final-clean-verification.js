// 最終乾淨驗證解決方案
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

// 需要驗證的合約 - 使用乾淨的扁平化文件
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955",
    flattenedFile: "Oracle_Final_Clean.sol",
    contractName: "Oracle"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a",
    flattenedFile: "DungeonCore_Final_Clean.sol",
    contractName: "DungeonCore"
  }
};

// 讀取扁平化源碼
function readFlattenedSource(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Flattened file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// 使用乾淨扁平化源碼驗證
async function verifyWithCleanSource(name, contractInfo) {
  try {
    log(`\n🔄 使用乾淨扁平化源碼驗證 ${name}...`, 'yellow');
    
    const sourceCode = readFlattenedSource(contractInfo.flattenedFile);
    log(`📁 讀取乾淨源碼: ${contractInfo.flattenedFile}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
    // 檢查源碼開頭是否正確
    const firstLine = sourceCode.split('\n')[0];
    log(`🔍 檢查源碼開頭: ${firstLine.substring(0, 50)}...`, 'cyan');
    
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
    
    log(`📤 提交驗證請求...`, 'cyan');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ 驗證請求已提交，GUID: ${guid}`, 'green');
      return await checkVerificationStatus(name, guid);
    } else {
      log(`❌ 提交失敗: ${response.data.message}`, 'red');
      log(`📋 響應: ${JSON.stringify(response.data)}`, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} 驗證出錯: ${error.message}`, 'red');
    if (error.response) {
      log(`   HTTP狀態: ${error.response.status}`, 'red');
      log(`   響應: ${JSON.stringify(error.response.data).substring(0, 300)}`, 'red');
    }
    return false;
  }
}

// 檢查驗證狀態
async function checkVerificationStatus(name, guid, maxAttempts = 12) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log(`⏳ 檢查 ${name} 驗證狀態 (${attempt}/${maxAttempts})...`, 'yellow');
      
      const response = await axios.get(BSCSCAN_API_URL, {
        params: {
          module: 'contract',
          action: 'checkverifystatus',
          guid: guid,
          apikey: BSCSCAN_API_KEY
        }
      });
      
      if (response.data.status === '1') {
        log(`✅ ${name} 驗證成功！`, 'green');
        return true;
      } else if (response.data.result === 'Pending in queue') {
        log(`⏳ ${name} 排隊中，等待 15 秒...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        log(`❌ ${name} 驗證失敗: ${response.data.result}`, 'red');
        return false;
      }
      
    } catch (error) {
      log(`⚠️  檢查狀態出錯: ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  log(`⏰ ${name} 驗證超時`, 'red');
  return false;
}

async function main() {
  log('\n🚀 最終乾淨驗證解決方案', 'cyan');
  log('='.repeat(50), 'cyan');
  
  // 檢查乾淨扁平化文件是否存在
  for (const [name, info] of Object.entries(contracts)) {
    const filePath = path.join(__dirname, '..', info.flattenedFile);
    if (!fs.existsSync(filePath)) {
      log(`❌ 乾淨扁平化文件不存在: ${info.flattenedFile}`, 'red');
      process.exit(1);
    }
    log(`✅ 找到乾淨扁平化文件: ${info.flattenedFile}`, 'green');
  }
  
  const results = [];
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    const verified = await verifyWithCleanSource(name, contractInfo);
    results.push({ name, verified, address: contractInfo.address });
    
    // 等待避免 rate limit
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 20 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
  }
  
  // 總結
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 最終驗證總結', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const succeeded = results.filter(r => r.verified).length;
  const failed = results.filter(r => !r.verified).length;
  
  if (succeeded > 0) {
    log('\n✅ 驗證成功:', 'green');
    results.filter(r => r.verified).forEach(r => {
      log(`   ✅ ${r.name} (${r.address})`, 'green');
    });
  }
  
  if (failed > 0) {
    log('\n❌ 仍需處理:', 'red');
    results.filter(r => !r.verified).forEach(r => {
      log(`   ❌ ${r.name} (${r.address})`, 'red');
    });
  }
  
  log(`\n📈 結果: ${succeeded} 成功, ${failed} 失敗`, 'cyan');
  
  if (failed === 0) {
    log('\n🎉 所有合約驗證完成！項目達到 100% 開源透明度！', 'green');
    log('✨ DungeonDelvers 現在是完全透明的 Web3 項目！', 'green');
  }
  
  // 顯示所有合約鏈接
  log('\n🔗 合約瀏覽:', 'cyan');
  results.forEach(r => {
    const status = r.verified ? '✅' : '❌';
    log(`${status} ${r.name}: https://bscscan.com/address/${r.address}`, 'cyan');
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });