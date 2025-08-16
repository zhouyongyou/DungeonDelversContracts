#!/usr/bin/env node

// 更新子圖到 V23 配置

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const v23Config = require('../../config/v23-config');

async function updateSubgraphV23() {
  console.log('🔧 更新子圖到 V23 配置...\n');
  
  const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
  
  try {
    // 讀取現有的 subgraph.yaml
    const yamlContent = fs.readFileSync(subgraphPath, 'utf8');
    const subgraph = yaml.load(yamlContent);
    
    // 備份
    const backupPath = subgraphPath + `.backup-${Date.now()}`;
    fs.writeFileSync(backupPath, yamlContent);
    console.log(`📋 已備份: ${backupPath}`);
    
    // 更新地址
    const addressMap = {
      'Hero': v23Config.contracts.HERO.address,
      'Relic': v23Config.contracts.RELIC.address,
      'Party': v23Config.contracts.PARTY.address,
      'VIPStaking': v23Config.contracts.VIPSTAKING.address,
      'PlayerProfile': v23Config.contracts.PLAYERPROFILE.address,
      'AltarOfAscension': v23Config.contracts.ALTAROFASCENSION.address,
      'DungeonMasterV8': v23Config.contracts.DUNGEONMASTER.address
    };
    
    // 獲取部署區塊（可以從部署日誌中讀取，這裡先用一個估計值）
    const startBlock = 55620000; // V23 部署的大概區塊
    
    // 更新每個數據源
    subgraph.dataSources.forEach(dataSource => {
      const name = dataSource.name;
      if (addressMap[name]) {
        console.log(`\n📌 更新 ${name}:`);
        console.log(`  舊地址: ${dataSource.source.address}`);
        console.log(`  新地址: ${addressMap[name]}`);
        dataSource.source.address = addressMap[name];
        dataSource.source.startBlock = startBlock;
      }
    });
    
    // 添加或更新 DungeonMaster
    const dungeonMasterIndex = subgraph.dataSources.findIndex(ds => ds.name === 'DungeonMasterV8');
    
    const dungeonMasterDataSource = {
      kind: 'ethereum/contract',
      name: 'DungeonMasterV8',
      network: 'bsc',
      source: {
        address: v23Config.contracts.DUNGEONMASTER.address,
        abi: 'DungeonMaster',
        startBlock: startBlock
      },
      mapping: {
        kind: 'ethereum/events',
        apiVersion: '0.0.6',
        language: 'wasm/assemblyscript',
        entities: [
          'DungeonExploration',
          'Player',
          'Hero',
          'Relic',
          'Party'
        ],
        abis: [
          {
            name: 'DungeonMaster',
            file: './abis/DungeonMaster.json'
          }
        ],
        eventHandlers: [
          {
            event: 'ExpeditionFulfilled(indexed uint256,indexed uint256,bool,uint256,uint256,uint256)',
            handler: 'handleExpeditionFulfilled'
          },
          {
            event: 'RewardsBanked(indexed address,uint256)',
            handler: 'handleRewardsBanked'
          },
          {
            event: 'DungeonSet(uint256,tuple)',
            handler: 'handleDungeonSet'
          }
        ],
        file: './src/dungeon-master.ts'
      }
    };
    
    if (dungeonMasterIndex >= 0) {
      subgraph.dataSources[dungeonMasterIndex] = dungeonMasterDataSource;
      console.log('\n✅ 更新了 DungeonMaster 數據源');
    } else {
      subgraph.dataSources.push(dungeonMasterDataSource);
      console.log('\n✅ 添加了 DungeonMaster 數據源');
    }
    
    // 添加註釋
    const header = `# Generated from v23-config.js on ${new Date().toISOString()}
# DO NOT EDIT MANUALLY - Use npm run sync:config
`;
    
    // 寫回文件
    const newYamlContent = header + yaml.dump(subgraph, {
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
    
    fs.writeFileSync(subgraphPath, newYamlContent);
    console.log('\n✅ 已更新 subgraph.yaml');
    
    // 檢查 mapping 文件
    console.log('\n📊 檢查 mapping 文件:');
    const mappingFiles = [
      'hero.ts',
      'relic.ts',
      'party.ts',
      'vip-staking.ts',
      'player-profile.ts',
      'altar-of-ascension.ts',
      'dungeon-master.ts'
    ];
    
    const srcPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/src/';
    
    mappingFiles.forEach(file => {
      const filePath = path.join(srcPath, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 檢查是否有 ProvisionsBought 處理器
        if (content.includes('handleProvisionsBought')) {
          console.log(`  ⚠️ ${file}: 包含 handleProvisionsBought，需要移除`);
        }
        
        // 檢查是否有 BatchMintCompleted 處理器
        if (file === 'hero.ts' || file === 'relic.ts') {
          if (!content.includes('handleBatchMintCompleted')) {
            console.log(`  ⚠️ ${file}: 缺少 handleBatchMintCompleted 處理器`);
          } else {
            console.log(`  ✅ ${file}: 已包含 handleBatchMintCompleted`);
          }
        }
      } else {
        console.log(`  ❌ ${file}: 文件不存在`);
      }
    });
    
    console.log('\n💡 下一步:');
    console.log('1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers');
    console.log('2. npm run codegen');
    console.log('3. npm run build');
    console.log('4. npm run deploy');
    
    console.log('\n⚠️ 注意事項:');
    console.log('- 確保移除 dungeon-master.ts 中的 handleProvisionsBought');
    console.log('- 確保 Hero 和 Relic 的 handleBatchMintCompleted 正確實現');
    console.log('- 可能需要調整 startBlock 到實際部署區塊');
    
  } catch (error) {
    console.error('❌ 錯誤:', error.message);
  }
}

// 執行更新
if (require.main === module) {
  updateSubgraphV23();
}

module.exports = { updateSubgraphV23 };