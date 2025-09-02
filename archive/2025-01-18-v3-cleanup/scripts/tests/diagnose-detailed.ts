// scripts/diagnose-detailed.ts - 詳細診斷 buyProvisions 失敗原因

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
    console.log("🔍 詳細診斷 buyProvisions 失敗原因...\n");
    
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
    
    try {
        // 1. 檢查 partyContract 地址是否正確
        console.log("1️⃣ 檢查 Party 合約地址...");
        const partyContractInCore = await dungeonCore.partyContractAddress();
        console.log(`DungeonCore 中的 Party 地址: ${partyContractInCore}`);
        console.log(`實際 Party 地址: ${CONTRACTS.PARTY}`);
        console.log(`地址匹配: ${partyContractInCore.toLowerCase() === CONTRACTS.PARTY.toLowerCase() ? '✅' : '❌'}\n`);
        
        // 2. 檢查 DungeonStorage 是否授權了 DungeonMaster
        console.log("2️⃣ 檢查 DungeonStorage 授權...");
        const logicContract = await dungeonStorage.logicContract();
        console.log(`DungeonStorage.logicContract: ${logicContract}`);
        console.log(`DungeonMaster 地址: ${CONTRACTS.DUNGEON_MASTER}`);
        console.log(`授權匹配: ${logicContract.toLowerCase() === CONTRACTS.DUNGEON_MASTER.toLowerCase() ? '✅' : '❌'}\n`);
        
        // 3. 直接呼叫函數測試每個檢查點
        console.log("3️⃣ 測試各個檢查點...");
        
        // 測試 ownerOf
        try {
            const owner = await party.ownerOf(PARTY_ID);
            console.log(`✅ ownerOf 成功: ${owner}`);
        } catch (e: any) {
            console.log(`❌ ownerOf 失敗: ${e.message}`);
        }
        
        // 測試 dungeonCore.getSoulShardAmountForUSD
        try {
            const totalCostUSD = await dungeonMaster.provisionPriceUSD() * AMOUNT;
            const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
            console.log(`✅ getSoulShardAmountForUSD 成功: ${formatEther(requiredSoulShard)}`);
        } catch (e: any) {
            console.log(`❌ getSoulShardAmountForUSD 失敗: ${e.message}`);
        }
        
        // 測試 dungeonStorage.getPartyStatus
        try {
            const status = await dungeonStorage.getPartyStatus(PARTY_ID);
            console.log(`✅ getPartyStatus 成功:`, {
                provisionsRemaining: status.provisionsRemaining.toString(),
                cooldownEndsAt: status.cooldownEndsAt.toString(),
                fatigueLevel: status.fatigueLevel.toString(),
                unclaimedRewards: status.unclaimedRewards.toString()
            });
        } catch (e: any) {
            console.log(`❌ getPartyStatus 失敗: ${e.message}`);
        }
        
        // 4. 嘗試使用較低層級的 call 來獲取更詳細的錯誤
        console.log("\n4️⃣ 使用低層級 call 測試...");
        const buyProvisionsData = dungeonMaster.interface.encodeFunctionData("buyProvisions", [PARTY_ID, AMOUNT]);
        
        try {
            const result = await signer.call({
                to: CONTRACTS.DUNGEON_MASTER,
                data: buyProvisionsData,
                from: USER_ADDRESS
            });
            console.log("✅ Call 成功，返回數據:", result);
        } catch (error: any) {
            console.log("❌ Call 失敗，錯誤詳情:");
            console.log("錯誤訊息:", error.message);
            if (error.data) {
                console.log("錯誤數據:", error.data);
                // 嘗試解碼錯誤
                try {
                    const errorData = error.data;
                    if (errorData.startsWith('0x08c379a0')) {
                        // 這是一個字符串錯誤
                        const errorString = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + errorData.slice(10))[0];
                        console.log("解碼的錯誤訊息:", errorString);
                    }
                } catch (e) {
                    console.log("無法解碼錯誤數據");
                }
            }
        }
        
        // 5. 檢查 SafeERC20 transferFrom 的條件
        console.log("\n5️⃣ 檢查 SafeERC20 transferFrom 條件...");
        const provisionPriceUSD = await dungeonMaster.provisionPriceUSD();
        const totalCostUSD = provisionPriceUSD * AMOUNT;
        const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
        
        const userBalance = await soulShard.balanceOf(USER_ADDRESS);
        const userAllowance = await soulShard.allowance(USER_ADDRESS, CONTRACTS.DUNGEON_MASTER);
        
        console.log(`需要的 SoulShard: ${formatEther(requiredSoulShard)}`);
        console.log(`用戶餘額: ${formatEther(userBalance)}`);
        console.log(`用戶授權: ${formatEther(userAllowance)}`);
        console.log(`餘額足夠: ${userBalance >= requiredSoulShard ? '✅' : '❌'}`);
        console.log(`授權足夠: ${userAllowance >= requiredSoulShard ? '✅' : '❌'}`);
        
    } catch (error: any) {
        console.error("\n❌ 診斷過程中發生錯誤:", error);
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