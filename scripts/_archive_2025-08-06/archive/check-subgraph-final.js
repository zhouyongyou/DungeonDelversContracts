// 最終檢查子圖同步狀態（使用正確的 schema）
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

async function checkSubgraphStatus() {
  log('\n📊 最終檢查 DungeonDelvers 子圖同步狀態...', 'cyan');
  log('=========================================\n', 'cyan');
  
  const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.5';
  const START_BLOCK = 54670894; // V12 部署區塊
  
  try {
    // 1. 獲取當前 BSC 區塊
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
    const currentBlock = await provider.getBlockNumber();
    log(`🔗 BSC 當前區塊: ${currentBlock.toLocaleString()}`, 'yellow');
    
    // 2. 查詢子圖狀態（使用正確的 schema）
    const statusQuery = `
      {
        _meta {
          block {
            number
            timestamp
          }
          hasIndexingErrors
        }
        globalStats(id: "global") {
          totalHeroes
          totalRelics
          totalParties
          totalPlayers
          totalExpeditions
        }
        players(first: 5, orderBy: id) {
          id
          heros {
            id
          }
          relics {
            id
          }
          parties {
            id
          }
        }
        heros(first: 3, orderBy: createdAt, orderDirection: desc) {
          id
          tokenId
          owner {
            id
          }
          rarity
          power
          createdAt
        }
        parties(first: 3, orderBy: createdAt, orderDirection: desc) {
          id
          tokenId
          owner {
            id
          }
          totalPower
          totalCapacity
          createdAt
        }
        expeditions(first: 5, orderBy: timestamp, orderDirection: desc) {
          id
          player {
            id
          }
          party {
            id
            tokenId
          }
          dungeon {
            id
            dungeonId
          }
          success
          rewardAmount
          timestamp
        }
      }
    `;
    
    const response = await axios.post(SUBGRAPH_URL, {
      query: statusQuery
    });
    
    if (response.data.errors) {
      log('❌ 子圖查詢錯誤:', 'red');
      response.data.errors.forEach(error => {
        log(`   ${error.message}`, 'red');
      });
      return;
    }
    
    if (response.data.data) {
      const data = response.data.data;
      const meta = data._meta;
      
      if (meta) {
        const subgraphBlock = meta.block.number;
        const blockTimestamp = meta.block.timestamp;
        const hasErrors = meta.hasIndexingErrors;
        
        log('📍 子圖狀態:', 'yellow');
        log(`   同步區塊: ${subgraphBlock.toLocaleString()}`, 'green');
        log(`   區塊時間: ${new Date(blockTimestamp * 1000).toLocaleString('zh-TW')}`, 'green');
        log(`   索引錯誤: ${hasErrors ? '❌ 有錯誤' : '✅ 無錯誤'}`, hasErrors ? 'red' : 'green');
        
        // 計算同步進度
        const blocksBehind = currentBlock - subgraphBlock;
        const syncProgress = ((subgraphBlock - START_BLOCK) / (currentBlock - START_BLOCK) * 100).toFixed(2);
        
        log(`\n📈 同步進度:`, 'yellow');
        log(`   起始區塊: ${START_BLOCK.toLocaleString()} (V12 部署)`, 'cyan');
        log(`   落後區塊: ${blocksBehind.toLocaleString()}`, blocksBehind < 100 ? 'green' : 'yellow');
        
        if (subgraphBlock >= START_BLOCK) {
          log(`   進度: ${syncProgress}%`, syncProgress > 95 ? 'green' : 'yellow');
          
          if (blocksBehind < 100) {
            log(`\n✅ 子圖已基本追上最新區塊！`, 'green');
          }
        } else {
          log(`   ⏳ 還在同步到起始區塊...`, 'yellow');
        }
      }
      
      // 顯示數據統計
      if (data.globalStats) {
        log(`\n📊 全局統計:`, 'green');
        log(`   總英雄數: ${data.globalStats.totalHeroes || 0}`, 'cyan');
        log(`   總聖物數: ${data.globalStats.totalRelics || 0}`, 'cyan');
        log(`   總隊伍數: ${data.globalStats.totalParties || 0}`, 'cyan');
        log(`   總玩家數: ${data.globalStats.totalPlayers || 0}`, 'cyan');
        log(`   總探索次數: ${data.globalStats.totalExpeditions || 0}`, 'cyan');
      }
      
      // 最新數據
      if (data.heros && data.heros.length > 0) {
        log(`\n🦸 最新英雄:`, 'green');
        data.heros.forEach(hero => {
          const time = new Date(Number(hero.createdAt) * 1000).toLocaleString('zh-TW');
          log(`   #${hero.tokenId} - 稀有度: ${hero.rarity}, 戰力: ${hero.power}, 創建: ${time}`, 'cyan');
        });
      }
      
      if (data.parties && data.parties.length > 0) {
        log(`\n👥 最新隊伍:`, 'green');
        data.parties.forEach(party => {
          const time = new Date(Number(party.createdAt) * 1000).toLocaleString('zh-TW');
          log(`   #${party.tokenId} - 戰力: ${party.totalPower}, 容量: ${party.totalCapacity}, 創建: ${time}`, 'cyan');
        });
      }
      
      if (data.expeditions && data.expeditions.length > 0) {
        log(`\n⚔️  最新探索:`, 'green');
        data.expeditions.forEach(exp => {
          const result = exp.success ? '✅ 成功' : '❌ 失敗';
          const time = new Date(Number(exp.timestamp) * 1000).toLocaleString('zh-TW');
          const dungeonId = exp.dungeon ? exp.dungeon.dungeonId : 'N/A';
          log(`   地城 ${dungeonId} - ${result}, 獎勵: ${ethers.formatEther(exp.rewardAmount || '0')} SOUL, 時間: ${time}`, 'cyan');
        });
      }
      
      // 檢查是否有 V12 數據
      const hasV12Data = (data.heros && data.heros.length > 0) || 
                        (data.parties && data.parties.length > 0) || 
                        (data.expeditions && data.expeditions.length > 0);
      
      if (!hasV12Data && data._meta && data._meta.block.number >= START_BLOCK) {
        log(`\n⏳ 子圖已同步到 V12 區塊，但尚無新數據產生`, 'yellow');
        log(`   可能是因為還沒有用戶在 V12 合約上進行操作`, 'yellow');
      }
    }
    
  } catch (error) {
    log(`\n❌ 查詢失敗: ${error.message}`, 'red');
    if (error.response && error.response.data) {
      log(`錯誤詳情: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
  
  log('\n💡 總結:', 'magenta');
  log('   - 子圖正在同步中，請耐心等待', 'magenta');
  log('   - 可以開始在前端測試 V12 功能', 'magenta');
  log('   - 新的交易會立即被索引', 'magenta');
}

checkSubgraphStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });