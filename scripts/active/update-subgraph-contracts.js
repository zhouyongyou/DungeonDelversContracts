const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔄 更新子圖項目合約配置');
  console.log('======================\n');
  
  const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers';
  
  // 新的合約地址
  const newAddresses = {
    Hero: {
      address: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
      startBlock: 45200000
    },
    Relic: {
      address: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739', 
      startBlock: 45200000
    },
    VRFManagerV2Plus: {
      address: '0xD95d0A29055E810e9f8c64073998832d66538176',
      startBlock: 45200000
    }
  };
  
  console.log('📝 新的合約地址:');
  Object.entries(newAddresses).forEach(([name, config]) => {
    console.log(`   ${name}: ${config.address} (block: ${config.startBlock})`);
  });
  
  if (!fs.existsSync(subgraphPath)) {
    console.log(`❌ 子圖項目不存在: ${subgraphPath}`);
    return;
  }
  
  // 1. 複製 ABI 文件
  console.log('\n📦 複製 ABI 文件...');
  const abiSources = {
    Hero: '../../../DungeonDelversContracts/artifacts/contracts/current/nft/Hero.sol/Hero.json',
    Relic: '../../../DungeonDelversContracts/artifacts/contracts/current/nft/Relic.sol/Relic.json',
    VRFManagerV2Plus: '../../../DungeonDelversContracts/artifacts/contracts/current/core/VRFManagerV2Plus.sol/VRFManagerV2Plus.json',
    IVRFManager: '../../../DungeonDelversContracts/artifacts/contracts/current/interfaces/interfaces.sol/IVRFManager.json'
  };
  
  const abiDir = path.join(subgraphPath, 'abis');
  
  Object.entries(abiSources).forEach(([name, sourcePath]) => {
    try {
      const fullSourcePath = path.resolve(subgraphPath, sourcePath);
      const targetPath = path.join(abiDir, `${name}.json`);
      
      if (fs.existsSync(fullSourcePath)) {
        fs.copyFileSync(fullSourcePath, targetPath);
        console.log(`   ✅ 複製 ${name}.json`);
      } else {
        console.log(`   ❌ 來源文件不存在: ${fullSourcePath}`);
      }
    } catch (error) {
      console.log(`   ❌ 複製 ${name}.json 失敗: ${error.message}`);
    }
  });
  
  // 2. 更新 networks.json
  console.log('\n📝 更新 networks.json...');
  const networksPath = path.join(subgraphPath, 'networks.json');
  
  if (fs.existsSync(networksPath)) {
    try {
      const networks = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
      
      if (networks.bsc) {
        // 更新 Hero 和 Relic 地址
        Object.entries(newAddresses).forEach(([contractName, config]) => {
          if (networks.bsc[contractName]) {
            networks.bsc[contractName].address = config.address;
            networks.bsc[contractName].startBlock = config.startBlock;
            console.log(`   ✅ 更新 ${contractName}`);
          } else {
            networks.bsc[contractName] = {
              address: config.address,
              startBlock: config.startBlock
            };
            console.log(`   ✅ 新增 ${contractName}`);
          }
        });
        
        // 備份原檔案
        const backupPath = networksPath + `.backup-${Date.now()}`;
        fs.copyFileSync(networksPath, backupPath);
        
        // 寫入更新
        fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
        console.log('   ✅ networks.json 更新完成');
        console.log(`   💾 備份保存至: ${path.basename(backupPath)}`);
      } else {
        console.log('   ❌ networks.json 中未找到 bsc 配置');
      }
    } catch (error) {
      console.log(`   ❌ networks.json 更新失敗: ${error.message}`);
    }
  } else {
    console.log('   ❌ networks.json 不存在');
  }
  
  // 3. 檢查 subgraph.yaml 是否需要更新
  console.log('\n🔍 檢查 subgraph.yaml...');
  const subgraphYamlPath = path.join(subgraphPath, 'subgraph.yaml');
  
  if (fs.existsSync(subgraphYamlPath)) {
    const subgraphYaml = fs.readFileSync(subgraphYamlPath, 'utf8');
    
    // 檢查是否包含 Hero 和 Relic 配置
    const hasHero = subgraphYaml.includes('Hero');
    const hasRelic = subgraphYaml.includes('Relic');
    const hasVRF = subgraphYaml.includes('VRFManager');
    
    console.log(`   Hero 配置: ${hasHero ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   Relic 配置: ${hasRelic ? '✅ 存在' : '❌ 缺失'}`);
    console.log(`   VRF Manager 配置: ${hasVRF ? '✅ 存在' : '❌ 缺失'}`);
    
    if (!hasVRF) {
      console.log('   ⚠️ 需要手動添加 VRFManagerV2Plus 到 subgraph.yaml');
    }
  } else {
    console.log('   ❌ subgraph.yaml 不存在');
  }
  
  // 4. 生成部署建議
  console.log('\n📋 子圖部署建議:');
  console.log('================');
  
  console.log('📦 已更新的文件:');
  console.log('  ✅ abis/Hero.json');
  console.log('  ✅ abis/Relic.json');
  console.log('  ✅ abis/VRFManagerV2Plus.json');
  console.log('  ✅ networks.json');
  
  console.log('\n🚀 部署步驟:');
  console.log('1. 檢查 subgraph.yaml 是否正確引用新的 ABI');
  console.log('2. 如果需要，添加 VRFManagerV2Plus 數據源到 subgraph.yaml');
  console.log('3. 重新生成程式碼: npm run codegen');
  console.log('4. 構建子圖: npm run build');
  console.log('5. 部署子圖: npm run deploy');
  
  console.log('\n📝 新的合約地址 (供參考):');
  Object.entries(newAddresses).forEach(([name, config]) => {
    console.log(`  ${name}: ${config.address}`);
  });
  
  console.log('\n⚠️ 注意事項:');
  console.log('- 由於合約地址變更，子圖將重新索引');
  console.log('- 舊數據可能不會自動遷移');
  console.log('- 建議在測試網先驗證子圖正常工作');
  
  console.log('\n✅ 子圖合約配置更新完成！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });