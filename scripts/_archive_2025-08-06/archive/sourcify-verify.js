// 使用 Sourcify 自動驗證合約 - 最終解決方案
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

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

// 需要驗證的合約
const contracts = [
  {
    name: "Oracle",
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070"
  },
  {
    name: "DungeonCore", 
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB"
  }
];

// 收集所有源文件
function collectAllSources() {
  const sources = new Map();
  
  // 收集項目合約文件
  function readDirectory(dir, basePath = '') {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          readDirectory(filePath, path.join(basePath, file));
        }
      } else if (file.endsWith('.sol')) {
        const relativePath = path.join(basePath, file).replace(/\\/g, '/');
        const content = fs.readFileSync(filePath, 'utf8');
        sources.set(relativePath, content);
      }
    }
  }
  
  // 讀取 contracts 目錄
  const contractsDir = path.join(__dirname, '..', 'contracts');
  readDirectory(contractsDir, 'contracts');
  
  // 讀取關鍵的 OpenZeppelin 合約
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules', '@openzeppelin', 'contracts');
  if (fs.existsSync(nodeModulesPath)) {
    readDirectory(nodeModulesPath, '@openzeppelin/contracts');
  }
  
  return sources;
}

// 使用 Sourcify 驗證合約
async function verifyWithSourceify(contract) {
  try {
    log(`\n🌐 使用 Sourcify 驗證 ${contract.name}...`, 'yellow');
    
    const sources = collectAllSources();
    log(`📁 收集到 ${sources.size} 個源文件`, 'cyan');
    
    const formData = new FormData();
    formData.append('address', contract.address);
    formData.append('chain', '56'); // BSC Mainnet
    
    // 添加所有源文件
    let fileCount = 0;
    for (const [relativePath, content] of sources) {
      formData.append('files', Buffer.from(content), relativePath);
      fileCount++;
      
      if (fileCount <= 5) {
        log(`  📄 添加文件: ${relativePath}`, 'cyan');
      } else if (fileCount === 6) {
        log(`  📄 ... 總共 ${sources.size} 個文件`, 'cyan');
      }
    }
    
    log(`🚀 提交到 Sourcify...`, 'yellow');
    
    const response = await axios.post('https://sourcify.dev/server/verify', formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 120000 // 2分鐘超時
    });
    
    log(`📥 收到響應: ${response.status}`, 'cyan');
    
    if (response.data && response.data.result) {
      const results = Array.isArray(response.data.result) ? response.data.result : [response.data.result];
      
      for (const result of results) {
        if (result.address && result.address.toLowerCase() === contract.address.toLowerCase()) {
          if (result.status === 'perfect') {
            log(`✅ ${contract.name} 完美驗證成功！`, 'green');
            return true;
          } else if (result.status === 'partial') {
            log(`✅ ${contract.name} 部分驗證成功！`, 'green');
            return true;
          } else {
            log(`❌ ${contract.name} 驗證狀態: ${result.status}`, 'red');
          }
        }
      }
    }
    
    // 檢查是否已經在 Sourcify 中
    const checkResponse = await axios.get(`https://sourcify.dev/server/check-by-addresses`, {
      params: {
        addresses: contract.address,
        chainIds: '56'
      }
    });
    
    if (checkResponse.data && checkResponse.data.length > 0) {
      const result = checkResponse.data[0];
      if (result.status === 'perfect' || result.status === 'partial') {
        log(`✅ ${contract.name} 已在 Sourcify 中驗證 (${result.status})！`, 'green');
        return true;
      }
    }
    
    log(`❌ ${contract.name} Sourcify 驗證未成功`, 'red');
    return false;
    
  } catch (error) {
    log(`❌ ${contract.name} Sourcify 驗證出錯: ${error.message}`, 'red');
    
    if (error.response) {
      log(`   HTTP狀態: ${error.response.status}`, 'red');
      log(`   響應: ${JSON.stringify(error.response.data).substring(0, 200)}`, 'red');
    }
    
    return false;
  }
}

// 生成最終的手動驗證指南
function generateFinalManualGuide() {
  log('\n📋 最終手動驗證指南', 'magenta');
  log('='.repeat(50), 'magenta');
  
  log('\n🌐 方法 1: BSCScan 網頁驗證', 'cyan');
  log('1. 訪問: https://bscscan.com/verifyContract', 'yellow');
  log('2. 選擇 "Via flattened source code"', 'yellow');
  log('3. 使用以下命令生成扁平化源碼:', 'yellow');
  
  for (const contract of contracts) {
    log(`\n📄 ${contract.name}:`, 'cyan');
    log(`npx hardhat flatten contracts/core/DungeonCore.sol > ${contract.name}_flattened.sol`, 'green');
    log(`地址: ${contract.address}`, 'cyan');
    log(`編譯器: v0.8.20+commit.a1b79de6`, 'cyan');
    log(`優化: Yes, 200 runs`, 'cyan');
  }
  
  log('\n🌐 方法 2: Sourcify 網頁驗證', 'cyan');
  log('1. 訪問: https://sourcify.dev/', 'yellow');
  log('2. 選擇 "Verify Contract"', 'yellow');
  log('3. 上傳整個 contracts 目錄和 node_modules/@openzeppelin', 'yellow');
  log('4. 輸入合約地址和選擇 BSC 網路', 'yellow');
}

async function main() {
  log('\n🚀 Sourcify 自動驗證 - 最終嘗試', 'cyan');
  log('='.repeat(50), 'cyan');
  
  // 檢查必要的依賴
  try {
    require('form-data');
  } catch (error) {
    log('❌ 缺少 form-data 依賴，正在安裝...', 'red');
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    try {
      await execAsync('npm install form-data');
      log('✅ form-data 安裝成功', 'green');
    } catch (installError) {
      log('❌ 無法安裝 form-data，請手動運行: npm install form-data', 'red');
      process.exit(1);
    }
  }
  
  const results = [];
  
  for (const contract of contracts) {
    const verified = await verifyWithSourceify(contract);
    results.push({ ...contract, verified });
    
    // 等待避免 rate limit
    if (contract !== contracts[contracts.length - 1]) {
      log('⏳ 等待 10 秒...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // 總結
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 Sourcify 驗證總結', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const succeeded = results.filter(r => r.verified).length;
  const failed = results.filter(r => !r.verified).length;
  
  if (succeeded > 0) {
    log('\n✅ Sourcify 驗證成功:', 'green');
    results.filter(r => r.verified).forEach(r => {
      log(`   ✅ ${r.name} (${r.address})`, 'green');
    });
  }
  
  if (failed > 0) {
    log('\n❌ Sourcify 驗證失敗:', 'red');
    results.filter(r => !r.verified).forEach(r => {
      log(`   ❌ ${r.name} (${r.address})`, 'red');
    });
  }
  
  log(`\n📈 結果: ${succeeded} 成功, ${failed} 失敗`, 'cyan');
  
  if (failed > 0) {
    generateFinalManualGuide();
  } else {
    log('\n🎉 所有合約驗證完成！項目達到 100% 開源透明度！', 'green');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });