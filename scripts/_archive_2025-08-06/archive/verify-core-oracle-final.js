// 最終版本 - 驗證 DungeonCore 和 Oracle
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

// 需要驗證的合約 - 使用完整的合約路徑
const contracts = {
  DungeonCore: {
    address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    contract: "contracts/core/DungeonCore.sol:DungeonCore",
    constructorArguments: [
      "0x10925A7138649C7E1794CE646182eeb5BF8ba647", // initialOwner
      "0x55d398326f99059fF775485246999027B3197955", // usdToken
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"  // soulShardToken
    ]
  },
  Oracle: {
    address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    contract: "contracts/defi/Oracle.sol:Oracle",
    constructorArguments: [
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
    log(`合約路徑: ${contractInfo.contract}`, 'cyan');
    log(`參數: ${JSON.stringify(contractInfo.constructorArguments, null, 2)}`, 'cyan');
    
    // 使用完整的合約路徑來驗證
    await run("verify:verify", {
      address: contractInfo.address,
      contract: contractInfo.contract,
      constructorArguments: contractInfo.constructorArguments,
    });
    
    log(`✅ ${name} 驗證成功！`, 'green');
    log(`查看: https://bscscan.com/address/${contractInfo.address}#code`, 'green');
    return true;
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log(`✅ ${name} 已經驗證過了`, 'green');
      log(`查看: https://bscscan.com/address/${contractInfo.address}#code`, 'green');
      return true;
    } else if (error.message.includes("does not have bytecode")) {
      log(`❌ ${name} 驗證失敗: 地址上沒有合約`, 'red');
      return false;
    } else {
      log(`❌ ${name} 驗證失敗: ${error.message}`, 'red');
      
      // 提供更詳細的錯誤信息
      if (error.message.includes("constructor")) {
        log('\n💡 可能的原因:', 'yellow');
        log('1. 構造函數參數不正確', 'yellow');
        log('2. 編譯器版本不匹配（當前使用: 0.8.20）', 'yellow');
        log('3. 優化設置不匹配（當前: enabled=true, runs=200, viaIR=true）', 'yellow');
      }
      
      return false;
    }
  }
}

async function main() {
  log('\n🚀 開始驗證 DungeonCore 和 Oracle（最終版本）...', 'cyan');
  log('=========================================\n', 'cyan');
  
  // 顯示當前編譯器設置
  log('📋 編譯器設置:', 'cyan');
  log('- Solidity版本: 0.8.20', 'cyan');
  log('- 優化: 開啟 (200 runs)', 'cyan');
  log('- viaIR: 開啟', 'cyan');
  log('', 'cyan');
  
  const results = [];
  
  // 逐一驗證每個合約
  for (const [name, info] of Object.entries(contracts)) {
    const success = await verifyContract(name, info);
    results.push({ name, success });
    
    // 等待 10 秒避免 rate limit
    if (Object.keys(contracts).indexOf(name) < Object.keys(contracts).length - 1) {
      log('⏳ 等待 10 秒避免 rate limit...', 'yellow');
      await new Promise(resolve => setTimeout(resolve, 10000));
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
  
  // 如果有失敗的，顯示替代方案
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    log('\n💡 替代方案:', 'yellow');
    log('1. 確認合約是否真的部署在這些地址', 'yellow');
    log('2. 檢查編譯器版本是否與部署時一致', 'yellow');
    log('3. 使用 flatten 檔案手動驗證:', 'yellow');
    log('   - DungeonCore_flat.sol', 'cyan');
    log('   - Oracle_flat.sol', 'cyan');
    log('4. 在 BSCScan 上手動驗證時選擇:', 'yellow');
    log('   - Compiler: v0.8.20+commit.a1b79de6', 'cyan');
    log('   - Optimization: Yes with 200 runs', 'cyan');
    log('   - 勾選 "Via IR" 選項', 'cyan');
  } else {
    log('\n🎉 所有合約驗證成功！', 'green');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });