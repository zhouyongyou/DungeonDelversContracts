// 驗證 DungeonCore 和 Oracle
const { ethers, run } = require("hardhat");

// 顏色輸出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 需要驗證的合約
const contracts = {
  DungeonCore: {
    address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    constructorArgs: [
      "0x10925A7138649C7E1794CE646182eeb5BF8ba647", // initialOwner
      "0x55d398326f99059fF775485246999027B3197955", // usdToken
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"  // soulShardToken
    ]
  },
  Oracle: {
    address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    constructorArgs: [
      "0x737c5b0430d5aeb104680460179aaa38608b6169", // poolAddress
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a", // soulShardToken
      "0x55d398326f99059fF775485246999027B3197955"  // usdToken
    ]
  }
};

async function verifyContract(name, contractInfo) {
  try {
    log(`\n⏳ 驗證 ${name}...`, 'yellow');
    log(`地址: ${contractInfo.address}`, 'cyan');
    log(`參數: ${JSON.stringify(contractInfo.constructorArgs, null, 2)}`, 'cyan');
    
    await run("verify:verify", {
      address: contractInfo.address,
      constructorArguments: contractInfo.constructorArgs,
    });
    
    log(`✅ ${name} 驗證成功！`, 'green');
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log(`✅ ${name} 已經驗證過了`, 'green');
      return true;
    } else {
      log(`❌ ${name} 驗證失敗: ${error.message}`, 'red');
      
      // 顯示手動驗證的詳細步驟
      if (name === "DungeonCore") {
        log('\n📋 DungeonCore 手動驗證步驟:', 'yellow');
        log('1. 訪問: https://bscscan.com/verifyContract?a=0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5', 'yellow');
        log('2. 選擇 Compiler Type: Solidity (Single file)', 'yellow');
        log('3. 選擇 Compiler Version: v0.8.25+commit.b61c2a91', 'yellow');
        log('4. 選擇 License Type: MIT', 'yellow');
        log('5. 在 Constructor Arguments 填入:', 'yellow');
        log('   0x00000000000000000000000010925a7138649c7e1794ce646182eeb5bf8ba64700000000000000000000000055d398326f99059ff775485246999027b3197955000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a', 'cyan');
      } else if (name === "Oracle") {
        log('\n📋 Oracle 手動驗證步驟:', 'yellow');
        log('1. 訪問: https://bscscan.com/verifyContract?a=0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806', 'yellow');
        log('2. 選擇 Compiler Type: Solidity (Single file)', 'yellow');
        log('3. 選擇 Compiler Version: v0.8.25+commit.b61c2a91', 'yellow');
        log('4. 選擇 License Type: MIT', 'yellow');
        log('5. 在 Constructor Arguments 填入:', 'yellow');
        log('   0x000000000000000000000000737c5b0430d5aeb104680460179aaa38608b6169000000000000000000000000c88dad283ac209d77bfe452807d378615ab8b94a00000000000000000000000055d398326f99059ff775485246999027b3197955', 'cyan');
      }
      
      return false;
    }
  }
}

async function main() {
  log('\n🚀 開始驗證 DungeonCore 和 Oracle...', 'cyan');
  log('==================================\n', 'cyan');
  
  const results = [];
  
  // 逐一驗證每個合約
  for (const [name, info] of Object.entries(contracts)) {
    const success = await verifyContract(name, info);
    results.push({ name, success });
    
    // 等待 5 秒避免 rate limit
    if (Object.keys(contracts).indexOf(name) < Object.keys(contracts).length - 1) {
      log('⏳ 等待 5 秒...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // 顯示總結
  log('\n📊 驗證總結', 'cyan');
  log('============', 'cyan');
  
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const color = r.success ? 'green' : 'red';
    log(`${icon} ${r.name}`, color);
  });
  
  // 如果有失敗的，顯示 flatten 指令
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    log('\n💡 如果自動驗證失敗，可以嘗試使用 flatten 的方式:', 'yellow');
    failed.forEach(r => {
      if (r.name === "DungeonCore") {
        log(`\nnpx hardhat flatten contracts/core/DungeonCore.sol > DungeonCore_flat.sol`, 'cyan');
      } else if (r.name === "Oracle") {
        log(`\nnpx hardhat flatten contracts/utils/Oracle.sol > Oracle_flat.sol`, 'cyan');
      }
    });
    log('\n然後將 flatten 後的代碼貼到 BSCScan 手動驗證', 'yellow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });