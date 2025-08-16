// Check DungeonDelvers subgraph sync status
const axios = require('axios');
const { ethers } = require('hardhat');

// Color output helpers
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
  log('\n📊 Checking DungeonDelvers Subgraph Sync Status...', 'cyan');
  log('==========================================\n', 'cyan');
  
  const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.5';
  const START_BLOCK = 54670894; // V12 deployment block
  const BSC_BLOCK_TIME = 3; // seconds per block on BSC
  
  try {
    // 1. Get current BSC block
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
    const currentBlock = await provider.getBlockNumber();
    const currentBlockData = await provider.getBlock(currentBlock);
    log(`🔗 BSC Current Block: ${currentBlock.toLocaleString()}`, 'yellow');
    log(`   Block Time: ${new Date(currentBlockData.timestamp * 1000).toLocaleString()}`, 'cyan');
    
    // 2. Query subgraph meta info
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
      log('\n❌ Subgraph Query Errors:', 'red');
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
      
      log('\n📍 Subgraph Status:', 'yellow');
      log(`   Synced Block: ${subgraphBlock.toLocaleString()}`, 'green');
      log(`   Block Time: ${new Date(blockTimestamp * 1000).toLocaleString()}`, 'green');
      log(`   Deployment ID: ${meta.deployment}`, 'cyan');
      log(`   Indexing Errors: ${hasErrors ? '❌ Has Errors' : '✅ No Errors'}`, hasErrors ? 'red' : 'green');
      
      // Calculate sync progress
      const blocksBehind = currentBlock - subgraphBlock;
      const timeBehind = blocksBehind * BSC_BLOCK_TIME;
      const minutesBehind = Math.floor(timeBehind / 60);
      const secondsBehind = timeBehind % 60;
      
      log('\n📈 Sync Progress:', 'yellow');
      log(`   Start Block: ${START_BLOCK.toLocaleString()} (V12 Deployment)`, 'cyan');
      log(`   Blocks Behind: ${blocksBehind.toLocaleString()}`, blocksBehind < 50 ? 'green' : 'yellow');
      log(`   Time Behind: ${minutesBehind}m ${secondsBehind}s`, blocksBehind < 50 ? 'green' : 'yellow');
      
      if (subgraphBlock >= START_BLOCK) {
        const syncedBlocks = subgraphBlock - START_BLOCK;
        const totalBlocks = currentBlock - START_BLOCK;
        const syncProgress = (syncedBlocks / totalBlocks * 100).toFixed(2);
        log(`   Progress: ${syncProgress}%`, parseFloat(syncProgress) > 95 ? 'green' : 'yellow');
        
        if (blocksBehind < 50) {
          log('\n✅ Subgraph is fully synced!', 'green');
          log('   New transactions will appear within 1-2 minutes', 'green');
        } else {
          // Estimate sync speed
          const syncSpeed = 10; // blocks per second (typical subgraph speed)
          const catchUpTime = Math.ceil(blocksBehind / syncSpeed / 60);
          log(`   Estimated catch-up time: ~${catchUpTime} minutes`, 'yellow');
        }
      } else {
        log('   ⏳ Still syncing to start block...', 'yellow');
        const blocksToStart = START_BLOCK - subgraphBlock;
        const syncSpeed = 10;
        const timeToStart = Math.ceil(blocksToStart / syncSpeed / 60);
        log(`   Blocks to start: ${blocksToStart.toLocaleString()}`, 'yellow');
        log(`   Estimated time to start: ~${timeToStart} minutes`, 'yellow');
      }
      
      // 3. Query some basic data to verify
      log('\n📊 Verifying Data Access...', 'yellow');
      
      const dataQuery = `
        {
          players(first: 1) {
            id
          }
          heros(first: 1) {
            id
            tokenId
          }
          relics(first: 1) {
            id
            tokenId
          }
          parties(first: 1) {
            id
            tokenId
          }
          expeditions(first: 5, orderBy: timestamp, orderDirection: desc) {
            id
            player {
              id
            }
            partyId
            dungeonId
            success
            timestamp
          }
        }
      `;
      
      const dataResponse = await axios.post(SUBGRAPH_URL, {
        query: dataQuery
      });
      
      if (dataResponse.data.data) {
        const data = dataResponse.data.data;
        
        log('   Players: ' + (data.players.length > 0 ? '✅ Available' : '⏳ No data yet'), 'cyan');
        log('   Heroes: ' + (data.heros.length > 0 ? '✅ Available' : '⏳ No data yet'), 'cyan');
        log('   Relics: ' + (data.relics.length > 0 ? '✅ Available' : '⏳ No data yet'), 'cyan');
        log('   Parties: ' + (data.parties.length > 0 ? '✅ Available' : '⏳ No data yet'), 'cyan');
        log('   Expeditions: ' + data.expeditions.length + ' found', 'cyan');
        
        // Show recent expeditions if any
        if (data.expeditions.length > 0) {
          log('\n⚔️  Recent Expeditions:', 'green');
          data.expeditions.forEach(exp => {
            const time = new Date(Number(exp.timestamp) * 1000).toLocaleString();
            const result = exp.success ? '✅ Success' : '❌ Failed';
            log(`   Dungeon ${exp.dungeonId} - ${result} - ${time}`, 'cyan');
          });
        }
      }
      
    } else {
      log('❌ Unable to retrieve subgraph metadata', 'red');
    }
    
  } catch (error) {
    log(`\n❌ Query Failed: ${error.message}`, 'red');
    if (error.response && error.response.data) {
      log(`Error Details: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    }
  }
  
  log('\n💡 Summary:', 'magenta');
  log('   - BSC Average Block Time: ~3 seconds', 'magenta');
  log('   - Subgraph Sync Speed: ~10 blocks/second', 'magenta');
  log('   - New transactions typically appear within 1-2 minutes when synced', 'magenta');
  log('   - Check detailed logs at: https://thegraph.com/studio/subgraph/dungeon-delvers', 'magenta');
}

checkSubgraphStatus()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });