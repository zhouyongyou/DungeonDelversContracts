// 重新驗證失敗的合約
const { ethers, run } = require("hardhat");

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

// 失敗的合約
const failedContracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorArgs: [
      "0x737c5b0430d5aeb104680460179aaa38608b6169", // poolAddress
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a", // soulShardToken
      "0x55d398326f99059fF775485246999027B3197955"  // usdToken
    ],
    contractPath: "contracts/defi/Oracle.sol:Oracle"
  },
  Party: {
    address: "0x54025749950137d64469fb11263B475F6A346b83",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/nft/Party_V3.sol:Party"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorArgs: [
      "0x10925A7138649C7E1794CE646182eeb5BF8ba647", // initialOwner
      "0x55d398326f99059fF775485246999027B3197955", // usdToken (USDT)
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"  // soulShardToken
    ],
    contractPath: "contracts/core/DungeonCore.sol:DungeonCore"
  }
};

async function verifyContractWithRetry(name, contractInfo, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      log(`\n⏳ 驗證 ${name} (嘗試 ${attempt}/${maxRetries})...`, 'yellow');
      log(`📍 地址: ${contractInfo.address}`, 'cyan');
      
      const verifyArgs = {
        address: contractInfo.address,
        constructorArguments: contractInfo.constructorArgs,
      };
      
      if (contractInfo.contractPath) {
        verifyArgs.contract = contractInfo.contractPath;
      }
      
      await run("verify:verify", verifyArgs);
      
      log(`✅ ${name} 驗證成功！`, 'green');
      return true;
    } catch (error) {
      if (error.message.includes("Already Verified") || 
          error.message.includes("Contract source code already verified")) {
        log(`✅ ${name} 已經驗證過了`, 'green');
        return true;
      } else {
        log(`❌ ${name} 嘗試 ${attempt} 失敗: ${error.message}`, 'red');
        
        if (attempt === maxRetries) {
          log(`📋 最終手動驗證信息:`, 'magenta');
          log(`   地址: ${contractInfo.address}`, 'cyan');
          log(`   合約: ${contractInfo.contractPath || 'auto-detect'}`, 'cyan');
          log(`   構造參數: ${JSON.stringify(contractInfo.constructorArgs)}`, 'cyan');
          
          // 生成 BSCScan 手動驗證的 ABI 編碼參數
          try {
            const abiCoder = new ethers.AbiCoder();
            let encodedArgs = '';
            
            if (name === 'Oracle') {
              encodedArgs = abiCoder.encode(
                ['address', 'address', 'address'],
                contractInfo.constructorArgs
              );
            } else if (name === 'Party') {
              encodedArgs = abiCoder.encode(
                ['address'],
                contractInfo.constructorArgs
              );
            } else if (name === 'DungeonCore') {
              encodedArgs = abiCoder.encode(
                ['address', 'address', 'address'],
                contractInfo.constructorArgs
              );
            }
            
            if (encodedArgs) {
              log(`   ABI 編碼參數: ${encodedArgs.slice(2)}`, 'cyan'); // 移除 0x 前綴
            }
          } catch (e) {
            log(`   ABI 編碼失敗: ${e.message}`, 'red');
          }
          
          return false;
        } else {
          log(`⏳ 等待 10 秒後重試...`, 'yellow');
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      }
    }
  }
  
  return false;
}

async function main() {
  log('\n🔧 重新驗證失敗的合約...', 'cyan');
  log('='.repeat(40), 'cyan');
  
  const results = [];
  let currentIndex = 0;
  const totalContracts = Object.keys(failedContracts).length;
  
  for (const [name, info] of Object.entries(failedContracts)) {
    currentIndex++;
    log(`\n📊 進度: ${currentIndex}/${totalContracts}`, 'magenta');
    
    const success = await verifyContractWithRetry(name, info);
    results.push({ name, success, address: info.address });
    
    // 在合約之間等待更長時間
    if (currentIndex < totalContracts) {
      log('⏳ 等待 15 秒...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  // 顯示總結
  log('\n' + '='.repeat(40), 'cyan');
  log('📊 重試驗證總結', 'cyan');
  log('='.repeat(40), 'cyan');
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  if (succeeded > 0) {
    log('\n✅ 成功驗證的合約:', 'green');
    results.filter(r => r.success).forEach(r => {
      log(`   ✅ ${r.name} (${r.address})`, 'green');
    });
  }
  
  if (failed > 0) {
    log('\n❌ 仍需手動驗證的合約:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`   ❌ ${r.name} (${r.address})`, 'red');
    });
    
    log('\n💡 手動驗證步驟:', 'yellow');
    log('1. 訪問 https://bscscan.com/verifyContract', 'yellow');
    log('2. 選擇 "Via Standard Input JSON"', 'yellow');
    log('3. 輸入合約地址', 'yellow');
    log('4. 選擇編譯器版本 (查看 hardhat.config.ts)', 'yellow');
    log('5. 上傳整個 contracts 目錄的 JSON', 'yellow');
    log('6. 輸入上面提供的 ABI 編碼參數', 'yellow');
  }
  
  log(`\n📈 總計: ${succeeded} 成功, ${failed} 失敗`, 'cyan');
  
  if (failed === 0) {
    log('\n🎉 所有合約都已成功驗證！', 'green');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });