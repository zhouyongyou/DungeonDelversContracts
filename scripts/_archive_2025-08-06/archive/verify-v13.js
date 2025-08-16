// scripts/verify-v13.js
// V13 部署後立即驗證腳本 - 使用相同的內聯接口版本

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

// 載入 V13 部署地址
function loadV13Addresses(network = 'bsc') {
  const summaryPath = path.join(__dirname, 'deployments', `${network}-v13-summary.json`);
  if (!fs.existsSync(summaryPath)) {
    throw new Error(`V13 deployment summary not found: ${summaryPath}`);
  }
  
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  return summary.addresses;
}

// 生成扁平化源碼
async function generateFlattenedSource(contractPath, outputFileName) {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    log(`📝 Generating flattened source for ${contractPath}...`, 'cyan');
    await execAsync(`npx hardhat flatten ${contractPath} > ${outputFileName}`);
    log(`✅ Flattened source saved to ${outputFileName}`, 'green');
    return true;
  } catch (error) {
    log(`❌ Failed to generate flattened source: ${error.message}`, 'red');
    return false;
  }
}

// 讀取扁平化源碼
function readFlattenedSource(fileName) {
  const filePath = path.join(__dirname, '..', fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Flattened file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// V13 驗證函數
async function verifyV13Contract(name, contractInfo) {
  try {
    log(`\n🎯 V13 驗證 ${name}...`, 'magenta');
    
    const sourceCode = readFlattenedSource(contractInfo.flattenedFile);
    log(`📁 讀取 V13 源碼: ${contractInfo.flattenedFile}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    
    // V13 品質檢查
    const lines = sourceCode.split('\n').slice(0, 5);
    log(`🔍 V13 源碼品質檢查:`, 'cyan');
    lines.forEach((line, i) => {
      if (line.trim()) {
        log(`   ${i+1}: ${line.substring(0, 70)}${line.length > 70 ? '...' : ''}`, 'cyan');
      }
    });
    
    // 確保 V13 純淨度
    const hasChinese = /[\u4e00-\u9fa5]/.test(sourceCode.substring(0, 1000));
    const hasConsoleLog = sourceCode.includes('console.log');
    
    if (hasChinese) {
      log(`⚠️  警告: V13 源碼中包含中文字符`, 'red');
    } else {
      log(`✅ V13 源碼純淨，無中文污染`, 'green');
    }
    
    if (hasConsoleLog) {
      log(`⚠️  警告: V13 源碼中包含 console.log`, 'red');
    } else {
      log(`✅ V13 源碼純淨，無 console.log`, 'green');
    }
    
    log(`🔧 V13 編譯配置: v0.8.20, optimizer=true, runs=200, viaIR=false`, 'cyan');
    
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
    
    log(`🚀 提交 V13 驗證請求...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ V13 驗證請求已提交，GUID: ${guid}`, 'green');
      return await checkV13Status(name, guid);
    } else {
      log(`❌ V13 提交失敗: ${response.data.message}`, 'red');
      log(`📋 完整響應:`, 'yellow');
      log(`${JSON.stringify(response.data, null, 2)}`, 'yellow');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} V13 驗證出錯: ${error.message}`, 'red');
    if (error.response) {
      log(`   HTTP狀態: ${error.response.status}`, 'red');
      log(`   響應數據: ${JSON.stringify(error.response.data).substring(0, 500)}`, 'red');
    }
    return false;
  }
}

// 檢查 V13 驗證狀態
async function checkV13Status(name, guid, maxAttempts = 30) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      log(`⏳ 檢查 ${name} V13 驗證狀態 (${attempt}/${maxAttempts})...`, 'yellow');
      
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
        log(`🎉🎉🎉 ${name} V13 驗證成功！🎉🎉🎉`, 'green');
        log(`🏆 內聯接口策略完全成功！`, 'green');
        return true;
      } else if (response.data.result === 'Pending in queue') {
        log(`⏳ ${name} 排隊中，等待 15 秒...`, 'yellow');
        await new Promise(resolve => setTimeout(resolve, 15000));
      } else {
        log(`❌ ${name} V13 驗證失敗: ${response.data.result}`, 'red');
        
        // V13 失敗分析（不應該發生）
        log(`\n🔍 V13 失敗分析 - ${name}:`, 'red');
        log(`   失敗訊息: ${response.data.result}`, 'red');
        
        if (response.data.result.includes('bytecode')) {
          log(`   ⚠️  這很奇怪，V13 使用相同源碼部署和驗證`, 'yellow');
          log(`   📋 可能原因：編譯環境或設定有差異`, 'yellow');
        }
        
        return false;
      }
      
    } catch (error) {
      log(`⚠️  檢查狀態出錯: ${error.message}`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  log(`⏰ ${name} V13 驗證超時`, 'red');
  return false;
}

async function main() {
  const network = process.env.HARDHAT_NETWORK || 'bsc';
  
  log('\n🏆 V13 驗證腳本 - 100% 開源透明度目標', 'magenta');
  log('='.repeat(70), 'magenta');
  
  try {
    // 載入 V13 部署地址
    log('\n📋 載入 V13 部署資訊...', 'cyan');
    const addresses = loadV13Addresses(network);
    log(`✅ V13 部署資訊載入成功`, 'green');
    
    // 需要驗證的 V13 合約
    const contracts = {
      Oracle: {
        address: addresses.ORACLE_ADDRESS,
        originalPath: "contracts/defi/Oracle_VerificationFix.sol",
        flattenedFile: `Oracle_V13_Flattened.sol`,
        contractName: "Oracle",
        constructorParams: "" // 將由程式計算
      },
      DungeonCore: {
        address: addresses.DUNGEONCORE_ADDRESS,
        originalPath: "contracts/core/DungeonCore_VerificationFix.sol",
        flattenedFile: `DungeonCore_V13_Flattened.sol`,
        contractName: "DungeonCore",
        constructorParams: "" // 將由程式計算
      }
    };
    
    // 計算構造參數
    log('\n🔢 計算構造參數...', 'cyan');
    
    // Oracle 構造參數: poolAddress, soulShardToken, usdToken
    const poolAddress = process.env.POOL_ADDRESS || "0x737c5b0430d5aeb104680460179aaa38608b6169";
    const usdTokenAddress = addresses.USD_TOKEN_ADDRESS;
    const soulShardAddress = addresses.SOULSHARD_ADDRESS;
    
    contracts.Oracle.constructorParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'address'],
      [poolAddress, soulShardAddress, usdTokenAddress]
    ).slice(2); // 移除 0x 前綴
    
    // DungeonCore 構造參數: initialOwner, usdTokenAddress, soulShardTokenAddress
    const deployerAddress = process.env.DEPLOYER_ADDRESS || addresses.DUNGEONCORE_ADDRESS; // 需要實際部署者地址
    contracts.DungeonCore.constructorParams = ethers.AbiCoder.defaultAbiCoder().encode(
      ['address', 'address', 'address'],
      [deployerAddress, usdTokenAddress, soulShardAddress]
    ).slice(2);
    
    log(`✅ 構造參數計算完成`, 'green');
    
    // 生成扁平化源碼
    log('\n📝 生成 V13 扁平化源碼...', 'cyan');
    for (const [name, info] of Object.entries(contracts)) {
      const success = await generateFlattenedSource(info.originalPath, info.flattenedFile);
      if (!success) {
        log(`❌ ${name} 扁平化失敗`, 'red');
        process.exit(1);
      }
    }
    
    // 檢查扁平化文件
    for (const [name, info] of Object.entries(contracts)) {
      const filePath = path.join(__dirname, '..', info.flattenedFile);
      if (!fs.existsSync(filePath)) {
        log(`❌ V13 扁平化文件不存在: ${info.flattenedFile}`, 'red');
        process.exit(1);
      }
      log(`✅ 找到 V13 扁平化文件: ${info.flattenedFile}`, 'green');
    }
    
    const results = [];
    let totalSuccess = 0;
    
    // 逐一驗證合約
    for (const [name, contractInfo] of Object.entries(contracts)) {
      log(`\n${'='.repeat(60)}`, 'cyan');
      log(`V13 驗證: ${name}`, 'cyan');
      log(`合約地址: ${contractInfo.address}`, 'cyan');
      log(`原始路徑: ${contractInfo.originalPath}`, 'cyan');
      log(`扁平化文件: ${contractInfo.flattenedFile}`, 'cyan');
      log(`${'='.repeat(60)}`, 'cyan');
      
      const verified = await verifyV13Contract(name, contractInfo);
      results.push({ name, verified, address: contractInfo.address });
      
      if (verified) {
        totalSuccess++;
        log(`🎊🎊🎊 ${name} V13 驗證成功！🎊🎊🎊`, 'green');
      } else {
        log(`😞 ${name} V13 驗證失敗`, 'red');
      }
      
      // 等待避免 rate limit
      if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
        log('⏳ 等待 30 秒避免 rate limit...', 'yellow');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    // V13 終極總結
    log('\n' + '='.repeat(70), 'magenta');
    log('🏆 V13 驗證終極總結', 'magenta');
    log('='.repeat(70), 'magenta');
    
    if (totalSuccess > 0) {
      log('\n🎉🎉🎉 V13 成功驗證的合約 🎉🎉🎉', 'green');
      results.filter(r => r.verified).forEach(r => {
        log(`   🔥🔥🔥 ${r.name}: https://bscscan.com/address/${r.address}`, 'green');
      });
    }
    
    const failed = results.filter(r => !r.verified);
    if (failed.length > 0) {
      log('\n💔 V13 驗證失敗的合約:', 'red');
      failed.forEach(r => {
        log(`   😞 ${r.name}: https://bscscan.com/address/${r.address}`, 'red');
      });
    }
    
    const percentage = ((totalSuccess / results.length) * 100).toFixed(1);
    log(`\n📊 V13 開源進度: ${totalSuccess}/${results.length} (${percentage}%)`, 'cyan');
    
    if (totalSuccess === results.length) {
      log('\n🚀🚀🚀🚀🚀 V13 史詩級成功！🚀🚀🚀🚀🚀', 'green');
      log('🌟🌟🌟 DungeonDelvers 達成 100% 開源透明度！🌟🌟🌟', 'green');
      log('✨✨✨ 內聯接口策略完全勝利！✨✨✨', 'green');
      log('🎊🎊🎊 V13 部署 + 驗證流程完美！🎊🎊🎊', 'green');
      
      log('\n🏆 V13 成就解鎖:', 'green');
      log('  ✅ 零 import 路徑問題', 'green');
      log('  ✅ 零配置污染問題', 'green');
      log('  ✅ 零 bytecode 不匹配問題', 'green');
      log('  ✅ 100% 開源透明度', 'green');
      
    } else if (totalSuccess > 0) {
      log('\n🎯 V13 部分成功！', 'green');
      log('💪 內聯接口策略證明有效', 'green');
    } else {
      log('\n😞 V13 完全失敗（這不應該發生）', 'red');
      log('🔍 需要檢查編譯環境和設定', 'red');
    }
    
    log('\n🔗 V13 合約鏈接總覽:', 'cyan');
    results.forEach(r => {
      const status = r.verified ? '✅' : '❌';
      const message = r.verified ? 'V13 已驗證' : 'V13 需調查';
      log(`${status} ${r.name} (${message}): https://bscscan.com/address/${r.address}`, 'cyan');
    });
    
    if (totalSuccess === results.length) {
      log('\n🎯 下一步行動:', 'green');
      log('  1️⃣  更新前端環境變數到 V13 地址', 'cyan');
      log('  2️⃣  更新後端環境變數到 V13 地址', 'cyan');
      log('  3️⃣  更新子圖到 V13 地址和區塊', 'cyan');
      log('  4️⃣  執行完整功能測試', 'cyan');
      log('  5️⃣  宣布 100% 開源透明度達成！', 'cyan');
    }
    
  } catch (error) {
    log(`\n💥 V13 驗證腳本出錯: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V13 驗證腳本遇到意外錯誤:', error);
    process.exit(1);
  });