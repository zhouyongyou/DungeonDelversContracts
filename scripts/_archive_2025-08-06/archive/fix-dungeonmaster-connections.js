// scripts/fix-dungeonmaster-connections.js
// 修復 DungeonMaster 的合約連接

const { ethers } = require("hardhat");

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

async function main() {
    log('\n🔧 修復 DungeonMaster 合約連接...', 'magenta');
    log('='.repeat(70), 'magenta');
    
    const [deployer] = await ethers.getSigners();
    log(`👤 使用帳號: ${deployer.address}`, 'cyan');
    
    // V15 合約地址
    const addresses = {
        DUNGEONMASTER: "0xaeBd33846a4a88Afd1B1c3ACB5D8C5872796E316",
        SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
        DUNGEONCORE: "0xA43edd46Eb4416195bc1BAA3575358EA92CE49dD",
        DUNGEONSTORAGE: "0xAfA453cdca0245c858DAeb4d3e21C6360F4d62Eb"
    };
    
    // 連接 DungeonMaster 合約
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV8", addresses.DUNGEONMASTER);
    
    log('\n📋 當前 DungeonMaster 狀態:', 'yellow');
    
    // 檢查當前連接狀態
    try {
        const soulShardToken = await dungeonMaster.soulShardToken();
        log(`   SoulShard Token: ${soulShardToken}`, 'cyan');
    } catch (error) {
        log(`   SoulShard Token: ❌ 讀取失敗`, 'red');
    }
    
    try {
        const dungeonCore = await dungeonMaster.dungeonCore();
        log(`   DungeonCore: ${dungeonCore}`, 'cyan');
    } catch (error) {
        log(`   DungeonCore: ❌ 讀取失敗`, 'red');
    }
    
    try {
        const dungeonStorage = await dungeonMaster.dungeonStorage();
        log(`   DungeonStorage: ${dungeonStorage}`, 'cyan');
    } catch (error) {
        log(`   DungeonStorage: ❌ 讀取失敗`, 'red');
    }
    
    log('\n⚙️ 開始修復連接...', 'yellow');
    
    // 1. 設置 SoulShard Token
    try {
        log('🔧 設置 SoulShard Token...', 'yellow');
        const tx1 = await dungeonMaster.setSoulShardToken(addresses.SOULSHARD);
        await tx1.wait();
        log('✅ SoulShard Token 設置成功', 'green');
    } catch (error) {
        log(`❌ SoulShard Token 設置失敗: ${error.message}`, 'red');
    }
    
    // 2. 設置 DungeonCore
    try {
        log('🔧 設置 DungeonCore...', 'yellow');
        const tx2 = await dungeonMaster.setDungeonCore(addresses.DUNGEONCORE);
        await tx2.wait();
        log('✅ DungeonCore 設置成功', 'green');
    } catch (error) {
        log(`❌ DungeonCore 設置失敗: ${error.message}`, 'red');
    }
    
    // 3. 設置 DungeonStorage (如果已經在 setup 腳本中設置過，這裡會是更新確認)
    try {
        log('🔧 設置 DungeonStorage...', 'yellow');
        const tx3 = await dungeonMaster.setDungeonStorage(addresses.DUNGEONSTORAGE);
        await tx3.wait();
        log('✅ DungeonStorage 設置成功', 'green');
    } catch (error) {
        log(`❌ DungeonStorage 設置失敗: ${error.message}`, 'red');
    }
    
    // 4. 驗證修復結果
    log('\n🔍 驗證修復結果...', 'yellow');
    
    try {
        const soulShardToken = await dungeonMaster.soulShardToken();
        const dungeonCore = await dungeonMaster.dungeonCore();
        const dungeonStorage = await dungeonMaster.dungeonStorage();
        
        log('✅ 修復完成！當前狀態:', 'green');
        log(`   SoulShard Token: ${soulShardToken}`, 'cyan');
        log(`   DungeonCore: ${dungeonCore}`, 'cyan');
        log(`   DungeonStorage: ${dungeonStorage}`, 'cyan');
        
        // 驗證地址是否正確
        const isCorrect = 
            soulShardToken.toLowerCase() === addresses.SOULSHARD.toLowerCase() &&
            dungeonCore.toLowerCase() === addresses.DUNGEONCORE.toLowerCase() &&
            dungeonStorage.toLowerCase() === addresses.DUNGEONSTORAGE.toLowerCase();
            
        if (isCorrect) {
            log('🎉 所有連接都已正確設置！', 'green');
        } else {
            log('⚠️ 某些連接可能設置不正確，請檢查', 'yellow');
        }
        
    } catch (error) {
        log(`❌ 驗證失敗: ${error.message}`, 'red');
    }
    
    log('\n' + '='.repeat(70), 'magenta');
    log('🔧 DungeonMaster 連接修復完成！', 'green');
    log('='.repeat(70), 'magenta');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 DungeonMaster 連接修復失敗:', error);
        process.exit(1);
    });