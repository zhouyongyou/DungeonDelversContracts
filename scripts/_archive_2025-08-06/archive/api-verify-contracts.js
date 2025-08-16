// 使用 BSCScan API 自動驗證合約 - 完全自動化
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 顏色輸出
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

// BSCScan API 配置
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY || '2SCSJI4VS27T3M2HGYTGEN5WJAJEMEJ2IC';
const BSCSCAN_API_URL = 'https://api.bscscan.com/api';

// 需要驗證的合約
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    contractName: "Oracle",
    sourcePath: "contracts/defi/Oracle.sol",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    contractName: "DungeonCore", 
    sourcePath: "contracts/core/DungeonCore.sol",
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a"
  }
};

// 收集所有依賴的合約源碼
function collectSources() {
  const sources = {};
  const contractsDir = path.join(__dirname, '..', 'contracts');
  
  // 遞歸讀取所有 .sol 文件
  function readSolFiles(dir, prefix = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        readSolFiles(filePath, prefix + file + '/');
      } else if (file.endsWith('.sol')) {
        const relativePath = prefix + file;
        const content = fs.readFileSync(filePath, 'utf8');
        sources[relativePath] = { content };
      }
    }
  }
  
  readSolFiles(contractsDir);
  return sources;
}

// 準備標準 JSON 輸入
function prepareStandardJson(contractName, sourcePath) {
  const sources = collectSources();
  
  const standardJson = {
    language: "Solidity",
    sources: sources,
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      },
      outputSelection: {
        "*": {
          "*": ["*"]
        }
      }
    }
  };
  
  return JSON.stringify(standardJson);
}

// 使用 BSCScan API 驗證合約
async function verifyWithAPI(name, contractInfo) {
  try {
    log(`\n🔄 使用 API 驗證 ${name}...`, 'yellow');
    
    const sourceCode = prepareStandardJson(contractInfo.contractName, contractInfo.sourcePath);
    
    const data = {
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: contractInfo.address,
      sourceCode: sourceCode,
      codeformat: 'solidity-standard-json-input',
      contractname: contractInfo.sourcePath + ':' + contractInfo.contractName,
      compilerversion: 'v0.8.20+commit.a1b79de6',
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
      
      // 等待驗證結果
      return await checkVerificationStatus(name, guid);
    } else {
      log(`❌ 提交失敗: ${response.data.message}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ API 驗證失敗: ${error.message}`, 'red');
    return false;
  }
}

// 檢查驗證狀態
async function checkVerificationStatus(name, guid, maxAttempts = 10) {
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

// 檢查合約是否已經驗證
async function checkIfAlreadyVerified(name, address) {
  try {
    const response = await axios.get(BSCSCAN_API_URL, {
      params: {
        module: 'contract',
        action: 'getsourcecode',
        address: address,
        apikey: BSCSCAN_API_KEY
      }
    });
    
    if (response.data.status === '1' && response.data.result[0].SourceCode !== '') {
      log(`✅ ${name} 已經驗證過了`, 'green');
      return true;
    }
    
    return false;
  } catch (error) {
    log(`⚠️  檢查驗證狀態失敗: ${error.message}`, 'yellow');
    return false;
  }
}

async function main() {
  log('\n🚀 自動化合約驗證 - API 方式', 'cyan');
  log('='.repeat(50), 'cyan');
  
  // 檢查源碼目錄
  const contractsDir = path.join(__dirname, '..', 'contracts');
  if (!fs.existsSync(contractsDir)) {
    log('❌ contracts 目錄不存在！', 'red');
    process.exit(1);
  }
  
  log(`📁 源碼目錄: ${contractsDir}`, 'cyan');
  log(`🔑 API Key: ${BSCSCAN_API_KEY.substring(0, 8)}...`, 'cyan');
  
  const results = [];
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    log(`\n\n🎯 開始驗證 ${name}`, 'magenta');
    log('-'.repeat(30), 'magenta');
    
    let verified = false;
    
    // 首先檢查是否已經驗證
    verified = await checkIfAlreadyVerified(name, contractInfo.address);
    
    // 如果未驗證，使用 BSCScan API 驗證
    if (!verified) {
      verified = await verifyWithAPI(name, contractInfo);
    }
    
    results.push({ name, verified, address: contractInfo.address });
    
    // 等待避免 rate limit
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 20 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 20000));
    }
  }
  
  // 總結
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 API 驗證總結', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const succeeded = results.filter(r => r.verified).length;
  const failed = results.filter(r => !r.verified).length;
  
  if (succeeded > 0) {
    log('\n✅ API 驗證成功:', 'green');
    results.filter(r => r.verified).forEach(r => {
      log(`   ✅ ${r.name} (${r.address})`, 'green');
    });
  }
  
  if (failed > 0) {
    log('\n❌ API 驗證失敗:', 'red');
    results.filter(r => !r.verified).forEach(r => {
      log(`   ❌ ${r.name} (${r.address})`, 'red');
    });
    
    log('\n💡 可能的解決方案:', 'yellow');
    log('1. 檢查構造參數是否正確', 'yellow');
    log('2. 確認編譯器版本匹配', 'yellow');
    log('3. 嘗試在 BSCScan 網頁上手動驗證', 'yellow');
    log('4. 使用 Sourcify 作為替代方案', 'yellow');
  }
  
  log(`\n📈 結果: ${succeeded} 成功, ${failed} 失敗`, 'cyan');
  
  if (failed === 0) {
    log('\n🎉 所有合約驗證完成！項目達到 100% 開源透明度！', 'green');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });