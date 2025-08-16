/**
 * 修復合約接口問題的腳本
 * 用於診斷和修正前端讀取合約數據的問題
 */

const fs = require('fs');
const path = require('path');

async function main() {
    console.log("=== 合約接口修復指南 ===\n");
    
    // 1. 生成正確的接口文檔
    console.log("1. DungeonCore 合約的正確接口：");
    console.log("================================");
    console.log("錯誤用法：dungeonCore.dungeonMaster()");
    console.log("正確用法：dungeonCore.dungeonMasterAddress()");
    console.log("\n其他地址getter函數：");
    console.log("- dungeonCore.oracleAddress()");
    console.log("- dungeonCore.playerVaultAddress()");
    console.log("- dungeonCore.heroContractAddress()");
    console.log("- dungeonCore.relicContractAddress()");
    console.log("- dungeonCore.partyContractAddress()");
    console.log("- dungeonCore.altarOfAscensionAddress()");
    console.log("- dungeonCore.playerProfileAddress()");
    console.log("- dungeonCore.vipStakingAddress()");
    
    console.log("\n2. 地城參數的正確讀取方式：");
    console.log("================================");
    console.log("地城參數存儲在 DungeonStorage 合約中，而不是 DungeonCore。");
    console.log("\n步驟：");
    console.log("a) 從 DungeonCore 獲取 DungeonStorage 地址（目前需要通過 DungeonMaster）");
    console.log("b) 使用 DungeonStorage 合約讀取地城參數");
    console.log("\n示例代碼：");
    console.log(`
// 獲取 DungeonMaster 地址
const dungeonMasterAddress = await dungeonCore.dungeonMasterAddress();

// 創建 DungeonMaster 合約實例
const dungeonMaster = new ethers.Contract(dungeonMasterAddress, DungeonMasterABI, provider);

// 獲取 DungeonStorage 地址
const dungeonStorageAddress = await dungeonMaster.dungeonStorage();

// 創建 DungeonStorage 合約實例
const dungeonStorage = new ethers.Contract(dungeonStorageAddress, DungeonStorageABI, provider);

// 讀取地城參數
const dungeon = await dungeonStorage.getDungeon(dungeonId);
console.log("Required Power:", dungeon.requiredPower.toString());
console.log("Reward Amount USD:", dungeon.rewardAmountUSD.toString());
console.log("Base Success Rate:", dungeon.baseSuccessRate.toString());
console.log("Is Initialized:", dungeon.isInitialized);
`);
    
    console.log("\n3. 冷卻時間的正確讀取方式：");
    console.log("================================");
    console.log("冷卻時間是固定的 24 小時，存儲在 DungeonMaster 合約中。");
    console.log("\n示例代碼：");
    console.log(`
// 獲取全局冷卻時間（24小時）
const COOLDOWN_PERIOD = await dungeonMaster.COOLDOWN_PERIOD();
console.log("冷卻時間:", COOLDOWN_PERIOD.toString(), "秒");
console.log("冷卻時間（小時）:", COOLDOWN_PERIOD / 3600);

// 檢查特定隊伍是否在冷卻中
const isLocked = await dungeonMaster.isPartyLocked(partyId);
console.log("隊伍是否被鎖定:", isLocked);
`);
    
    console.log("\n4. 建議的前端修復步驟：");
    console.log("================================");
    console.log("a) 更新合約調用方法，使用正確的函數名");
    console.log("b) 確保使用正確的合約來讀取數據");
    console.log("c) 添加錯誤處理，確保合約地址不為零");
    console.log("d) 考慮創建一個 ContractService 來統一管理合約調用");
    
    console.log("\n5. 快速檢查清單：");
    console.log("================================");
    console.log("[ ] DungeonCore 部署地址：0xf0d0666B8e2C47e6098E5f1FD97D88ee73D16bb3");
    console.log("[ ] 預期的 DungeonMaster 地址：0xd13250E0F0766006816d7AfE95EaEEc5e215d082");
    console.log("[ ] 檢查 DungeonStorage 是否已部署並設置到 DungeonMaster");
    console.log("[ ] 檢查地城參數是否已通過 adminSetDungeon 初始化");
    console.log("[ ] 確保前端使用正確的 ABI 文件");
    
    // 生成接口文檔
    const interfaceDoc = {
        DungeonCore: {
            address: "0xf0d0666B8e2C47e6098E5f1FD97D88ee73D16bb3",
            mainFunctions: {
                "dungeonMasterAddress()": "returns (address) - 獲取 DungeonMaster 合約地址",
                "getSoulShardAmountForUSD(uint256)": "returns (uint256) - 根據 USD 計算 SoulShard 數量",
                "getUSDValueForSoulShard(uint256)": "returns (uint256) - 根據 SoulShard 計算 USD 價值",
                "isPartyLocked(uint256)": "returns (bool) - 檢查隊伍是否被鎖定"
            }
        },
        DungeonMaster: {
            expectedAddress: "0xd13250E0F0766006816d7AfE95EaEEc5e215d082",
            mainFunctions: {
                "dungeonStorage()": "returns (address) - 獲取 DungeonStorage 合約地址",
                "COOLDOWN_PERIOD()": "returns (uint256) - 獲取冷卻時間（24小時）",
                "isPartyLocked(uint256)": "returns (bool) - 檢查隊伍是否在冷卻中",
                "adminSetDungeon(uint256,uint256,uint256,uint8)": "onlyOwner - 設置地城參數"
            }
        },
        DungeonStorage: {
            mainFunctions: {
                "getDungeon(uint256)": "returns (Dungeon struct) - 獲取地城參數",
                "getPartyStatus(uint256)": "returns (PartyStatus struct) - 獲取隊伍狀態"
            }
        }
    };
    
    // 保存接口文檔
    const docPath = path.join(__dirname, '..', 'contract-interfaces.json');
    fs.writeFileSync(docPath, JSON.stringify(interfaceDoc, null, 2));
    console.log(`\n接口文檔已保存到: ${docPath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });