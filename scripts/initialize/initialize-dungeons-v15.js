// scripts/initialize/initialize-dungeons-v15.js
// 初始化 V15 地下城數據（獎勵調整為 20%）

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

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
    log('\n🏰 開始初始化 V15 地下城數據...', 'magenta');
    log('='.repeat(70), 'magenta');
    log('🎯 獎勵調整為原始數值的 20%', 'cyan');
    log('='.repeat(70), 'magenta');
    
    const [deployer] = await ethers.getSigners();
    log(`👤 使用帳號: ${deployer.address}`, 'cyan');
    
    // V15 合約地址（從您的配置文件讀取）
    const DUNGEON_STORAGE_ADDRESS = "0x2fcd1bbbB88cce8040A2DE92E97d5375d8B088da";
    const DUNGEON_MASTER_ADDRESS = "0xd13250E0F0766006816d7AfE95EaEEc5e215d082"; 
    const DUNGEON_CORE_ADDRESS = "0x4D353aFC420E6187bfA5F99f0DdD8F7F137c20E9";
    
    log(`🔗 DungeonStorage: ${DUNGEON_STORAGE_ADDRESS}`, 'cyan');
    log(`🔗 DungeonMaster: ${DUNGEON_MASTER_ADDRESS}`, 'cyan');
    log(`🔗 DungeonCore: ${DUNGEON_CORE_ADDRESS}`, 'cyan');
    
    // 連接合約
    const dungeonStorage = await ethers.getContractAt("contracts/current/core/DungeonStorage.sol:DungeonStorage", DUNGEON_STORAGE_ADDRESS);
    const dungeonMaster = await ethers.getContractAt("contracts/current/core/DungeonMaster.sol:DungeonMasterV2", DUNGEON_MASTER_ADDRESS);
    const dungeonCore = await ethers.getContractAt("contracts/core/DungeonCore.sol:DungeonCore", DUNGEON_CORE_ADDRESS);
    
    // 地下城配置（V22 版本）
    const dungeons = [
        { id: 1, name: "新手礦洞", requiredPower: 300, rewardAmountUSD: ethers.parseEther("6"), baseSuccessRate: 89 },
        { id: 2, name: "哥布林洞穴", requiredPower: 600, rewardAmountUSD: ethers.parseEther("12"), baseSuccessRate: 83 },
        { id: 3, name: "食人魔山谷", requiredPower: 900, rewardAmountUSD: ethers.parseEther("20"), baseSuccessRate: 78 },
        { id: 4, name: "蜘蛛巢穴", requiredPower: 1200, rewardAmountUSD: ethers.parseEther("27"), baseSuccessRate: 74 },
        { id: 5, name: "石化蜥蜴沼澤", requiredPower: 1500, rewardAmountUSD: ethers.parseEther("35"), baseSuccessRate: 70 },
        { id: 6, name: "巫妖墓穴", requiredPower: 1800, rewardAmountUSD: ethers.parseEther("60"), baseSuccessRate: 66 },
        { id: 7, name: "奇美拉之巢", requiredPower: 2100, rewardAmountUSD: ethers.parseEther("82"), baseSuccessRate: 62 },
        { id: 8, name: "惡魔前哨站", requiredPower: 2400, rewardAmountUSD: ethers.parseEther("103"), baseSuccessRate: 58 },
        { id: 9, name: "巨龍之巔", requiredPower: 2700, rewardAmountUSD: ethers.parseEther("136"), baseSuccessRate: 54 },
        { id: 10, name: "混沌深淵", requiredPower: 3000, rewardAmountUSD: ethers.parseEther("225"), baseSuccessRate: 50 }
    ];
    
    log('\n📊 檢查當前地下城狀態...', 'yellow');
    
    // 檢查哪些地下城需要初始化
    const uninitialized = [];
    const needsUpdate = [];
    
    for (const dungeon of dungeons) {
        try {
            const data = await dungeonStorage.getDungeon(dungeon.id);
            
            if (!data.isInitialized) {
                uninitialized.push(dungeon);
                log(`❌ 地下城 #${dungeon.id} (${dungeon.name}) 未初始化`, 'red');
            } else {
                // 檢查獎勵是否需要更新
                const currentReward = ethers.formatEther(data.rewardAmountUSD);
                const targetReward = ethers.formatEther(dungeon.rewardAmountUSD);
                
                if (currentReward !== targetReward) {
                    needsUpdate.push({...dungeon, currentReward, targetReward});
                    log(`⚠️  地下城 #${dungeon.id} (${dungeon.name}) 獎勵需要更新: ${currentReward} → ${targetReward} USD`, 'yellow');
                } else {
                    log(`✅ 地下城 #${dungeon.id} (${dungeon.name}) 狀態正常`, 'green');
                }
            }
        } catch (error) {
            log(`❌ 無法讀取地下城 #${dungeon.id}: ${error.message}`, 'red');
            uninitialized.push(dungeon);
        }
    }
    
    // 初始化未初始化的地下城
    if (uninitialized.length > 0) {
        log(`\n🚀 需要初始化 ${uninitialized.length} 個地下城...`, 'yellow');
        
        for (const dungeon of uninitialized) {
            try {
                log(`⚙️  初始化地下城 #${dungeon.id}: ${dungeon.name}`, 'yellow');
                log(`   戰力要求: ${dungeon.requiredPower}`, 'cyan');
                log(`   獎勵 (USD): ${ethers.formatEther(dungeon.rewardAmountUSD)}`, 'cyan');
                log(`   成功率: ${dungeon.baseSuccessRate}%`, 'cyan');
                
                const tx = await dungeonMaster.adminSetDungeon(
                    dungeon.id,
                    dungeon.requiredPower,
                    dungeon.rewardAmountUSD,
                    dungeon.baseSuccessRate
                );
                await tx.wait();
                log(`✅ 地下城 #${dungeon.id} 初始化成功`, 'green');
            } catch (error) {
                log(`❌ 地下城 #${dungeon.id} 初始化失敗: ${error.message}`, 'red');
            }
        }
    }
    
    // 更新需要調整獎勵的地下城
    if (needsUpdate.length > 0) {
        log(`\n🔄 需要更新 ${needsUpdate.length} 個地下城的獎勵...`, 'yellow');
        
        for (const dungeon of needsUpdate) {
            try {
                log(`⚙️  更新地下城 #${dungeon.id} 獎勵: ${dungeon.currentReward} → ${dungeon.targetReward} USD`, 'yellow');
                const tx = await dungeonMaster.adminSetDungeon(
                    dungeon.id,
                    dungeon.requiredPower,
                    dungeon.rewardAmountUSD,
                    dungeon.baseSuccessRate
                );
                await tx.wait();
                log(`✅ 地下城 #${dungeon.id} 獎勵更新成功`, 'green');
            } catch (error) {
                log(`❌ 地下城 #${dungeon.id} 獎勵更新失敗: ${error.message}`, 'red');
            }
        }
    }
    
    // 檢查並設定探索費用
    log('\n💰 檢查探索費用設定...', 'yellow');
    try {
        const currentFee = await dungeonMaster.explorationFee();
        const targetFee = ethers.parseEther("0.001"); // 0.001 BNB = ~$0.6
        
        if (currentFee === 0n) {
            log(`⚙️  設定探索費用為 ${ethers.formatEther(targetFee)} BNB...`, 'yellow');
            const tx = await dungeonMaster.setExplorationFee(targetFee);
            await tx.wait();
            log(`✅ 探索費用設定成功`, 'green');
        } else {
            log(`✅ 探索費用已設定: ${ethers.formatEther(currentFee)} BNB`, 'green');
        }
    } catch (error) {
        log(`❌ 探索費用檢查失敗: ${error.message}`, 'red');
    }
    
    // V15 版本的 DungeonCore 較為簡單，沒有價格管理功能
    log('\n✅ V15 核心合約配置完成', 'green');
    
    // 生成初始化報告
    const report = {
        version: "V15",
        timestamp: new Date().toISOString(),
        dungeonsInitialized: uninitialized.length,
        dungeonsUpdated: needsUpdate.length,
        totalDungeons: dungeons.length,
        rewardAdjustment: "20% of original values",
        contracts: {
            dungeonStorage: DUNGEON_STORAGE_ADDRESS,
            dungeonMaster: DUNGEON_MASTER_ADDRESS,
            dungeonCore: DUNGEON_CORE_ADDRESS
        },
        dungeonConfig: dungeons.map(d => ({
            id: d.id,
            name: d.name,
            requiredPower: d.requiredPower,
            rewardUSD: ethers.formatEther(d.rewardAmountUSD),
            successRate: d.baseSuccessRate + '%'
        }))
    };
    
    const reportPath = path.join(__dirname, '../../deployments/dungeon-initialization-v15-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    log('\n' + '='.repeat(70), 'magenta');
    log('🎉 V15 地下城初始化完成！', 'green');
    log('='.repeat(70), 'magenta');
    log(`📊 初始化地下城: ${uninitialized.length}/${dungeons.length}`, 'cyan');
    log(`🔄 更新地下城: ${needsUpdate.length}/${dungeons.length}`, 'cyan');
    log(`💰 獎勵調整: 原始數值的 20%`, 'cyan');
    log(`📄 報告已保存: ${reportPath}`, 'cyan');
    
    if (uninitialized.length === 0 && needsUpdate.length === 0) {
        log('\n✨ 所有地下城配置都是最新的！', 'green');
    } else {
        log('\n🚀 建議接下來執行:', 'yellow');
        log('1. 訪問管理後台驗證地下城狀態', 'cyan');
        log('2. 測試地下城探索功能', 'cyan');
        log('3. 檢查獎勵發放是否正常', 'cyan');
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('💥 初始化失敗:', error);
        process.exit(1);
    });