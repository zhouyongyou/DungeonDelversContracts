// 檢查子圖同步進度
const axios = require('axios');
const { ethers } = require('hardhat');

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

async function checkSubgraphProgress() {
  log('\n📊 檢查 DungeonDelvers 子圖同步進度...', 'cyan');
  log('=========================================\n', 'cyan');
  
  const SUBGRAPH_V304 = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.4';
  const SUBGRAPH_V305 = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.5';
  const V11_START_BLOCK = 54670894; // V11 部署區塊
  const V12_START_BLOCK = 54680447; // V12 部署區塊
  
  try {
    // 獲取當前 BSC 區塊
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
    const currentBlock = await provider.getBlockNumber();
    log(`🔗 BSC 當前區塊: ${currentBlock.toLocaleString()}`, 'yellow');
    
    // 查詢兩個版本的子圖
    const query = `
      {
        _meta {
          block {
            number
            timestamp
          }
          hasIndexingErrors
        }
      }
    `;
    
    // 查詢 v3.0.4
    log('\n📍 v3.0.4 子圖狀態:', 'yellow');
    try {
      const response304 = await axios.post(SUBGRAPH_V304, { query });
      if (response304.data.data && response304.data.data._meta) {
        const meta = response304.data.data._meta;
        const subgraphBlock = meta.block.number;
        const blockTimestamp = meta.block.timestamp;
        const hasErrors = meta.hasIndexingErrors;
        
        log(`   同步區塊: ${subgraphBlock.toLocaleString()}`, 'green');
        log(`   區塊時間: ${new Date(blockTimestamp * 1000).toLocaleString('zh-TW')}`, 'green');
        log(`   索引錯誤: ${hasErrors ? '❌ 有錯誤' : '✅ 無錯誤'}`, hasErrors ? 'red' : 'green');
        
        // 計算進度
        const blocksBehind = currentBlock - subgraphBlock;
        const v11Progress = ((subgraphBlock - V11_START_BLOCK) / (currentBlock - V11_START_BLOCK) * 100).toFixed(2);
        
        if (subgraphBlock >= V11_START_BLOCK) {
          log(`   V11 同步進度: ${v11Progress}%`, v11Progress > 95 ? 'green' : 'yellow');
          log(`   落後區塊: ${blocksBehind.toLocaleString()}`, blocksBehind < 100 ? 'green' : 'yellow');
        } else {
          log(`   ⏳ 還在同步到 V11 起始區塊...`, 'yellow');
        }
      }
    } catch (error) {
      log(`   ❌ 查詢失敗: ${error.message}`, 'red');
    }
    
    // 查詢 v3.0.5
    log('\n📍 v3.0.5 子圖狀態:', 'yellow');
    try {
      const response305 = await axios.post(SUBGRAPH_V305, { query });
      if (response305.data.data && response305.data.data._meta) {
        const meta = response305.data.data._meta;
        const subgraphBlock = meta.block.number;
        const blockTimestamp = meta.block.timestamp;
        const hasErrors = meta.hasIndexingErrors;
        
        log(`   同步區塊: ${subgraphBlock.toLocaleString()}`, 'green');
        log(`   區塊時間: ${new Date(blockTimestamp * 1000).toLocaleString('zh-TW')}`, 'green');
        log(`   索引錯誤: ${hasErrors ? '❌ 有錯誤' : '✅ 無錯誤'}`, hasErrors ? 'red' : 'green');
        
        // 計算進度
        const blocksBehind = currentBlock - subgraphBlock;
        const v12Progress = ((subgraphBlock - V12_START_BLOCK) / (currentBlock - V12_START_BLOCK) * 100).toFixed(2);
        
        if (subgraphBlock >= V12_START_BLOCK) {
          log(`   V12 同步進度: ${v12Progress}%`, v12Progress > 95 ? 'green' : 'yellow');
          log(`   落後區塊: ${blocksBehind.toLocaleString()}`, blocksBehind < 100 ? 'green' : 'yellow');
        } else if (subgraphBlock >= V11_START_BLOCK) {
          log(`   ⏳ 已同步到 V11，等待 V12 區塊...`, 'yellow');
          const blocksToV12 = V12_START_BLOCK - subgraphBlock;
          log(`   距離 V12 起始區塊: ${blocksToV12.toLocaleString()} 個區塊`, 'yellow');
        } else {
          log(`   ⏳ 還在同步到 V11 起始區塊...`, 'yellow');
        }
      }
    } catch (error) {
      log(`   ❌ 查詢失敗: ${error.message}`, 'red');
    }
    
    log('\n📌 總結:', 'magenta');
    log('   - v3.0.4: 用於 V11 合約 (區塊 54670894 開始)', 'magenta');
    log('   - v3.0.5: 用於 V12 合約 (區塊 54680447 開始)', 'magenta');
    log('   - 兩個子圖都在緩慢同步中', 'magenta');
    log('   - 可以開始測試，新交易會立即被索引', 'magenta');
    
  } catch (error) {
    log(`\n❌ 查詢失敗: ${error.message}`, 'red');
  }
}

checkSubgraphProgress()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });