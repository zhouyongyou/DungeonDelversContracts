const fs = require('fs');
const path = require('path');

async function main() {
  console.log('🔄 更新前端項目合約配置');
  console.log('======================\n');
  
  const frontendPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers';
  const contractsConfigPath = path.join(frontendPath, 'src/config/contracts.ts');
  
  // 新的合約地址
  const newAddresses = {
    HERO: '0x575e7407C06ADeb47067AD19663af50DdAe460CF',
    RELIC: '0x36cC82c8fb1c71c4B37eC5E6454960e09a5DC739',
    VRFMANAGER: '0xD95d0A29055E810e9f8c64073998832d66538176'
  };
  
  console.log('📝 新的合約地址:');
  Object.entries(newAddresses).forEach(([name, address]) => {
    console.log(`   ${name}: ${address}`);
  });
  
  if (!fs.existsSync(contractsConfigPath)) {
    console.log(`❌ 找不到配置文件: ${contractsConfigPath}`);
    return;
  }
  
  console.log(`\n📂 讀取配置文件: ${contractsConfigPath}`);
  let contractsConfig = fs.readFileSync(contractsConfigPath, 'utf8');
  
  console.log('\n🔄 更新合約地址...');
  
  // 更新每個地址
  Object.entries(newAddresses).forEach(([contractName, newAddress]) => {
    // 查找當前地址
    const regex = new RegExp(`(${contractName}:\\s*['"\`])0x[a-fA-F0-9]{40}(['"\`])`, 'g');
    const matches = contractsConfig.match(regex);
    
    if (matches) {
      console.log(`   找到 ${contractName}:`, matches[0]);
      contractsConfig = contractsConfig.replace(regex, `$1${newAddress}$2`);
      console.log(`   ✅ ${contractName} 更新為: ${newAddress}`);
    } else {
      console.log(`   ⚠️ 未找到 ${contractName} 配置`);
    }
  });
  
  // 更新版本信息和註釋
  const currentDate = new Date().toISOString();
  contractsConfig = contractsConfig.replace(
    /\/\/ Generated on .*/,
    `// Generated on ${currentDate}`
  );
  
  contractsConfig = contractsConfig.replace(
    /\/\/ V25 Contract Configuration/,
    '// V25 Fixed Contract Configuration - #1002 Error Fixed'
  );
  
  // 在註釋中添加修復信息
  const fixedComment = `// V25 Fixed Contract Configuration - #1002 Error Fixed
// Generated on ${currentDate}
// DO NOT EDIT MANUALLY - Use sync scripts to update
// 
// FIXED CONTRACTS (2025-01-08):
// - HERO: Fixed VRF fee calculation logic
// - RELIC: Fixed VRF fee calculation logic  
// - VRFMANAGER: Added detailed error messages`;
  
  contractsConfig = contractsConfig.replace(
    /\/\/ V25 Fixed Contract Configuration - #1002 Error Fixed[\s\S]*?(?=\n\nimport)/,
    fixedComment
  );
  
  console.log('\n💾 保存更新的配置文件...');
  fs.writeFileSync(contractsConfigPath, contractsConfig);
  console.log('   ✅ contracts.ts 更新完成');
  
  // 檢查其他可能的配置文件
  console.log('\n🔍 檢查其他配置文件...');
  
  const otherConfigFiles = [
    'src/config/contractsV2.ts',
    'src/config/contractsWithABI.ts',
    'src/config/master-config.ts'
  ];
  
  otherConfigFiles.forEach(relativePath => {
    const filePath = path.join(frontendPath, relativePath);
    if (fs.existsSync(filePath)) {
      console.log(`   📂 找到: ${relativePath}`);
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        let updated = false;
        
        Object.entries(newAddresses).forEach(([contractName, newAddress]) => {
          const regex = new RegExp(`(['"\`])0x[a-fA-F0-9]{40}(['"\`])(?=.*${contractName})`, 'g');
          if (content.includes(contractName) && regex.test(content)) {
            content = content.replace(
              new RegExp(`(${contractName}[^'"\`]*['"\`])0x[a-fA-F0-9]{40}(['"\`])`, 'g'),
              `$1${newAddress}$2`
            );
            updated = true;
          }
        });
        
        if (updated) {
          fs.writeFileSync(filePath, content);
          console.log(`   ✅ ${relativePath} 更新完成`);
        } else {
          console.log(`   ➡️ ${relativePath} 無需更新`);
        }
      } catch (error) {
        console.log(`   ❌ ${relativePath} 更新失敗: ${error.message}`);
      }
    } else {
      console.log(`   ➡️ ${relativePath} 不存在`);
    }
  });
  
  // 檢查 ABI 導入是否正確
  console.log('\n🔍 檢查 ABI 文件...');
  const abiDir = path.join(frontendPath, 'src/lib/abis');
  const requiredAbis = ['Hero.json', 'Relic.json', 'VRFManagerV2Plus.json', 'IVRFManager.json'];
  
  requiredAbis.forEach(abiFile => {
    const abiPath = path.join(abiDir, abiFile);
    if (fs.existsSync(abiPath)) {
      console.log(`   ✅ ${abiFile} 存在`);
    } else {
      console.log(`   ❌ ${abiFile} 缺失`);
    }
  });
  
  // 生成驗證摘要
  console.log('\n📋 更新摘要:');
  console.log('================');
  console.log('已更新的合約地址:');
  Object.entries(newAddresses).forEach(([name, address]) => {
    console.log(`  ${name}: ${address}`);
  });
  
  console.log('\n已更新的配置文件:');
  console.log('  ✅ src/config/contracts.ts');
  console.log('  📦 ABI files in src/lib/abis/');
  
  console.log('\n🎯 下一步操作:');
  console.log('1. 檢查前端是否能正確讀取新地址');
  console.log('2. 測試前端鑄造功能');
  console.log('3. 用戶需要重新授權 SOUL 代幣');
  
  console.log('\n✅ 前端合約配置更新完成！');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });