// 詳細檢查子圖同步狀態
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
  log('\n📊 詳細檢查 DungeonDelvers 子圖同步狀態...', 'cyan');
  log('=========================================\n', 'cyan');
  
  const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.5';
  const START_BLOCK = 54670894; // V12 部署區塊
  
  try {
    // 1. 獲取當前 BSC 區塊
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
    const currentBlock = await provider.getBlockNumber();
    log(`🔗 BSC 當前區塊: ${currentBlock.toLocaleString()}`, 'yellow');
    
    // 2. 查詢子圖的 meta 資訊
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
    
    if (response.data.errors) {
      log('❌ 子圖查詢錯誤:', 'red');
      response.data.errors.forEach(error => {
        log(`   ${error.message}`, 'red');
      });
      return;
    }
    
    if (response.data.data && response.data.data._meta) {
      const meta = response.data.data._meta;
      const subgraphBlock = meta.block.number;
      const blockTimestamp = meta.block.timestamp;
      const hasErrors = meta.hasIndexingErrors;
      
      log('\n📍 子圖狀態:', 'yellow');
      log(`   同步區塊: ${subgraphBlock.toLocaleString()}`, 'green');
      log(`   區塊時間: ${new Date(blockTimestamp * 1000).toLocaleString('zh-TW')}`, 'green');
      log(`   部署 ID: ${meta.deployment}`, 'cyan');
      log(`   索引錯誤: ${hasErrors ? '❌ 有錯誤' : '✅ 無錯誤'}`, hasErrors ? 'red' : 'green');
      
      // 計算同步進度
      if (subgraphBlock < START_BLOCK) {
        log(`\n⏳ 子圖正在同步到起始區塊 ${START_BLOCK.toLocaleString()}...`, 'yellow');
        const blocksToStart = START_BLOCK - subgraphBlock;
        log(`   距離起始區塊: ${blocksToStart.toLocaleString()} 個區塊`, 'yellow');
      } else {
        const syncedBlocks = subgraphBlock - START_BLOCK;
        const totalBlocks = currentBlock - START_BLOCK;
        const syncProgress = (syncedBlocks / totalBlocks * 100).toFixed(2);
        const blocksBehind = currentBlock - subgraphBlock;
        
        log(`\n📈 同步進度:`, 'yellow');
        log(`   起始區塊: ${START_BLOCK.toLocaleString()} (V12 部署)`, 'cyan');
        log(`   已同步: ${syncedBlocks.toLocaleString()} 個區塊`, 'cyan');
        log(`   總區塊數: ${totalBlocks.toLocaleString()}`, 'cyan');
        log(`   進度: ${syncProgress}%`, blocksBehind < 10 ? 'green' : 'yellow');
        log(`   落後區塊: ${blocksBehind.toLocaleString()}`, blocksBehind < 10 ? 'green' : 'yellow');
        
        if (blocksBehind < 10) {
          log(`\n✅ 子圖已追上最新區塊！`, 'green');
        } else {
          // 估算剩餘時間 (BSC 約 3 秒一個區塊，子圖處理速度約 10 區塊/秒)
          const catchUpTime = blocksBehind / 10; // 秒
          const minutes = Math.floor(catchUpTime / 60);
          const seconds = Math.floor(catchUpTime % 60);
          log(`   預估追上時間: ${minutes} 分 ${seconds} 秒`, 'yellow');
        }
      }
      
      // 3. 查詢實際數據
      log(`\n📊 查詢實際數據...`, 'yellow');
      
      const dataQuery = `
        {
          globalStats(id: "global") {
            totalHeroes
            totalRelics
            totalParties
            totalPlayers
            totalExpeditions
          }
          heroes(first: 3, orderBy: blockNumber, orderDirection: desc) {
            id
            tokenId
            owner
            rarity
            power
            blockNumber
          }
          parties(first: 3, orderBy: blockNumber, orderDirection: desc) {
            id
            tokenId
            owner
            totalPower
            totalCapacity
            blockNumber
          }
          expeditions(first: 5, orderBy: blockNumber, orderDirection: desc) {
            id
            player
            partyId
            dungeonId
            success
            rewardAmount
            blockNumber
          }
        }
      `;
      
      const dataResponse = await axios.post(SUBGRAPH_URL, {
        query: dataQuery
      });
      
      if (dataResponse.data.data) {
        const data = dataResponse.data.data;
        
        // 全局統計
        if (data.globalStats) {
          log(`\n📈 全局統計:`, 'green');
          log(`   總英雄數: ${data.globalStats.totalHeroes || 0}`, 'cyan');
          log(`   總聖物數: ${data.globalStats.totalRelics || 0}`, 'cyan');
          log(`   總隊伍數: ${data.globalStats.totalParties || 0}`, 'cyan');
          log(`   總玩家數: ${data.globalStats.totalPlayers || 0}`, 'cyan');
          log(`   總探索次數: ${data.globalStats.totalExpeditions || 0}`, 'cyan');
        }
        
        // 最新英雄
        if (data.heroes.length > 0) {
          log(`\n🦸 最新英雄 (共 ${data.heroes.length} 個):`, 'green');
          data.heroes.forEach(hero => {
            log(`   #${hero.tokenId} - 稀有度: ${hero.rarity}, 戰力: ${hero.power}, 區塊: ${hero.blockNumber}`, 'cyan');
          });
        }
        
        // 最新隊伍
        if (data.parties.length > 0) {
          log(`\n👥 最新隊伍 (共 ${data.parties.length} 個):`, 'green');
          data.parties.forEach(party => {
            log(`   #${party.tokenId} - 戰力: ${party.totalPower}, 容量: ${party.totalCapacity}, 區塊: ${party.blockNumber}`, 'cyan');
          });
        }
        
        // 最新探索
        if (data.expeditions.length > 0) {
          log(`\n⚔️  最新探索 (共 ${data.expeditions.length} 次):`, 'green');
          data.expeditions.forEach(exp => {
            const result = exp.success ? '✅ 成功' : '❌ 失敗';
            log(`   地城 ${exp.dungeonId} - ${result}, 獎勵: ${ethers.formatEther(exp.rewardAmount || '0')} SOUL, 區塊: ${exp.blockNumber}`, 'cyan');
          });
        }
        
        if (data.heroes.length === 0 && data.parties.length === 0) {
          log(`\n⏳ 尚無 V12 數據，子圖可能還在同步中...`, 'yellow');
        }
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
  
  log('\n📌 重要提醒:', 'magenta');
  log('   - 子圖需要時間索引歷史區塊', 'magenta');
  log('   - 可以訪問 https://thegraph.com/studio/subgraph/dungeon-delvers 查看詳細日誌', 'magenta');
  log('   - 如果長時間卡住，可能需要檢查子圖配置', 'magenta');
}

checkSubgraphStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });