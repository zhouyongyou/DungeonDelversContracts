#!/usr/bin/env node

/**
 * V25 地址同步腳本
 * 基於 master-config.json 更新所有項目的合約地址
 */

const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔄 V25 合約地址同步');
  console.log('==================\n');
  
  // 讀取主配置
  const masterConfigPath = path.join(__dirname, '../../config/master-config.json');
  if (!fs.existsSync(masterConfigPath)) {
    console.log('❌ 找不到主配置文件');
    return;
  }
  
  const masterConfig = JSON.parse(fs.readFileSync(masterConfigPath, 'utf8'));
  const contracts = masterConfig.contracts.mainnet;
  
  console.log('📋 V25 配置信息:');
  console.log(`   版本: ${masterConfig.version}`);
  console.log(`   起始區塊: ${masterConfig.deployment.startBlock}`);
  console.log(`   子圖版本: ${masterConfig.subgraph.studio.version}`);
  console.log(`   更新時間: ${masterConfig.lastUpdated}`);
  
  console.log('\n🏛️ 新的合約地址:');
  console.log(`   HERO: ${contracts.HERO_ADDRESS}`);
  console.log(`   RELIC: ${contracts.RELIC_ADDRESS}`);
  console.log(`   DUNGEONMASTER: ${contracts.DUNGEONMASTER_ADDRESS}`);
  console.log(`   ALTAROFASCENSION: ${contracts.ALTAROFASCENSION_ADDRESS}`);
  console.log(`   DUNGEONSTORAGE: ${contracts.DUNGEONSTORAGE_ADDRESS}`);
  console.log(`   PARTY: ${contracts.PARTY_ADDRESS}`);
  console.log(`   VRFMANAGER: ${contracts.VRFMANAGER_ADDRESS}`);
  
  // 項目路徑
  const frontendPath = '/Users/sotadic/Documents/GitHub/SoulboundSaga';
  const subgraphPath = '/Users/sotadic/Documents/GitHub/SoulboundSaga/DDgraphql/dungeon-delvers';
  
  console.log('\n🎯 目標項目:');
  
  // 更新前端
  if (fs.existsSync(frontendPath)) {
    console.log('✅ 前端項目存在，開始更新...');
    await updateFrontend(frontendPath, contracts, masterConfig);
  } else {
    console.log('❌ 前端項目不存在');
  }
  
  // 更新子圖
  if (fs.existsSync(subgraphPath)) {
    console.log('✅ 子圖項目存在，開始更新...');
    await updateSubgraph(subgraphPath, contracts, masterConfig);
  } else {
    console.log('❌ 子圖項目不存在');
  }
  
  console.log('\n🎉 V25 地址同步完成！');
}

async function updateFrontend(frontendPath, contracts, masterConfig) {
  const contractsConfigPath = path.join(frontendPath, 'src/config/contracts.ts');
  
  if (!fs.existsSync(contractsConfigPath)) {
    console.log('   ❌ 前端配置文件不存在');
    return;
  }
  
  let contractsConfig = fs.readFileSync(contractsConfigPath, 'utf8');
  
  // 更新合約地址
  const updates = [
    ['HERO', contracts.HERO_ADDRESS],
    ['RELIC', contracts.RELIC_ADDRESS],
    ['DUNGEONMASTER', contracts.DUNGEONMASTER_ADDRESS],
    ['ALTAROFASCENSION', contracts.ALTAROFASCENSION_ADDRESS],
    ['DUNGEONSTORAGE', contracts.DUNGEONSTORAGE_ADDRESS],
    ['PARTY', contracts.PARTY_ADDRESS],
    ['VRFMANAGER', contracts.VRFMANAGER_ADDRESS],
    ['DUNGEONCORE', contracts.DUNGEONCORE_ADDRESS],
    ['PLAYERVAULT', contracts.PLAYERVAULT_ADDRESS],
    ['PLAYERPROFILE', contracts.PLAYERPROFILE_ADDRESS],
    ['VIPSTAKING', contracts.VIPSTAKING_ADDRESS],
    ['ORACLE', contracts.ORACLE_ADDRESS]
  ];
  
  updates.forEach(([name, address]) => {
    const pattern = new RegExp(`(${name}:\\s*')([^']+)(')`);
    if (contractsConfig.match(pattern)) {
      contractsConfig = contractsConfig.replace(pattern, `$1${address}$3`);
      console.log(`   ✅ 更新 ${name}: ${address}`);
    }
  });
  
  // 保存文件
  fs.writeFileSync(contractsConfigPath, contractsConfig);
  console.log('   💾 前端配置文件保存完成');
}

async function updateSubgraph(subgraphPath, contracts, masterConfig) {
  // 更新子圖配置文件
  const configFiles = [
    'subgraph.yaml',
    'networks.json',
    'src/utils/constants.ts'
  ];
  
  configFiles.forEach(filename => {
    const filePath = path.join(subgraphPath, filename);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // 更新起始區塊
      content = content.replace(
        /startBlock:\s*\d+/g, 
        `startBlock: ${masterConfig.deployment.startBlock}`
      );
      
      // 更新合約地址
      Object.entries(contracts).forEach(([key, address]) => {
        const contractName = key.replace('_ADDRESS', '').toLowerCase();
        content = content.replace(
          new RegExp(`${contractName}:.*0x[a-fA-F0-9]{40}`, 'gi'),
          `${contractName}: ${address}`
        );
      });
      
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ 更新 ${filename}`);
    }
  });
  
  console.log('   💾 子圖配置文件保存完成');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ 同步失敗:', error);
    process.exit(1);
  });