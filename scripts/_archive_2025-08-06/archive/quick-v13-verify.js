// 快速 V13 驗證腳本
const axios = require('axios');
const fs = require('fs');

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

// V13 關鍵合約
const contracts = {
  Oracle: {
    address: "0x5BE782700EEcB5aeb1bF3AABA26a8A5c395112Da",
    constructorParams: "000000000000000000000000737c5b0430d5aeb104680460179aaa38608b61690000000000000000000000007301baea6ba609dd0a400d5b93b9293a2d03180a00000000000000000000000055d398326f99059ff775485246999027b3197955",
    flattenedFile: "Oracle_V13_Manual.sol",
    contractName: "Oracle"
  },
  DungeonCore: {
    address: "0x71c8f870FA4FD1c6820E7636d7C7de2296DAAC52", 
    constructorParams: "00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b31979550000000000000000000000007301baea6ba609dd0a400d5b93b9293a2d03180a",
    flattenedFile: "DungeonCore_V13_Manual.sol",
    contractName: "DungeonCore"
  }
};

async function quickVerify(name, contractInfo) {
  try {
    log(`\n🎯 快速驗證 V13 ${name}...`, 'magenta');
    
    const sourceCode = fs.readFileSync(contractInfo.flattenedFile, 'utf8');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
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
    
    log(`🚀 提交 V13 ${name} 驗證...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ V13 ${name} 驗證已提交，GUID: ${guid}`, 'green');
      return guid;
    } else {
      log(`❌ V13 ${name} 提交失敗: ${response.data.message}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ V13 ${name} 驗證出錯: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🏆 V13 快速驗證 - 內聯接口策略測試', 'magenta');
  log('='.repeat(60), 'magenta');
  
  const results = [];
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    const result = await quickVerify(name, contractInfo);
    results.push({ name, result, address: contractInfo.address });
    
    if (result) {
      log(`📋 ${name} 驗證 GUID: ${result}`, 'cyan');
      log(`🔗 查看: https://bscscan.com/address/${contractInfo.address}`, 'cyan');
    }
    
    // 等待避免 rate limit
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 30 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  log('\n' + '='.repeat(60), 'magenta');
  log('🏆 V13 快速驗證完成', 'magenta');
  log('='.repeat(60), 'magenta');
  
  const submitted = results.filter(r => r.result !== false).length;
  log(`📊 提交狀態: ${submitted}/${results.length} 個合約已提交驗證`, 'cyan');
  
  if (submitted > 0) {
    log('\n🎯 請等待 1-2 分鐘後檢查驗證結果:', 'green');
    results.filter(r => r.result !== false).forEach(r => {
      log(`   🔗 ${r.name}: https://bscscan.com/address/${r.address}`, 'green');
    });
    
    log('\n✨ 如果驗證成功，這證明 V13 內聯接口策略有效！', 'green');
  }
  
  log('\n📝 後續任務:', 'cyan');
  log('  1️⃣  檢查驗證結果', 'yellow');
  log('  2️⃣  整理專案資料夾', 'yellow');
  log('  3️⃣  更新環境變數', 'yellow');
  log('  4️⃣  功能測試', 'yellow');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V13 快速驗證出錯:', error);
    process.exit(1);
  });