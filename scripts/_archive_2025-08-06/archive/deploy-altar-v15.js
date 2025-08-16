// scripts/deploy-altar-v15.js
// 部署升星祭壇合約並配置連接

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
    log('\n⚔️ 部署升星祭壇合約...', 'magenta');
    log('='.repeat(70), 'magenta');
    
    const [deployer] = await ethers.getSigners();
    log(`👤 使用帳號: ${deployer.address}`, 'cyan');
    
    // V15 合約地址
    const addresses = {
        DUNGEON_CORE: "0xA43edd46Eb4416195bc1BAA3575358EA92CE49dD",
        HERO: "0x2b6CB00D10EFB1aF0125a26dfcbd9EBa87e07CD2",
        RELIC: "0xaEa78C3FC4bc50966aC41D76331fD0bf219D00ac",
    };
    
    // 複製備份合約到主目錄（如果不存在）
    const fs = require('fs');
    const altarPath = './contracts/AltarOfAscension.sol';
    const altarBackupPath = './contracts_backup_20250120/AltarOfAscension.sol';
    
    if (!fs.existsSync(altarPath) && fs.existsSync(altarBackupPath)) {
        log('📋 複製升星祭壇合約到主目錄...', 'yellow');
        fs.copyFileSync(altarBackupPath, altarPath);
        log('✅ 複製完成', 'green');
    }
    
    // 部署升星祭壇
    log('\n🏗️ 部署 AltarOfAscension...', 'yellow');
    const AltarOfAscension = await ethers.getContractFactory("AltarOfAscension");
    const altar = await AltarOfAscension.deploy(deployer.address);
    await altar.waitForDeployment();
    
    const altarAddress = await altar.getAddress();
    log(`✅ AltarOfAscension 部署成功: ${altarAddress}`, 'green');
    
    // 配置升星祭壇
    log('\n⚙️ 配置升星祭壇...', 'yellow');
    
    // 1. 設置 DungeonCore
    log('🔧 設置 DungeonCore...', 'yellow');
    const tx1 = await altar.setDungeonCore(addresses.DUNGEON_CORE);
    await tx1.wait();
    log('✅ DungeonCore 設置成功', 'green');
    
    // 2. 設置 Hero 合約
    log('🔧 設置 Hero 合約...', 'yellow');
    const tx2 = await altar.setHeroContract(addresses.HERO);
    await tx2.wait();
    log('✅ Hero 合約設置成功', 'green');
    
    // 3. 設置 Relic 合約
    log('🔧 設置 Relic 合約...', 'yellow');
    const tx3 = await altar.setRelicContract(addresses.RELIC);
    await tx3.wait();
    log('✅ Relic 合約設置成功', 'green');
    
    // 4. 更新升級規則（優化版，降低失敗率）
    log('\n🎲 設置優化升級規則...', 'yellow');
    
    // 1★ -> 2★: 保證成功，10%大成功，80%普通成功，10%部分失敗
    const tx4 = await altar.setUpgradeRule(1, {
        materialsRequired: 5,
        nativeFee: 0, // 免費
        greatSuccessChance: 10,
        successChance: 80,
        partialFailChance: 10 // 小部分失敗但保留材料
    });
    await tx4.wait();
    log('✅ 1★->2★ 規則設置: 90%成功率', 'green');
    
    // 2★ -> 3★: 保證成功，8%大成功，82%普通成功，10%部分失敗
    const tx5 = await altar.setUpgradeRule(2, {
        materialsRequired: 4,
        nativeFee: 0, // 免費
        greatSuccessChance: 8,
        successChance: 82,
        partialFailChance: 10 // 小部分失敗但保留材料
    });
    await tx5.wait();
    log('✅ 2★->3★ 規則設置: 90%成功率', 'green');
    
    // 配置 DungeonCore 中的升星祭壇地址
    log('\n🔄 在 DungeonCore 中註冊升星祭壇...', 'yellow');
    const dungeonCore = await ethers.getContractAt("contracts/core/DungeonCore.sol:DungeonCore", addresses.DUNGEON_CORE);
    
    try {
        const tx6 = await dungeonCore.setAltarOfAscension(altarAddress);
        await tx6.wait();
        log('✅ DungeonCore 中升星祭壇註冊成功', 'green');
    } catch (error) {
        log(`⚠️ DungeonCore 註冊失敗（可能方法不存在）: ${error.message}`, 'yellow');
    }
    
    // 輸出配置資訊
    log('\n' + '='.repeat(70), 'magenta');
    log('🎉 升星祭壇部署完成！', 'green');
    log('='.repeat(70), 'magenta');
    
    log('\n📋 部署結果:', 'yellow');
    log(`   AltarOfAscension: ${altarAddress}`, 'cyan');
    
    log('\n📝 更新配置文件:', 'yellow');
    log('請將以下地址更新到配置文件中：', 'cyan');
    log(`ALTAROFASCENSION: '${altarAddress}',`, 'cyan');
    
    log('\n🎮 升級規則:', 'yellow');
    log('   1★->2★: 免費, 保證成功 (10%大成功, 90%普通)', 'cyan');
    log('   2★->3★: 免費, 保證成功 (8%大成功, 92%普通)', 'cyan');
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 升星祭壇部署失敗:', error);
        process.exit(1);
    });