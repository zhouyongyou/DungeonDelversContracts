const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔄 同步 ABI 和地址到各項目');
  console.log('========================\n');
  
  // 新的合約地址
  const newAddresses = {
    VRF_MANAGER: '0xD95d0A29055E810e9f8c64073998832d66538176',
    HERO: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    RELIC: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739'
  };
  
  console.log('📝 新的合約地址:');
  Object.entries(newAddresses).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  // 項目路徑
  const projects = {
    frontend: '/Users/sotadic/Documents/GitHub/DungeonDelvers',
    subgraph: '/Users/sotadic/Documents/GitHub/DungeonDelversSubgraph'
  };
  
  console.log('\n🎯 目標項目:');
  Object.entries(projects).forEach(([name, path]) => {
    console.log(`   ${name}: ${path}`);
    if (fs.existsSync(path)) {
      console.log(`   ✅ ${name} 項目存在`);
    } else {
      console.log(`   ❌ ${name} 項目不存在`);
    }
  });
  
  // ABI 來源路徑
  const abiSources = {
    Hero: 'artifacts/contracts/current/nft/Hero.sol/Hero.json',
    Relic: 'artifacts/contracts/current/nft/Relic.sol/Relic.json', 
    VRFManagerV2Plus: 'artifacts/contracts/current/core/VRFManagerV2Plus.sol/VRFManagerV2Plus.json',
    IVRFManager: 'artifacts/contracts/current/interfaces/interfaces.sol/IVRFManager.json'
  };
  
  console.log('\n📦 檢查 ABI 來源文件:');
  let allAbisExist = true;
  Object.entries(abiSources).forEach(([name, sourcePath]) => {
    if (fs.existsSync(sourcePath)) {
      console.log(`   ✅ ${name}: ${sourcePath}`);
    } else {
      console.log(`   ❌ ${name}: ${sourcePath} (不存在)`);
      allAbisExist = false;
    }
  });
  
  if (!allAbisExist) {
    console.log('\n⚠️ 部分 ABI 文件不存在，需要先編譯合約');
    console.log('請執行: npx hardhat compile');
    return;
  }
  
  // 複製 ABI 到前端項目
  if (fs.existsSync(projects.frontend)) {
    console.log('\n🔄 更新前端項目 ABI...');
    const frontendAbiDir = path.join(projects.frontend, 'src/lib/abis');
    
    if (!fs.existsSync(frontendAbiDir)) {
      console.log(`   創建目錄: ${frontendAbiDir}`);
      fs.mkdirSync(frontendAbiDir, { recursive: true });
    }
    
    Object.entries(abiSources).forEach(([name, sourcePath]) => {
      try {
        const targetPath = path.join(frontendAbiDir, `${name}.json`);
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`   ✅ 複製 ${name}.json`);
      } catch (error) {
        console.log(`   ❌ 複製 ${name}.json 失敗: ${error.message}`);
      }
    });
    
    // 更新前端合約地址配置
    const contractsConfigPath = path.join(projects.frontend, 'src/lib/contracts.ts');
    if (fs.existsSync(contractsConfigPath)) {
      console.log('\n📝 更新前端合約地址配置...');
      let contractsConfig = fs.readFileSync(contractsConfigPath, 'utf8');
      
      // 更新地址 (使用正則表達式)
      contractsConfig = contractsConfig.replace(
        /HERO:\s*['"`]0x[a-fA-F0-9]{40}['"`]/g, 
        `HERO: '${newAddresses.HERO}'`
      );
      contractsConfig = contractsConfig.replace(
        /RELIC:\s*['"`]0x[a-fA-F0-9]{40}['"`]/g, 
        `RELIC: '${newAddresses.RELIC}'`
      );
      contractsConfig = contractsConfig.replace(
        /VRF_MANAGER:\s*['"`]0x[a-fA-F0-9]{40}['"`]/g, 
        `VRF_MANAGER: '${newAddresses.VRF_MANAGER}'`
      );
      
      fs.writeFileSync(contractsConfigPath, contractsConfig);
      console.log('   ✅ contracts.ts 更新完成');
    } else {
      console.log('   ⚠️ 未找到 contracts.ts，請手動更新地址配置');
    }
  } else {
    console.log('\n⚠️ 前端項目不存在，跳過前端更新');
  }
  
  // 複製 ABI 到子圖項目
  if (fs.existsSync(projects.subgraph)) {
    console.log('\n🔄 更新子圖項目 ABI...');
    const subgraphAbiDir = path.join(projects.subgraph, 'abis');
    
    if (!fs.existsSync(subgraphAbiDir)) {
      console.log(`   創建目錄: ${subgraphAbiDir}`);
      fs.mkdirSync(subgraphAbiDir, { recursive: true });
    }
    
    Object.entries(abiSources).forEach(([name, sourcePath]) => {
      try {
        const targetPath = path.join(subgraphAbiDir, `${name}.json`);
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`   ✅ 複製 ${name}.json`);
      } catch (error) {
        console.log(`   ❌ 複製 ${name}.json 失敗: ${error.message}`);
      }
    });
    
    // 更新子圖網絡配置
    const networksPath = path.join(projects.subgraph, 'networks.json');
    if (fs.existsSync(networksPath)) {
      console.log('\n📝 更新子圖網絡配置...');
      try {
        const networks = JSON.parse(fs.readFileSync(networksPath, 'utf8'));
        
        if (networks.bsc) {
          networks.bsc.Hero = {
            address: newAddresses.HERO,
            startBlock: 45200000 // 估計的區塊號
          };
          networks.bsc.Relic = {
            address: newAddresses.RELIC,
            startBlock: 45200000
          };
          
          fs.writeFileSync(networksPath, JSON.stringify(networks, null, 2));
          console.log('   ✅ networks.json 更新完成');
        }
      } catch (error) {
        console.log(`   ❌ networks.json 更新失敗: ${error.message}`);
      }
    } else {
      console.log('   ⚠️ 未找到 networks.json，請手動更新網絡配置');
    }
  } else {
    console.log('\n⚠️ 子圖項目不存在，跳過子圖更新');
  }
  
  // 生成配置摘要
  console.log('\n📋 配置摘要:');
  console.log('================');
  console.log('新合約地址:');
  Object.entries(newAddresses).forEach(([name, address]) => {
    console.log(`  ${name} = "${address}"`);
  });
  
  console.log('\n📦 ABI 文件已更新:');
  console.log('  - Hero.json');
  console.log('  - Relic.json');
  console.log('  - VRFManagerV2Plus.json');
  console.log('  - IVRFManager.json');
  
  console.log('\n🎯 後續步驟:');
  console.log('1. 檢查前端項目是否正確讀取新地址');
  console.log('2. 重新部署子圖使用新的合約地址');
  console.log('3. 用戶需要重新授權 SOUL 代幣給新合約');
  console.log('4. 測試前端鑄造功能');
  
  console.log('\n✅ ABI 和地址同步完成！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });