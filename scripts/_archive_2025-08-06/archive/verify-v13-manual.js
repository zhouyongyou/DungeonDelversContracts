// V13 手動驗證腳本 - 使用部署輸出的地址
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

// V13 手動地址（從部署輸出複製）
const V13_ADDRESSES = {
  ORACLE_ADDRESS: "0x5BE782700EEcB5aeb1bF3AABA26a8A5c395112Da",
  DUNGEONCORE_ADDRESS: "0x71c8f870FA4FD1c6820E7636d7C7de2296DAAC52",
  SOULSHARD_ADDRESS: "0x7301Baea6BA609Dd0A400D5b93B9293A2D03180A",
  USD_TOKEN_ADDRESS: "0x7C67Af4EBC6651c95dF78De11cfe325660d935FE", // 錯誤？應該是 USDT
  DEPLOYER: "0x10925A7138649C7E1794CE646182eeb5BF8ba647"
};

// 生成扁平化源碼
async function generateV13Flattened() {
  const { exec } = require('child_process');
  const util = require('util');
  const execAsync = util.promisify(exec);
  
  try {
    log('\n📝 生成 V13 扁平化源碼...', 'cyan');
    
    // Oracle
    await execAsync('npx hardhat flatten contracts/defi/Oracle_VerificationFix.sol > Oracle_V13_Manual.sol');
    log('✅ Oracle_V13_Manual.sol 生成完成', 'green');
    
    // DungeonCore  
    await execAsync('npx hardhat flatten contracts/core/DungeonCore_VerificationFix.sol > DungeonCore_V13_Manual.sol');
    log('✅ DungeonCore_V13_Manual.sol 生成完成', 'green');
    
    return true;
  } catch (error) {
    log(`❌ 扁平化失敗: ${error.message}`, 'red');
    return false;
  }
}

// 計算構造參數
function calculateConstructorParams() {
  const poolAddress = "0x737c5b0430d5aeb104680460179aaa38608b6169";
  const REAL_USDT = "0x55d398326f99059ff775485246999027B3197955"; // 真正的 USDT
  
  // Oracle 構造參數: poolAddress, soulShardToken, usdToken
  const oracleParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'address'],
    [poolAddress, V13_ADDRESSES.SOULSHARD_ADDRESS, REAL_USDT]
  ).slice(2);
  
  // DungeonCore 構造參數: initialOwner, usdTokenAddress, soulShardTokenAddress  
  const dungeonCoreParams = ethers.AbiCoder.defaultAbiCoder().encode(
    ['address', 'address', 'address'],
    [V13_ADDRESSES.DEPLOYER, REAL_USDT, V13_ADDRESSES.SOULSHARD_ADDRESS]
  ).slice(2);
  
  return {
    oracle: oracleParams,
    dungeonCore: dungeonCoreParams
  };
}

// V13 驗證函數
async function verifyV13Contract(name, address, flattenedFile, contractName, constructorParams) {
  try {
    log(`\n🎯 V13 驗證 ${name}...`, 'magenta');
    
    const filePath = path.join(__dirname, '..', flattenedFile);
    if (!fs.existsSync(filePath)) {
      log(`❌ 扁平化文件不存在: ${flattenedFile}`, 'red');
      return false;
    }
    
    const sourceCode = fs.readFileSync(filePath, 'utf8');
    log(`📁 V13 源碼: ${flattenedFile}`, 'cyan');
    log(`📄 源碼長度: ${sourceCode.length} 字符`, 'cyan');
    log(`🏠 合約地址: ${address}`, 'cyan');
    
    // V13 品質檢查
    const hasChinese = /[\u4e00-\u9fa5]/.test(sourceCode.substring(0, 500));
    log(`🔍 源碼純淨度: ${hasChinese ? '❌ 有中文' : '✅ 純淨'}`, hasChinese ? 'red' : 'green');
    
    const data = {
      module: 'contract',
      action: 'verifysourcecode',
      contractaddress: address,
      sourceCode: sourceCode,
      codeformat: 'solidity-single-file',
      contractname: contractName,
      compilerversion: 'v0.8.20+commit.a1b79de6',
      optimizationUsed: '1',
      runs: '200',
      constructorArguements: constructorParams,
      apikey: BSCSCAN_API_KEY
    };
    
    log(`🚀 提交 V13 驗證 ${name}...`, 'magenta');
    
    const response = await axios.post(BSCSCAN_API_URL, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 30000
    });
    
    if (response.data.status === '1') {
      const guid = response.data.result;
      log(`✅ V13 ${name} 驗證請求已提交，GUID: ${guid}`, 'green');
      
      // 檢查驗證狀態
      for (let i = 1; i <= 10; i++) {
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
          log(`🎉🎉🎉 ${name} V13 驗證成功！🎉🎉🎉`, 'green');
          return true;
        } else if (statusResponse.data.result !== 'Pending in queue') {
          log(`❌ ${name} V13 驗證失敗: ${statusResponse.data.result}`, 'red');
          return false;
        }
        
        log(`⏳ ${name} 排隊中 (${i}/10)...`, 'yellow');
      }
      
      log(`⏰ ${name} V13 驗證超時`, 'yellow');
      return 'timeout';
      
    } else {
      log(`❌ ${name} 提交失敗: ${response.data.message}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ ${name} V13 驗證出錯: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🏆 V13 手動驗證 - 100% 開源透明度目標', 'magenta');
  log('='.repeat(60), 'magenta');
  
  // 生成扁平化源碼
  const flattenSuccess = await generateV13Flattened();
  if (!flattenSuccess) {
    process.exit(1);
  }
  
  // 計算構造參數
  log('\n🔢 計算 V13 構造參數...', 'cyan');
  const constructorParams = calculateConstructorParams();
  log('✅ 構造參數計算完成', 'green');
  
  const results = [];
  
  // 驗證 Oracle
  const oracleResult = await verifyV13Contract(
    'Oracle',
    V13_ADDRESSES.ORACLE_ADDRESS,
    'Oracle_V13_Manual.sol',
    'Oracle',
    constructorParams.oracle
  );
  results.push({ name: 'Oracle', result: oracleResult, address: V13_ADDRESSES.ORACLE_ADDRESS });
  
  if (oracleResult !== 'timeout') {
    log('⏳ 等待 30 秒避免 rate limit...', 'yellow');
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
  
  // 驗證 DungeonCore
  const dungeonCoreResult = await verifyV13Contract(
    'DungeonCore',
    V13_ADDRESSES.DUNGEONCORE_ADDRESS,
    'DungeonCore_V13_Manual.sol',
    'DungeonCore',
    constructorParams.dungeonCore
  );
  results.push({ name: 'DungeonCore', result: dungeonCoreResult, address: V13_ADDRESSES.DUNGEONCORE_ADDRESS });
  
  // V13 總結
  log('\n' + '='.repeat(60), 'magenta');
  log('🏆 V13 手動驗證總結', 'magenta');
  log('='.repeat(60), 'magenta');
  
  const success = results.filter(r => r.result === true).length;
  const failed = results.filter(r => r.result === false).length;
  const timeout = results.filter(r => r.result === 'timeout').length;
  
  if (success > 0) {
    log('\n🎉 V13 驗證成功:', 'green');
    results.filter(r => r.result === true).forEach(r => {
      log(`   🔥 ${r.name}: https://bscscan.com/address/${r.address}`, 'green');
    });
  }
  
  if (timeout > 0) {
    log('\n⏳ V13 驗證處理中:', 'yellow');
    results.filter(r => r.result === 'timeout').forEach(r => {
      log(`   ⏳ ${r.name}: https://bscscan.com/address/${r.address}`, 'yellow');
    });
  }
  
  if (failed > 0) {
    log('\n❌ V13 驗證失敗:', 'red');
    results.filter(r => r.result === false).forEach(r => {
      log(`   ❌ ${r.name}: https://bscscan.com/address/${r.address}`, 'red');
    });
  }
  
  const successRate = ((success / results.length) * 100).toFixed(1);
  log(`\n📊 V13 驗證成功率: ${success}/${results.length} (${successRate}%)`, 'cyan');
  
  if (success === results.length) {
    log('\n🚀🚀🚀 V13 史詩級成功！🚀🚀🚀', 'green');
    log('🌟 DungeonDelvers 達成 100% 開源透明度！', 'green');
    log('✨ 內聯接口策略完全勝利！', 'green');
  } else if (success > 0) {
    log('\n🎯 V13 部分成功！內聯接口策略有效', 'green');
  }
  
  log('\n🔗 V13 合約鏈接:', 'cyan');
  results.forEach(r => {
    const statusEmoji = r.result === true ? '✅' : r.result === 'timeout' ? '⏳' : '❌';
    log(`${statusEmoji} ${r.name}: https://bscscan.com/address/${r.address}`, 'cyan');
  });
  
  if (success > 0) {
    log('\n🎯 V13 成功！下一步:', 'green');
    log('  1️⃣  修正祭壇地址為零地址', 'cyan');
    log('  2️⃣  更新環境變數到 V13', 'cyan');
    log('  3️⃣  測試功能', 'cyan');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 V13 手動驗證出錯:', error);
    process.exit(1);
  });