// 檢查子圖同步狀態
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

async function checkSubgraphStatus() {
  log('\n📊 檢查 DungeonDelvers 子圖同步狀態...', 'cyan');
  log('=====================================\n', 'cyan');
  
  // 從 master-config.json 讀取最新的子圖 URL
  const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
  let SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.2.1';
  
  try {
    const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
    SUBGRAPH_URL = masterConfig.subgraph.studio.url;
    log(`🔗 使用配置文件中的子圖 URL: ${SUBGRAPH_URL}`, 'cyan');
  } catch (error) {
    log(`⚠️  無法讀取配置文件，使用默認 URL`, 'yellow');
  }
  
  try {
    // 查詢子圖的 meta 資訊
    const metaQuery = `
      {
        _meta {
          block {
            number
            hash
            timestamp
          }
          deployment
          hasIndexingErrors
        }
      }
    `;
    
    const response = await axios.post(SUBGRAPH_URL, {
      query: metaQuery
    });
    
    if (response.data.data && response.data.data._meta) {
      const meta = response.data.data._meta;
      const blockNumber = meta.block.number;
      const blockTimestamp = meta.block.timestamp;
      const hasErrors = meta.hasIndexingErrors;
      
      log('📍 子圖狀態:', 'yellow');
      log(`   同步區塊: ${blockNumber.toLocaleString()}`, 'green');
      log(`   區塊時間: ${new Date(blockTimestamp * 1000).toLocaleString('zh-TW')}`, 'green');
      log(`   索引錯誤: ${hasErrors ? '❌ 有錯誤' : '✅ 無錯誤'}`, hasErrors ? 'red' : 'green');
      
      // 計算同步進度（從最新同步報告獲取 V25 部署區塊）
      const START_BLOCK = 55714687; // V25 部署區塊
      const CURRENT_BLOCK = Math.floor(Date.now() / 1000 / 3) + 55714687; // BSC 約 3 秒一個區塊
      
      const syncedBlocks = blockNumber - START_BLOCK;
      const totalBlocks = CURRENT_BLOCK - START_BLOCK;
      const syncProgress = (syncedBlocks / totalBlocks * 100).toFixed(2);
      
      log(`\n📈 同步進度:`, 'yellow');
      log(`   起始區塊: ${START_BLOCK.toLocaleString()}`, 'cyan');
      log(`   已同步: ${syncedBlocks.toLocaleString()} 個區塊`, 'cyan');
      
      if (blockNumber >= CURRENT_BLOCK) {
        log(`   進度: ✅ 100% (已追上最新區塊)`, 'green');
      } else {
        log(`   進度: ${syncProgress}%`, 'yellow');
        
        // 估算剩餘時間
        const blocksPerSecond = 5; // 子圖大約每秒處理 5 個區塊
        const remainingBlocks = CURRENT_BLOCK - blockNumber;
        const remainingSeconds = remainingBlocks / blocksPerSecond;
        const remainingMinutes = Math.ceil(remainingSeconds / 60);
        
        log(`   剩餘區塊: ${remainingBlocks.toLocaleString()}`, 'yellow');
        log(`   預估時間: 約 ${remainingMinutes} 分鐘`, 'yellow');
      }
      
      // 查詢一些基本數據
      log(`\n📊 數據統計:`, 'yellow');
      
      const dataQuery = `
        {
          heroes(first: 1) {
            id
          }
          relics(first: 1) {
            id
          }
          parties(first: 1) {
            id
          }
          players(first: 5) {
            id
            heroCount
            relicCount
            partyCount
          }
        }
      `;
      
      const dataResponse = await axios.post(SUBGRAPH_URL, {
        query: dataQuery
      });
      
      if (dataResponse.data.data) {
        const data = dataResponse.data.data;
        log(`   英雄 NFT: ${data.heroes.length > 0 ? '✅ 有數據' : '⏳ 等待數據'}`, 'cyan');
        log(`   聖物 NFT: ${data.relics.length > 0 ? '✅ 有數據' : '⏳ 等待數據'}`, 'cyan');
        log(`   隊伍 NFT: ${data.parties.length > 0 ? '✅ 有數據' : '⏳ 等待數據'}`, 'cyan');
        log(`   玩家數量: ${data.players.length}`, 'cyan');
      }
      
    } else {
      log('❌ 無法獲取子圖元數據', 'red');
    }
    
  } catch (error) {
    log(`❌ 查詢失敗: ${error.message}`, 'red');
    if (error.response) {
      log(`錯誤詳情: ${JSON.stringify(error.response.data)}`, 'red');
    }
  }
  
  log('\n💡 提示:', 'magenta');
  log('   - 子圖通常需要 10-30 分鐘完全同步', 'magenta');
  log('   - 可以在 https://thegraph.com/studio/subgraph/dungeon-delvers 查看詳細狀態', 'magenta');
  log('   - 如果有索引錯誤，請檢查子圖日誌', 'magenta');
}

// 檢查是否安裝了 axios
const checkDependencies = async () => {
  try {
    require('axios');
    await checkSubgraphStatus();
  } catch (error) {
    log('⚠️  需要安裝 axios:', 'yellow');
    log('   npm install axios', 'yellow');
    process.exit(1);
  }
};

checkDependencies();