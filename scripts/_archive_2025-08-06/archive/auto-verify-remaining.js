// 自動驗證剩餘合約 - 多種方法嘗試
const { ethers, run } = require("hardhat");
const axios = require('axios');

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
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorArgs: [
      "0x737c5b0430d5aeb104680460179aaa38608b6169",
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a", 
      "0x55d398326f99059fF775485246999027B3197955"
    ],
    contractPath: "contracts/defi/Oracle.sol:Oracle"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorArgs: [
      "0xEbCF4A36Ad1485A9737025e9d72186b604487274",
      "0x55d398326f99059fF775485246999027B3197955",
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
    ],
    contractPath: "contracts/core/DungeonCore.sol:DungeonCore"
  }
};

// 方法 1: 嘗試不同的 Hardhat 參數組合
async function tryHardhatVerification(name, contractInfo) {
  const methods = [
    // 方法 1a: 不指定 contract path
    {
      name: "不指定合約路徑",
      args: {
        address: contractInfo.address,
        constructorArguments: contractInfo.constructorArgs
      }
    },
    // 方法 1b: 強制重新驗證
    {
      name: "強制重新驗證",
      args: {
        address: contractInfo.address,
        constructorArguments: contractInfo.constructorArgs,
        contract: contractInfo.contractPath,
        force: true
      }
    },
    // 方法 1c: 使用字符串格式的參數
    {
      name: "字符串格式參數",
      args: {
        address: contractInfo.address,
        constructorArguments: contractInfo.constructorArgs.map(arg => arg.toString()),
        contract: contractInfo.contractPath
      }
    }
  ];

  for (const method of methods) {
    try {
      log(`\n🔄 ${name} - 嘗試${method.name}...`, 'yellow');
      
      await run("verify:verify", method.args);
      
      log(`✅ ${name} 驗證成功 (${method.name})！`, 'green');
      return true;
    } catch (error) {
      if (error.message.includes("Already Verified")) {
        log(`✅ ${name} 已經驗證過了`, 'green');
        return true;
      }
      log(`❌ ${method.name} 失敗: ${error.message.substring(0, 100)}...`, 'red');
    }
  }
  
  return false;
}

// 方法 2: Sourcify API 自動驗證
async function trySourceifyVerification(name, contractInfo) {
  try {
    log(`\n🌐 ${name} - 嘗試 Sourcify 驗證...`, 'yellow');
    
    // 準備驗證數據
    const verificationData = {
      address: contractInfo.address,
      chain: "56", // BSC Mainnet
      files: {
        // 這裡需要包含所有相關的 Solidity 文件
        // 由於無法直接讀取文件，我們跳過這個方法
      }
    };
    
    log(`⚠️  Sourcify 需要上傳完整源碼，跳過此方法`, 'yellow');
    return false;
    
  } catch (error) {
    log(`❌ Sourcify 驗證失敗: ${error.message}`, 'red');
    return false;
  }
}

// 方法 3: 嘗試 Foundry forge verify (如果可用)
async function tryFoundryVerification(name, contractInfo) {
  try {
    log(`\n⚒️  ${name} - 嘗試 Foundry 驗證...`, 'yellow');
    
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // 檢查是否有 forge 命令
    try {
      await execAsync('forge --version');
    } catch (error) {
      log(`⚠️  Foundry 未安裝，跳過此方法`, 'yellow');
      return false;
    }
    
    // 構建 forge verify 命令
    const constructorArgs = contractInfo.constructorArgs.join(' ');
    const command = `forge verify-contract ${contractInfo.address} ${contractInfo.contractPath} --constructor-args ${constructorArgs} --chain-id 56 --etherscan-api-key ${process.env.BSCSCAN_API_KEY}`;
    
    log(`執行命令: ${command}`, 'cyan');
    
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout.includes('SUCCESS') || stdout.includes('verified')) {
      log(`✅ ${name} Foundry 驗證成功！`, 'green');
      return true;
    } else {
      log(`❌ Foundry 驗證失敗: ${stderr}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ Foundry 驗證出錯: ${error.message}`, 'red');
    return false;
  }
}

// 方法 4: 生成手動驗證指令
function generateManualInstructions(name, contractInfo) {
  log(`\n📋 ${name} - 生成手動驗證指令`, 'magenta');
  
  // 生成 ABI 編碼參數
  const abiCoder = new ethers.AbiCoder();
  let encodedArgs = '';
  
  try {
    if (name === 'Oracle') {
      encodedArgs = abiCoder.encode(
        ['address', 'address', 'address'],
        contractInfo.constructorArgs
      );
    } else if (name === 'DungeonCore') {
      encodedArgs = abiCoder.encode(
        ['address', 'address', 'address'],
        contractInfo.constructorArgs
      );
    }
    
    log(`合約地址: ${contractInfo.address}`, 'cyan');
    log(`合約路徑: ${contractInfo.contractPath}`, 'cyan');
    log(`構造參數: ${JSON.stringify(contractInfo.constructorArgs)}`, 'cyan');
    log(`ABI 編碼: ${encodedArgs.slice(2)}`, 'cyan'); // 移除 0x 前綴
    
    // 生成 curl 命令用於 API 驗證
    const curlCommand = `curl -X POST "https://api.bscscan.com/api" \\
  -d "module=contract" \\
  -d "action=verifysourcecode" \\
  -d "contractaddress=${contractInfo.address}" \\
  -d "sourceCode={...}" \\
  -d "contractname=${contractInfo.contractPath}" \\
  -d "compilerversion=v0.8.19+commit.7dd6d404" \\
  -d "constructorArguements=${encodedArgs.slice(2)}" \\
  -d "apikey=${process.env.BSCSCAN_API_KEY || 'YOUR_API_KEY'}"`;
    
    log(`\nAPI 驗證命令:`, 'magenta');
    log(curlCommand, 'cyan');
    
  } catch (error) {
    log(`生成手動指令失敗: ${error.message}`, 'red');
  }
}

async function main() {
  log('\n🚀 自動驗證剩餘合約 - 多方法嘗試', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const results = [];
  
  for (const [name, contractInfo] of Object.entries(contracts)) {
    log(`\n\n🎯 開始驗證 ${name}`, 'magenta');
    log('-'.repeat(30), 'magenta');
    
    let verified = false;
    
    // 方法 1: Hardhat 多種嘗試
    if (!verified) {
      verified = await tryHardhatVerification(name, contractInfo);
    }
    
    // 方法 2: Sourcify (跳過，需要文件上傳)
    // if (!verified) {
    //   verified = await trySourceifyVerification(name, contractInfo);
    // }
    
    // 方法 3: Foundry
    if (!verified) {
      verified = await tryFoundryVerification(name, contractInfo);
    }
    
    // 方法 4: 如果都失敗，生成手動指令
    if (!verified) {
      generateManualInstructions(name, contractInfo);
    }
    
    results.push({ name, verified });
    
    // 等待避免 rate limit
    if (name !== Object.keys(contracts)[Object.keys(contracts).length - 1]) {
      log('⏳ 等待 10 秒...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
  }
  
  // 總結
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 自動驗證總結', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const succeeded = results.filter(r => r.verified).length;
  const failed = results.filter(r => !r.verified).length;
  
  if (succeeded > 0) {
    log('\n✅ 自動驗證成功:', 'green');
    results.filter(r => r.verified).forEach(r => {
      log(`   ✅ ${r.name}`, 'green');
    });
  }
  
  if (failed > 0) {
    log('\n❌ 需要手動處理:', 'red');
    results.filter(r => !r.verified).forEach(r => {
      log(`   ❌ ${r.name} - 請使用上面生成的手動指令`, 'red');
    });
    
    log('\n💡 手動驗證網址:', 'yellow');
    log('   BSCScan: https://bscscan.com/verifyContract', 'yellow');
    log('   Sourcify: https://sourcify.dev/', 'yellow');
  }
  
  log(`\n📈 結果: ${succeeded} 成功, ${failed} 需手動處理`, 'cyan');
  
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