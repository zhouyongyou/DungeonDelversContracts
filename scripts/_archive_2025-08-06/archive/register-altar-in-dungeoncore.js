// scripts/register-altar-in-dungeoncore.js
// 在 DungeonCore 中註冊升星祭壇地址

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
    log('\n⚔️ 在 DungeonCore 中註冊升星祭壇...', 'magenta');
    log('='.repeat(70), 'magenta');
    
    const [deployer] = await ethers.getSigners();
    log(`👤 使用帳號: ${deployer.address}`, 'cyan');
    
    const ALTAR_ADDRESS = "0xbA76D9E0063280d4B0F6e139B5dD45A47BBD1e4e";
    const DUNGEONCORE_ADDRESS = "0xA43edd46Eb4416195bc1BAA3575358EA92CE49dD";
    const PARTY_ADDRESS = "0x514AFBb114fa6c77CC025720A31aaeE038fBbcd7";
    
    log(`\n⚔️ 升星祭壇地址: ${ALTAR_ADDRESS}`, 'cyan');
    log(`🏰 DungeonCore 地址: ${DUNGEONCORE_ADDRESS}`, 'cyan');
    
    // 連接 DungeonCore 合約
    const dungeonCore = await ethers.getContractAt("contracts/core/DungeonCore.sol:DungeonCore", DUNGEONCORE_ADDRESS);
    
    // 1. 註冊升星祭壇
    try {
        log('\n🔧 設置 DungeonCore.altarOfAscension...', 'yellow');
        const tx1 = await dungeonCore.setAltarOfAscension(ALTAR_ADDRESS);
        await tx1.wait();
        log('✅ 升星祭壇在 DungeonCore 中註冊成功', 'green');
    } catch (error) {
        log(`❌ 註冊升星祭壇失敗: ${error.message}`, 'red');
    }
    
    // 2. 修復 Party 合約的 DungeonCore 連接
    try {
        log('\n🔧 修復 Party 合約的 DungeonCore 連接...', 'yellow');
        const party = await ethers.getContractAt("Party", PARTY_ADDRESS);
        
        // 檢查當前狀態
        const currentCore = await party.dungeonCoreContract();
        log(`   當前 DungeonCore: ${currentCore}`, 'cyan');
        
        if (currentCore !== DUNGEONCORE_ADDRESS) {
            const tx2 = await party.setDungeonCore(DUNGEONCORE_ADDRESS);
            await tx2.wait();
            log('✅ Party 合約的 DungeonCore 連接修復成功', 'green');
        } else {
            log('✅ Party 合約已正確連接 DungeonCore', 'green');
        }
    } catch (error) {
        log(`❌ 修復 Party 合約連接失敗: ${error.message}`, 'red');
        log('   可能原因: Party 合約沒有 setDungeonCore 方法', 'yellow');
    }
    
    // 3. 驗證設置結果
    log('\n🔍 驗證設置結果...', 'yellow');
    
    try {
        const altarAddress = await dungeonCore.altarOfAscensionAddress();
        log(`✅ DungeonCore 中的升星祭壇地址: ${altarAddress}`, 'green');
        
        if (altarAddress.toLowerCase() === ALTAR_ADDRESS.toLowerCase()) {
            log('🎉 升星祭壇註冊成功！', 'green');
        } else {
            log('⚠️ 升星祭壇地址不匹配', 'yellow');
        }
    } catch (error) {
        log(`❌ 驗證失敗: ${error.message}`, 'red');
    }
    
    log('\n' + '='.repeat(70), 'magenta');
    log('🎉 升星祭壇註冊完成！', 'green');
    log(`📋 升星祭壇地址: ${ALTAR_ADDRESS}`, 'cyan');
    log('='.repeat(70), 'magenta');
    
    log('\n📝 下一步:', 'yellow');
    log('1. 更新前端配置文件中的 ALTAROFASCENSION 地址', 'cyan');
    log('2. 測試升星祭壇功能', 'cyan');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 升星祭壇註冊失敗:', error);
        process.exit(1);
    });