// 使用 Sourcify 驗證合約
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
const contracts = [
  {
    name: "DungeonCore",
    address: "0x2CB2Bd1b18CDd0cbF37cD6F7FF672D03E7a038a5",
    constructorArguments: [
      "0xEbCF4A36Ad1485A9737025e9d72186b604487274",
      "0x55d398326f99059fF775485246999027B3197955", 
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a"
    ]
  },
  {
    name: "Oracle",
    address: "0xcF7c97a055CBf8d61Bb57254F0F54A2cbaa09806",
    constructorArguments: [
      "0x737c5b0430d5aeb104680460179aaa38608b6169",
      "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
      "0x55d398326f99059fF775485246999027B3197955"
    ]
  }
];

async function verifyContract(contract) {
  try {
    log(`\n⏳ 驗證 ${contract.name}...`, 'yellow');
    log(`地址: ${contract.address}`, 'cyan');
    
    // 嘗試標準驗證
    await run("verify:verify", {
      address: contract.address,
      constructorArguments: contract.constructorArguments,
      force: true // 強制重新驗證
    });
    
    log(`✅ ${contract.name} 驗證成功！`, 'green');
    log(`查看: https://bscscan.com/address/${contract.address}#code`, 'green');
    return true;
    
  } catch (error) {
    if (error.message.includes("Already Verified")) {
      log(`✅ ${contract.name} 已經驗證過了`, 'green');
      return true;
    } 
    
    log(`❌ ${contract.name} 標準驗證失敗: ${error.message}`, 'red');
    
    // 嘗試 Sourcify 驗證
    try {
      log(`🔄 嘗試 Sourcify 驗證 ${contract.name}...`, 'yellow');
      
      await run("sourcify", {
        address: contract.address,
        constructorArguments: contract.constructorArguments,
      });
      
      log(`✅ ${contract.name} Sourcify 驗證成功！`, 'green');
      return true;
      
    } catch (sourcifyError) {
      log(`❌ ${contract.name} Sourcify 驗證也失敗: ${sourcifyError.message}`, 'red');
      return false;
    }
  }
}

async function main() {
  log('\n🚀 開始自動驗證合約（含 Sourcify 備用方案）...', 'cyan');
  log('=====================================\n', 'cyan');
  
  const results = [];
  
  for (const contract of contracts) {
    const success = await verifyContract(contract);
    results.push({ name: contract.name, success });
    
    // 等待 5 秒避免 rate limit
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  // 顯示總結
  log('\n📊 驗證總結', 'cyan');
  log('============', 'cyan');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(r => {
    const icon = r.success ? '✅' : '❌';
    const color = r.success ? 'green' : 'red';
    log(`${icon} ${r.name}`, color);
  });
  
  log(`\n總計: ${successful} 成功, ${failed} 失敗`, 'cyan');
  
  if (failed > 0) {
    log('\n💡 如果驗證失敗，請檢查:', 'yellow');
    log('1. 合約地址是否正確', 'yellow');
    log('2. 構造函數參數是否正確', 'yellow');
    log('3. 編譯器設置是否與部署時一致', 'yellow');
    log('4. 可能需要手動在 BSCScan 上驗證', 'yellow');
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