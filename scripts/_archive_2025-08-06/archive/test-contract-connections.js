/**
 * 測試合約連接的腳本
 * 用於驗證所有合約是否正確部署和連接
 */

const { ethers } = require("hardhat");

async function main() {
    console.log("=== 測試合約連接 ===\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("使用帳戶:", deployer.address);
    
    // 合約地址
    const DUNGEON_CORE_ADDRESS = "0xf0d0666B8e2C47e6098E5f1FD97D88ee73D16bb3";
    const EXPECTED_DUNGEON_MASTER = "0xd13250E0F0766006816d7AfE95EaEEc5e215d082";
    
    try {
        // 1. 獲取 DungeonCore 合約
        console.log("\n1. 連接到 DungeonCore...");
        const DungeonCore = await ethers.getContractFactory("contracts/current/core/DungeonCore.sol:DungeonCore");
        const dungeonCore = DungeonCore.attach(DUNGEON_CORE_ADDRESS);
        console.log("✓ DungeonCore 連接成功");
        
        // 2. 檢查 DungeonMaster 地址
        console.log("\n2. 檢查 DungeonMaster 地址...");
        const dungeonMasterAddress = await dungeonCore.dungeonMasterAddress();
        console.log("實際 DungeonMaster 地址:", dungeonMasterAddress);
        console.log("預期 DungeonMaster 地址:", EXPECTED_DUNGEON_MASTER);
        
        if (dungeonMasterAddress === ethers.ZeroAddress) {
            console.log("✗ DungeonMaster 未設置！");
            console.log("\n執行設置命令：");
            console.log(`await dungeonCore.setDungeonMaster("${EXPECTED_DUNGEON_MASTER}")`);
            
            // 嘗試設置
            try {
                const tx = await dungeonCore.setDungeonMaster(EXPECTED_DUNGEON_MASTER);
                await tx.wait();
                console.log("✓ DungeonMaster 設置成功！");
            } catch (error) {
                console.log("✗ 設置失敗:", error.message);
            }
        } else if (dungeonMasterAddress.toLowerCase() === EXPECTED_DUNGEON_MASTER.toLowerCase()) {
            console.log("✓ DungeonMaster 地址正確");
        } else {
            console.log("✗ DungeonMaster 地址不匹配");
        }
        
        // 3. 如果 DungeonMaster 已設置，檢查 DungeonStorage
        if (dungeonMasterAddress !== ethers.ZeroAddress) {
            console.log("\n3. 連接到 DungeonMaster...");
            const DungeonMaster = await ethers.getContractFactory("contracts/current/core/DungeonMaster.sol:DungeonMasterV2");
            const dungeonMaster = DungeonMaster.attach(dungeonMasterAddress);
            console.log("✓ DungeonMaster 連接成功");
            
            // 檢查 DungeonStorage
            console.log("\n4. 檢查 DungeonStorage...");
            try {
                const dungeonStorageAddress = await dungeonMaster.dungeonStorage();
                if (dungeonStorageAddress === ethers.ZeroAddress) {
                    console.log("✗ DungeonStorage 未設置");
                    console.log("需要部署 DungeonStorage 並設置到 DungeonMaster");
                } else {
                    console.log("✓ DungeonStorage 地址:", dungeonStorageAddress);
                    
                    // 連接到 DungeonStorage
                    const DungeonStorage = await ethers.getContractFactory("contracts/current/core/DungeonStorage.sol:DungeonStorage");
                    const dungeonStorage = DungeonStorage.attach(dungeonStorageAddress);
                    
                    // 檢查地城參數
                    console.log("\n5. 檢查地城參數...");
                    for (let i = 1; i <= 5; i++) {
                        try {
                            const dungeon = await dungeonStorage.getDungeon(i);
                            if (dungeon.isInitialized) {
                                console.log(`\n地城 ${i}:`);
                                console.log("- 所需戰力:", dungeon.requiredPower.toString());
                                console.log("- 獎勵(USD):", ethers.formatEther(dungeon.rewardAmountUSD));
                                console.log("- 成功率:", dungeon.baseSuccessRate.toString() + "%");
                            } else {
                                console.log(`地城 ${i}: 未初始化`);
                            }
                        } catch (error) {
                            console.log(`地城 ${i}: 讀取錯誤 -`, error.message);
                        }
                    }
                }
            } catch (error) {
                console.log("✗ 無法讀取 DungeonStorage:", error.message);
            }
            
            // 檢查其他設置
            console.log("\n6. 檢查 DungeonMaster 其他設置...");
            try {
                const cooldownPeriod = await dungeonMaster.COOLDOWN_PERIOD();
                console.log("冷卻時間:", cooldownPeriod.toString(), "秒 (", cooldownPeriod / 3600n, "小時)");
                
                const dungeonCoreInMaster = await dungeonMaster.dungeonCore();
                console.log("DungeonCore 地址 (在 DungeonMaster 中):", dungeonCoreInMaster);
                if (dungeonCoreInMaster === ethers.ZeroAddress) {
                    console.log("✗ DungeonCore 未在 DungeonMaster 中設置");
                    console.log("需要執行: dungeonMaster.setDungeonCore(dungeonCoreAddress)");
                }
                
                const soulShardToken = await dungeonMaster.soulShardToken();
                console.log("SoulShard Token 地址:", soulShardToken);
                if (soulShardToken === ethers.ZeroAddress) {
                    console.log("✗ SoulShard Token 未設置");
                }
            } catch (error) {
                console.log("讀取設置時出錯:", error.message);
            }
        }
        
        // 7. 檢查其他關聯合約
        console.log("\n7. 檢查其他關聯合約...");
        const contracts = [
            { name: "Oracle", getter: "oracleAddress" },
            { name: "PlayerVault", getter: "playerVaultAddress" },
            { name: "Hero", getter: "heroContractAddress" },
            { name: "Relic", getter: "relicContractAddress" },
            { name: "Party", getter: "partyContractAddress" },
            { name: "PlayerProfile", getter: "playerProfileAddress" },
            { name: "VIPStaking", getter: "vipStakingAddress" }
        ];
        
        for (const contract of contracts) {
            try {
                const address = await dungeonCore[contract.getter]();
                if (address === ethers.ZeroAddress) {
                    console.log(`${contract.name}: ✗ 未設置`);
                } else {
                    console.log(`${contract.name}: ✓ ${address}`);
                }
            } catch (error) {
                console.log(`${contract.name}: ✗ 讀取錯誤`);
            }
        }
        
    } catch (error) {
        console.error("\n錯誤:", error.message);
        console.error("請確保 Hardhat 節點正在運行");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });