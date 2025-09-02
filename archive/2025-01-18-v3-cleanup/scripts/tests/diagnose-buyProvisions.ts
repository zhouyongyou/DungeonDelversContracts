// scripts/diagnose-buyProvisions.ts - 診斷購買儲備失敗的原因

import { ethers } from "hardhat";
import { formatEther, parseEther } from "ethers";

const USER_ADDRESS = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
const PARTY_ID = 2n;
const AMOUNT = 1n;

const CONTRACTS = {
    DUNGEON_MASTER: "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A",
    DUNGEON_CORE: "0x548A15CaFAE2a5D19f9683CDad6D57e3320E61a7",
    SOUL_SHARD: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    PARTY: "0xb069B70d61f96bE5f5529dE216538766672f1096",
    DUNGEON_STORAGE: "0xEC6773F9C52446BB2F8318dBBa09f58E72fe91b4"
};

async function main() {
    console.log("🔍 診斷 buyProvisions 失敗原因...\n");
    
    const [signer] = await ethers.getSigners();
    
    // 連接合約
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", CONTRACTS.DUNGEON_MASTER);
    const dungeonCore = await ethers.getContractAt("DungeonCore", CONTRACTS.DUNGEON_CORE);
    const soulShard = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", CONTRACTS.SOUL_SHARD);
    const party = await ethers.getContractAt("Party", CONTRACTS.PARTY);
    const dungeonStorage = await ethers.getContractAt("DungeonStorage", CONTRACTS.DUNGEON_STORAGE);
    
    console.log("📋 交易參數:");
    console.log(`用戶地址: ${USER_ADDRESS}`);
    console.log(`隊伍 ID: ${PARTY_ID}`);
    console.log(`購買數量: ${AMOUNT}\n`);
    
    const issues: string[] = [];
    
    try {
        // 1. 檢查隊伍擁有權
        console.log("1️⃣ 檢查隊伍擁有權...");
        try {
            const partyOwner = await party.ownerOf(PARTY_ID);
            console.log(`隊伍 #${PARTY_ID} 的擁有者: ${partyOwner}`);
            
            if (partyOwner.toLowerCase() !== USER_ADDRESS.toLowerCase()) {
                issues.push(`❌ 用戶不擁有隊伍 #${PARTY_ID}`);
                console.log(`❌ 用戶不是隊伍 #${PARTY_ID} 的擁有者`);
                
                // 檢查用戶實際擁有哪些隊伍
                const userBalance = await party.balanceOf(USER_ADDRESS);
                console.log(`\n用戶擁有的隊伍數量: ${userBalance}`);
                
                if (userBalance > 0n) {
                    console.log("用戶實際擁有的隊伍 ID:");
                    for (let i = 0; i < Number(userBalance); i++) {
                        try {
                            const tokenId = await party.tokenOfOwnerByIndex(USER_ADDRESS, i);
                            console.log(`  - 隊伍 #${tokenId}`);
                        } catch (e) {
                            console.log(`  - 無法獲取索引 ${i} 的隊伍 ID`);
                        }
                    }
                }
            } else {
                console.log("✅ 用戶擁有隊伍 #" + PARTY_ID);
            }
        } catch (error: any) {
            issues.push(`❌ 隊伍 #${PARTY_ID} 不存在或查詢失敗`);
            console.log(`❌ 隊伍 #${PARTY_ID} 查詢失敗:`, error.message);
        }
        
        // 2. 檢查合約暫停狀態
        console.log("\n2️⃣ 檢查合約狀態...");
        const isPaused = await dungeonMaster.paused();
        console.log(`DungeonMaster 暫停狀態: ${isPaused ? '❌ 已暫停' : '✅ 正常'}`);
        if (isPaused) issues.push("❌ DungeonMaster 合約已暫停");
        
        // 3. 檢查必要的合約地址設置
        console.log("\n3️⃣ 檢查合約配置...");
        
        // 檢查 DungeonCore
        const dungeonCoreInMaster = await dungeonMaster.dungeonCore();
        console.log(`DungeonCore 設置: ${dungeonCoreInMaster === CONTRACTS.DUNGEON_CORE ? '✅' : '❌'} ${dungeonCoreInMaster}`);
        if (dungeonCoreInMaster === ethers.ZeroAddress) issues.push("❌ DungeonCore 未設置");
        
        // 檢查 SoulShard
        const soulShardInMaster = await dungeonMaster.soulShardToken();
        console.log(`SoulShard 設置: ${soulShardInMaster === CONTRACTS.SOUL_SHARD ? '✅' : '❌'} ${soulShardInMaster}`);
        if (soulShardInMaster === ethers.ZeroAddress) issues.push("❌ SoulShard 未設置");
        
        // 檢查 DungeonStorage
        const dungeonStorageInMaster = await dungeonMaster.dungeonStorage();
        console.log(`DungeonStorage 設置: ${dungeonStorageInMaster === CONTRACTS.DUNGEON_STORAGE ? '✅' : '❌'} ${dungeonStorageInMaster}`);
        if (dungeonStorageInMaster === ethers.ZeroAddress) issues.push("❌ DungeonStorage 未設置");
        
        // 4. 檢查價格和所需金額
        console.log("\n4️⃣ 檢查價格計算...");
        const provisionPriceUSD = await dungeonMaster.provisionPriceUSD();
        console.log(`單個儲備價格: ${formatEther(provisionPriceUSD)} USD`);
        
        const totalCostUSD = provisionPriceUSD * AMOUNT;
        console.log(`總價格: ${formatEther(totalCostUSD)} USD`);
        
        // 計算所需的 SoulShard
        try {
            const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
            console.log(`所需 SoulShard: ${formatEther(requiredSoulShard)}`);
            
            // 5. 檢查用戶餘額和授權
            console.log("\n5️⃣ 檢查用戶餘額和授權...");
            const userBalance = await soulShard.balanceOf(USER_ADDRESS);
            console.log(`用戶 SoulShard 餘額: ${formatEther(userBalance)}`);
            
            if (userBalance < requiredSoulShard) {
                issues.push(`❌ 用戶餘額不足 (需要: ${formatEther(requiredSoulShard)}, 擁有: ${formatEther(userBalance)})`);
            }
            
            const allowance = await soulShard.allowance(USER_ADDRESS, CONTRACTS.DUNGEON_MASTER);
            console.log(`用戶授權額度: ${formatEther(allowance)}`);
            
            if (allowance < requiredSoulShard) {
                issues.push(`❌ 授權額度不足 (需要: ${formatEther(requiredSoulShard)}, 授權: ${formatEther(allowance)})`);
            }
        } catch (error: any) {
            console.log("❌ 價格計算失敗:", error.message);
            issues.push("❌ 無法計算所需的 SoulShard 數量");
        }
        
        // 6. 檢查 DungeonStorage 的 logicContract
        console.log("\n6️⃣ 檢查 DungeonStorage 配置...");
        try {
            const logicContract = await dungeonStorage.logicContract();
            console.log(`DungeonStorage.logicContract: ${logicContract}`);
            
            if (logicContract !== CONTRACTS.DUNGEON_MASTER) {
                issues.push(`❌ DungeonStorage 的 logicContract 不是 DungeonMaster (當前: ${logicContract})`);
            } else {
                console.log("✅ DungeonStorage 正確配置為 DungeonMaster");
            }
        } catch (error) {
            console.log("⚠️ 無法檢查 DungeonStorage 的 logicContract");
        }
        
        // 7. 嘗試模擬交易
        console.log("\n7️⃣ 嘗試模擬 buyProvisions 交易...");
        try {
            // 使用 staticCall 模擬交易
            await dungeonMaster.buyProvisions.staticCall(PARTY_ID, AMOUNT, { from: USER_ADDRESS });
            console.log("✅ 交易模擬成功！");
        } catch (error: any) {
            console.log("❌ 交易模擬失敗:", error.message);
            
            // 解析錯誤訊息
            if (error.message.includes("Not party owner")) {
                issues.push("❌ 用戶不是隊伍擁有者");
            } else if (error.message.includes("Amount must be > 0")) {
                issues.push("❌ 購買數量必須大於 0");
            } else if (error.message.includes("DungeonCore not set")) {
                issues.push("❌ DungeonCore 未設置");
            } else if (error.message.includes("SoulShard token not set")) {
                issues.push("❌ SoulShard 代幣未設置");
            } else if (error.message.includes("SafeERC20")) {
                issues.push("❌ SoulShard 轉帳失敗（可能是餘額或授權問題）");
            } else {
                issues.push(`❌ 未知錯誤: ${error.message}`);
            }
        }
        
    } catch (error: any) {
        console.error("\n❌ 診斷過程中發生錯誤:", error);
    }
    
    // 總結
    console.log("\n" + "=".repeat(60));
    console.log("📊 診斷總結:");
    if (issues.length === 0) {
        console.log("✅ 未發現明顯問題，交易應該可以成功");
    } else {
        console.log(`❌ 發現 ${issues.length} 個問題:`);
        issues.forEach((issue, index) => {
            console.log(`   ${index + 1}. ${issue}`);
        });
        
        console.log("\n💡 建議解決方案:");
        if (issues.some(i => i.includes("不擁有隊伍"))) {
            console.log("   - 使用用戶實際擁有的隊伍 ID");
        }
        if (issues.some(i => i.includes("餘額不足"))) {
            console.log("   - 確保用戶有足夠的 SoulShard 代幣");
        }
        if (issues.some(i => i.includes("授權額度不足"))) {
            console.log("   - 先授權 DungeonMaster 合約使用 SoulShard");
        }
        if (issues.some(i => i.includes("logicContract"))) {
            console.log("   - 設置 DungeonStorage 的 logicContract 為 DungeonMaster");
        }
    }
}

main()
    .then(() => {
        console.log("\n🎉 診斷完成！");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 診斷失敗:", error);
        process.exit(1);
    });