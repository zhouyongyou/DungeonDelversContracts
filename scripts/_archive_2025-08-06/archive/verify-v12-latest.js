// 驗證 V12 最新部署的所有合約
// 使用 2025-07-23 部署的地址
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

// V12 最新合約地址 (2025-07-23 部署，區塊 55018576)
const contracts = {
  Oracle: {
    address: "0x097561AFa628Ce7c6565705ce3d36DF505777070",
    constructorArgs: [
      "0x737c5b0430d5aeb104680460179aaa38608b6169", // poolAddress
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a", // soulShardToken
      "0x55d398326f99059fF775485246999027B3197955"  // usdToken
    ],
    contractPath: "contracts/defi/Oracle.sol:Oracle"
  },
  DungeonStorage: {
    address: "0x1E5f011D9eF295aef7e6bA54e760b73976547b4b",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/core/DungeonStorage.sol:DungeonStorage"
  },
  Hero: {
    address: "0xAA3734B376eDf4E92402Df4328AA6C1B8254144e",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/nft/Hero.sol:Hero"
  },
  Relic: {
    address: "0xD73D7D5D279ac033c9D8639A15CcEa6B6BE2C786",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/nft/Relic.sol:Relic"
  },
  PartyV3: {
    address: "0x54025749950137d64469fb11263B475F6A346b83",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/nft/Party_V3.sol:PartyV3"
  },
  PlayerVault: {
    address: "0xe7f2B5C1544a7C2530F4094AF1E492574B66bAa2",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/defi/PlayerVault.sol:PlayerVault"
  },
  PlayerProfile: {
    address: "0x0dEf83dbD501fC7D96Bb24FcA2eAAc06c6DD5db9",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/nft/PlayerProfile.sol:PlayerProfile"
  },
  AltarOfAscension: {
    address: "0xc598B642aA41e5286aC9e2F64d5a2CBBbc35288b",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/defi/AltarOfAscension.sol:AltarOfAscension"
  },
  VIPStaking: {
    address: "0x56350F90a26A844B3248F55dbd5043C3B3F27927",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/nft/VIPStaking.sol:VIPStaking"
  },
  DungeonCore: {
    address: "0xC880c8253A617FaBe83bACd010E9E26369e12aDB",
    constructorArgs: [
      "0x10925A7138649C7E1794CE646182eeb5BF8ba647", // initialOwner
      "0x55d398326f99059fF775485246999027B3197955", // usdToken (USDT)
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"  // soulShardToken
    ],
    contractPath: "contracts/core/DungeonCore.sol:DungeonCore"
  },
  DungeonMasterV8: {
    address: "0xA54104946c08E78fC9df1dB6db01f8C38a0a0fF6",
    constructorArgs: ["0x10925A7138649C7E1794CE646182eeb5BF8ba647"],
    contractPath: "contracts/core/DungeonMaster_V8.sol:DungeonMasterV8"
  }
};

async function verifyContract(name, contractInfo) {
  try {
    log(`\n⏳ 驗證 ${name} (${contractInfo.address})...`, 'yellow');
    
    const verifyArgs = {
      address: contractInfo.address,
      constructorArguments: contractInfo.constructorArgs,
    };
    
    // 如果有指定合約路徑，加入 contract 參數
    if (contractInfo.contractPath) {
      verifyArgs.contract = contractInfo.contractPath;
    }
    
    await run("verify:verify", verifyArgs);
    
    log(`✅ ${name} 驗證成功！`, 'green');
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log(`✅ ${name} 已經驗證過了`, 'green');
      return true;
    } else if (error.message.includes("Contract source code already verified")) {
      log(`✅ ${name} 源碼已驗證`, 'green');
      return true;
    } else {
      log(`❌ ${name} 驗證失敗: ${error.message}`, 'red');
      
      // 輸出詳細的驗證信息用於手動驗證
      log(`📋 手動驗證信息:`, 'magenta');
      log(`   地址: ${contractInfo.address}`, 'cyan');
      log(`   合約: ${contractInfo.contractPath || 'auto-detect'}`, 'cyan');
      log(`   構造參數: ${JSON.stringify(contractInfo.constructorArgs)}`, 'cyan');
      
      return false;
    }
  }
}

async function main() {
  log('\n🚀 開始驗證 V12 最新部署合約...', 'cyan');
  log('部署時間: 2025-07-23T09:12:11.713Z', 'cyan');
  log('起始區塊: 55018576', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const results = [];
  let totalContracts = Object.keys(contracts).length;
  let currentIndex = 0;
  
  // 逐一驗證每個合約
  for (const [name, info] of Object.entries(contracts)) {
    currentIndex++;
    log(`\n📊 進度: ${currentIndex}/${totalContracts}`, 'magenta');
    
    const success = await verifyContract(name, info);
    results.push({ name, success, address: info.address });
    
    // 等待 5 秒避免 rate limit (BSCScan API 限制)
    if (currentIndex < totalContracts) {
      log('⏳ 等待 5 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // 顯示總結
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 驗證總結', 'cyan');
  log('='.repeat(50), 'cyan');
  
  const succeeded = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  log('\n✅ 成功驗證的合約:', 'green');
  results.filter(r => r.success).forEach(r => {
    log(`   ✅ ${r.name} (${r.address})`, 'green');
  });
  
  if (failed > 0) {
    log('\n❌ 驗證失敗的合約:', 'red');
    results.filter(r => !r.success).forEach(r => {
      log(`   ❌ ${r.name} (${r.address})`, 'red');
    });
  }
  
  log(`\n📈 總計: ${succeeded} 成功, ${failed} 失敗`, 'cyan');
  
  if (failed > 0) {
    log('\n💡 對於失敗的合約，你可以:', 'yellow');
    log('1. 手動在 BSCScan 上驗證: https://bscscan.com/verifyContract', 'yellow');
    log('2. 或使用 Sourcify: https://sourcify.dev/', 'yellow');
    log('3. 檢查上面輸出的手動驗證信息', 'yellow');
  } else {
    log('\n🎉 所有合約都已成功驗證！', 'green');
  }
  
  log('\n🔗 合約瀏覽:', 'cyan');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    log(`${status} ${r.name}: https://bscscan.com/address/${r.address}`, 'cyan');
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });