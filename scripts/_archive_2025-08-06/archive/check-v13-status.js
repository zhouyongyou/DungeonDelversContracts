// 檢查 V13 驗證狀態
const axios = require('axios');

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

// V13 驗證 GUID（從前面的輸出複製）
const verifications = {
  Oracle: {
    guid: "k1p5ttstqyy6mwiexvzzsh2hyeyxqw6e2q1hgza5du5lzy3mh8",
    address: "0x5BE782700EEcB5aeb1bF3AABA26a8A5c395112Da"
  },
  DungeonCore: {
    guid: "jzbxbqvk4c2fcyhmpqupqkssel817uqvayfqup12mnzbhlzv2b", 
    address: "0x71c8f870FA4FD1c6820E7636d7C7de2296DAAC52"
  }
};

async function checkStatus(name, info) {
  try {
    log(`\n🔍 檢查 ${name} V13 驗證狀態...`, 'cyan');
    
    const response = await axios.get(BSCSCAN_API_URL, {
      params: {
        module: 'contract',
        action: 'checkverifystatus',
        guid: info.guid,
        apikey: BSCSCAN_API_KEY
      }
    });
    
    if (response.data.status === '1') {
      log(`🎉 ${name} V13 驗證成功！`, 'green');
      log(`🔗 查看: https://bscscan.com/address/${info.address}`, 'green');
      return true;
    } else if (response.data.result === 'Pending in queue') {
      log(`⏳ ${name} 仍在排隊中...`, 'yellow');
      return 'pending';
    } else {
      log(`❌ ${name} V13 驗證失敗: ${response.data.result}`, 'red');
      log(`🔗 地址: https://bscscan.com/address/${info.address}`, 'red');
      return false;
    }
    
  } catch (error) {
    log(`❌ 檢查 ${name} 狀態出錯: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n🏆 V13 驗證狀態檢查', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const results = [];
  
  for (const [name, info] of Object.entries(verifications)) {
    const result = await checkStatus(name, info);
    results.push({ name, result, address: info.address });
    
    // 短暫等待
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 總結
  log('\n' + '='.repeat(50), 'magenta');
  log('📊 V13 驗證總結', 'magenta');
  log('='.repeat(50), 'magenta');
  
  const success = results.filter(r => r.result === true).length;
  const pending = results.filter(r => r.result === 'pending').length; 
  const failed = results.filter(r => r.result === false).length;
  
  if (success > 0) {
    log('\n🎉 V13 驗證成功:', 'green');
    results.filter(r => r.result === true).forEach(r => {
      log(`   ✅ ${r.name}: https://bscscan.com/address/${r.address}`, 'green');
    });
  }
  
  if (pending > 0) {
    log('\n⏳ 仍在處理中:', 'yellow');
    results.filter(r => r.result === 'pending').forEach(r => {
      log(`   ⏳ ${r.name}: https://bscscan.com/address/${r.address}`, 'yellow');
    });
  }
  
  if (failed > 0) {
    log('\n❌ 驗證失敗:', 'red');
    results.filter(r => r.result === false).forEach(r => {
      log(`   ❌ ${r.name}: https://bscscan.com/address/${r.address}`, 'red');
    });
  }
  
  const successRate = ((success / results.length) * 100).toFixed(1);
  log(`\n📈 V13 成功率: ${success}/${results.length} (${successRate}%)`, 'cyan');
  
  if (success === results.length) {
    log('\n🚀🚀🚀 V13 完全成功！🚀🚀🚀', 'green');
    log('🌟 DungeonDelvers 達成 100% 開源透明度！', 'green');
    log('✨ 內聯接口策略完全勝利！', 'green');
    log('🎊 V13 部署 + 驗證完美達成！', 'green');
  } else if (success > 0) {
    log('\n🎯 V13 部分成功！', 'green');
    log('💪 內聯接口策略證明有效', 'green');
  } else if (pending > 0) {
    log('\n⏳ 請稍後再次檢查', 'yellow');
  } else {
    log('\n🤔 需要進一步調查', 'yellow');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('💥 檢查狀態出錯:', error);
    process.exit(1);
  });