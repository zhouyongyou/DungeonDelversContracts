// 驗證 V12 所有合約
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

// V12 合約地址
const contracts = {
  DungeonCore: {
    address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    constructorArgs: [
      "0x10925A7138649C7E1794CE646182eeb5BF8ba647", // initialOwner
      "0x55d398326f99059fF775485246999027B3197955", // usdToken (USDT)
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"  // soulShardToken
    ]
  },
  DungeonMasterV8: {
    address: "0xb71f6ED7B13452a99d740024aC17470c1b4F0021",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  DungeonStorage: {
    address: "0xea21D782CefD785B128346F39f1574c8D6eb64C9",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  Oracle: {
    address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    constructorArgs: [
      "0x737c5b0430d5aeb104680460179aaa38608b6169", // poolAddress
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a", // soulShardToken
      "0x55d398326f99059fF775485246999027B3197955"  // usdToken
    ]
  },
  Hero: {
    address: "0x6f4Bd03ea8607c6e69bCc971b7d3CC9e5801EF5E",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  Relic: {
    address: "0x853DAAeC0ae354bF40c732C199Eb09F1a0CD3dC1",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  PartyV3: {
    address: "0x847DceaE26aF1CFc09beC195CE87a9b5701863A7",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  PlayerVault: {
    address: "0xA5BA5EE03d452eA5e57c72657c8EC03C6F388E1f",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  PlayerProfile: {
    address: "0x39b09c3c64D5ada443d2965cb31C7bad7AC66F2f",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  AltarOfAscension: {
    address: "0xB9878bBDcB82926f0D03E0157e8c34AEa35E06cb",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  },
  VIPStaking: {
    address: "0x738eA7A2408F56D47EF127954Db42D37aE6339D5",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"]
  }
};

async function verifyContract(name, contractInfo) {
  try {
    log(`\n⏳ 驗證 ${name}...`, 'yellow');
    
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
      return false;
    }
  }
}

async function main() {
  log('\n🚀 開始驗證 V12 合約...', 'cyan');
  log('========================\n', 'cyan');
  
  const results = [];
  
  // 逐一驗證每個合約
  for (const [name, info] of Object.entries(contracts)) {
    const success = await verifyContract(name, info);
    results.push({ name, success });
    
    // 等待 3 秒避免 rate limit
    if (Object.keys(contracts).indexOf(name) < Object.keys(contracts).length - 1) {
      log('⏳ 等待 3 秒...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // 顯示總結
  log('\n📊 驗證總結', 'cyan');
  log('============', 'cyan');
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const color = r.success ? 'green' : 'red';
    log(`${icon} ${r.name}`, color);
  });
  
  log(`\n總計: ${succeeded} 成功, ${failed} 失敗`, 'cyan');
  
  if (failed > 0) {
    log('\n💡 提示：失敗的合約可能需要手動在 BSCScan 上驗證', 'yellow');
    log('訪問: https://bscscan.com/verifyContract', 'yellow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });