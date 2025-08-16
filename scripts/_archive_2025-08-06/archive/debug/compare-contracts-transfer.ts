// scripts/compare-contracts-transfer.ts - 比較 Relic 和 DungeonMaster 的 transferFrom

import { ethers } from "hardhat";
import { formatEther } from "ethers";

const USER_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
const SOUL_SHARD = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
const DUNGEON_MASTER = "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A";
const RELIC = "0x7023E506A9AD9339D5150c1c9F767A422066D3Df";

async function main() {
    console.log("🔍 比較 Relic 和 DungeonMaster 的 transferFrom 行為...\n");
    
    const [signer] = await ethers.getSigners();
    
    const soulShard = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SOUL_SHARD);
    const relic = await ethers.getContractAt("Relic", RELIC);
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", DUNGEON_MASTER);
    
    try {
        console.log("===== 1. 檢查合約中的 SoulShard 地址 =====\n");
        
        const soulShardInRelic = await relic.soulShardToken();
        const soulShardInDM = await dungeonMaster.soulShardToken();
        
        console.log(`Relic 中的 SoulShard: ${soulShardInRelic}`);
        console.log(`DungeonMaster 中的 SoulShard: ${soulShardInDM}`);
        console.log(`實際 SoulShard 地址: ${SOUL_SHARD}`);
        console.log(`\nRelic 地址匹配: ${soulShardInRelic.toLowerCase() === SOUL_SHARD.toLowerCase() ? '✅' : '❌'}`);
        console.log(`DungeonMaster 地址匹配: ${soulShardInDM.toLowerCase() === SOUL_SHARD.toLowerCase() ? '✅' : '❌'}`);
        
        console.log("\n===== 2. 檢查用戶授權 =====\n");
        
        const userBalance = await soulShard.balanceOf(USER_ADDRESS);
        const dmAllowance = await soulShard.allowance(USER_ADDRESS, DUNGEON_MASTER);
        const relicAllowance = await soulShard.allowance(USER_ADDRESS, RELIC);
        
        console.log(`用戶 SoulShard 餘額: ${formatEther(userBalance)}`);
        console.log(`用戶對 DungeonMaster 的授權: ${formatEther(dmAllowance)}`);
        console.log(`用戶對 Relic 的授權: ${formatEther(relicAllowance)}`);
        
        console.log("\n===== 3. 測試 Relic mintFromWallet =====\n");
        
        // 計算 Relic 鑄造所需金額
        const relicMintPrice = await relic.mintPriceUSD();
        const relicPlatformFee = await relic.platformFee();
        console.log(`Relic 鑄造價格: ${formatEther(relicMintPrice)} USD`);
        console.log(`Relic 平台費: ${formatEther(relicPlatformFee)} BNB`);
        
        // 模擬 Relic 鑄造
        try {
            const relicMintData = relic.interface.encodeFunctionData("mintFromWallet", [1n]);
            const relicGas = await ethers.provider.estimateGas({
                from: USER_ADDRESS,
                to: RELIC,
                data: relicMintData,
                value: relicPlatformFee
            });
            console.log(`✅ Relic mintFromWallet 模擬成功！估算 Gas: ${relicGas}`);
        } catch (error: any) {
            console.log(`❌ Relic mintFromWallet 模擬失敗: ${error.message}`);
        }
        
        console.log("\n===== 4. 測試 DungeonMaster buyProvisions =====\n");
        
        // 模擬 DungeonMaster 購買
        try {
            const dmBuyData = dungeonMaster.interface.encodeFunctionData("buyProvisions", [2n, 1n]);
            const dmGas = await ethers.provider.estimateGas({
                from: USER_ADDRESS,
                to: DUNGEON_MASTER,
                data: dmBuyData
            });
            console.log(`✅ DungeonMaster buyProvisions 模擬成功！估算 Gas: ${dmGas}`);
        } catch (error: any) {
            console.log(`❌ DungeonMaster buyProvisions 模擬失敗: ${error.message}`);
        }
        
        console.log("\n===== 5. 直接測試 transferFrom =====\n");
        
        const testAmount = ethers.parseEther("1");
        
        // 測試到 Relic
        console.log("\n測試 transferFrom 到 Relic:");
        try {
            await soulShard.transferFrom.staticCall(USER_ADDRESS, RELIC, testAmount, { from: USER_ADDRESS });
            console.log("✅ 成功");
        } catch (error: any) {
            console.log(`❌ 失敗: ${error.message}`);
        }
        
        // 測試到 DungeonMaster
        console.log("\n測試 transferFrom 到 DungeonMaster:");
        try {
            await soulShard.transferFrom.staticCall(USER_ADDRESS, DUNGEON_MASTER, testAmount, { from: USER_ADDRESS });
            console.log("✅ 成功");
        } catch (error: any) {
            console.log(`❌ 失敗: ${error.message}`);
        }
        
        console.log("\n===== 6. 檢查合約代碼大小 =====\n");
        
        const dmCode = await ethers.provider.getCode(DUNGEON_MASTER);
        const relicCode = await ethers.provider.getCode(RELIC);
        const soulShardCode = await ethers.provider.getCode(SOUL_SHARD);
        
        console.log(`DungeonMaster 代碼大小: ${dmCode.length / 2} bytes`);
        console.log(`Relic 代碼大小: ${relicCode.length / 2} bytes`);
        console.log(`SoulShard 代碼大小: ${soulShardCode.length / 2} bytes`);
        
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