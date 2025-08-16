// scripts/test-buyProvisions-owner.ts - 測試從擁有者地址購買儲備

import { ethers } from "hardhat";
import { formatEther } from "ethers";

const PARTY_ID = 1n; // 使用隊伍 #1
const AMOUNT = 1n;

const CONTRACTS = {
    DUNGEON_MASTER: "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A",
    DUNGEON_CORE: "0x548A15CaFAE2a5D19f9683CDad6D57e3320E61a7",
    SOUL_SHARD: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    PARTY: "0xb069B70d61f96bE5f5529dE216538766672f1096",
    DUNGEON_STORAGE: "0xEC6773F9C52446BB2F8318dBBa09f58E72fe91b4"
};

async function main() {
    console.log("🔍 測試從擁有者地址購買儲備...\n");
    
    const [signer] = await ethers.getSigners();
    console.log(`當前簽名者地址: ${signer.address}\n`);
    
    // 連接合約
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", CONTRACTS.DUNGEON_MASTER);
    const dungeonCore = await ethers.getContractAt("DungeonCore", CONTRACTS.DUNGEON_CORE);
    const soulShard = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", CONTRACTS.SOUL_SHARD);
    const party = await ethers.getContractAt("Party", CONTRACTS.PARTY);
    
    try {
        // 1. 檢查簽名者是否擁有隊伍
        console.log("1️⃣ 檢查隊伍擁有權...");
        const partyBalance = await party.balanceOf(signer.address);
        console.log(`簽名者擁有的隊伍數量: ${partyBalance}`);
        
        let ownedPartyId = 0n;
        if (partyBalance > 0n) {
            // 獲取第一個擁有的隊伍
            ownedPartyId = await party.tokenOfOwnerByIndex(signer.address, 0);
            console.log(`使用隊伍 ID: ${ownedPartyId}`);
        } else {
            console.log("❌ 簽名者沒有擁有任何隊伍");
            return;
        }
        
        // 2. 檢查合約是否暫停
        console.log("\n2️⃣ 檢查合約狀態...");
        const isPaused = await dungeonMaster.paused();
        console.log(`DungeonMaster 暫停狀態: ${isPaused ? '❌ 已暫停' : '✅ 正常'}`);
        if (isPaused) {
            console.log("❌ 合約已暫停，無法執行交易");
            return;
        }
        
        // 3. 計算所需的 SoulShard
        console.log("\n3️⃣ 計算價格...");
        const provisionPriceUSD = await dungeonMaster.provisionPriceUSD();
        const totalCostUSD = provisionPriceUSD * AMOUNT;
        const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
        
        console.log(`單個儲備價格: ${formatEther(provisionPriceUSD)} USD`);
        console.log(`總價格: ${formatEther(totalCostUSD)} USD`);
        console.log(`所需 SoulShard: ${formatEther(requiredSoulShard)}`);
        
        // 4. 檢查餘額和授權
        console.log("\n4️⃣ 檢查餘額和授權...");
        const balance = await soulShard.balanceOf(signer.address);
        const allowance = await soulShard.allowance(signer.address, CONTRACTS.DUNGEON_MASTER);
        
        console.log(`簽名者 SoulShard 餘額: ${formatEther(balance)}`);
        console.log(`簽名者授權額度: ${formatEther(allowance)}`);
        
        if (balance < requiredSoulShard) {
            console.log("❌ 餘額不足");
            return;
        }
        
        if (allowance < requiredSoulShard) {
            console.log("需要先授權 DungeonMaster 使用 SoulShard...");
            const approveTx = await soulShard.approve(CONTRACTS.DUNGEON_MASTER, requiredSoulShard * 10n); // 授權 10 倍以供未來使用
            console.log(`授權交易: ${approveTx.hash}`);
            await approveTx.wait();
            console.log("✅ 授權成功");
        }
        
        // 5. 嘗試購買儲備
        console.log("\n5️⃣ 嘗試購買儲備...");
        console.log(`為隊伍 #${ownedPartyId} 購買 ${AMOUNT} 個儲備...`);
        
        try {
            // 先模擬交易
            await dungeonMaster.buyProvisions.staticCall(ownedPartyId, AMOUNT);
            console.log("✅ 交易模擬成功");
            
            // 執行實際交易
            const tx = await dungeonMaster.buyProvisions(ownedPartyId, AMOUNT);
            console.log(`交易已發送: ${tx.hash}`);
            console.log("等待交易確認...");
            
            const receipt = await tx.wait();
            console.log(`✅ 交易成功！Gas 使用: ${receipt.gasUsed}`);
            
            // 檢查購買後的儲備數量
            const dungeonStorage = await ethers.getContractAt("DungeonStorage", CONTRACTS.DUNGEON_STORAGE);
            const partyStatus = await dungeonStorage.getPartyStatus(ownedPartyId);
            console.log(`\n隊伍 #${ownedPartyId} 現在的儲備數量: ${partyStatus.provisionsRemaining}`);
            
        } catch (error: any) {
            console.log("❌ 交易失敗");
            console.log("錯誤訊息:", error.message);
            
            // 嘗試解碼錯誤
            if (error.data) {
                console.log("錯誤數據:", error.data);
                try {
                    if (error.data.startsWith('0x08c379a0')) {
                        const errorString = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + error.data.slice(10))[0];
                        console.log("解碼的錯誤訊息:", errorString);
                    }
                } catch (e) {
                    console.log("無法解碼錯誤數據");
                }
            }
        }
        
    } catch (error: any) {
        console.error("\n❌ 測試過程中發生錯誤:", error);
    }
}

main()
    .then(() => {
        console.log("\n🎉 測試完成！");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 測試失敗:", error);
        process.exit(1);
    });