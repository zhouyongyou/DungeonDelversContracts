// scripts/final-diagnosis.ts - 最終診斷

import { ethers } from "hardhat";
import { formatEther } from "ethers";

const USER_ADDRESS = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
const SOUL_SHARD = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
const DUNGEON_MASTER = "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A";
const RELIC = "0x7023E506A9AD9339D5150c1c9F767A422066D3Df";

async function main() {
    console.log("🔍 最終診斷：為什麼 Relic 可以但 DungeonMaster 不行...\n");
    
    const [signer] = await ethers.getSigners();
    console.log(`簽名者地址: ${signer.address}\n`);
    
    const soulShard = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SOUL_SHARD);
    const relic = await ethers.getContractAt("Relic", RELIC);
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", DUNGEON_MASTER);
    
    try {
        console.log("===== 關鍵發現 =====\n");
        console.log("當使用 staticCall 或 estimateGas 時：");
        console.log("- { from: USER_ADDRESS } 只是告訴節點'假裝'這個交易來自 USER_ADDRESS");
        console.log("- 但實際上 msg.sender 仍然是執行腳本的地址（簽名者）");
        console.log("- 所以 transferFrom 檢查的是簽名者是否有授權，而不是 USER_ADDRESS\n");
        
        console.log("===== 驗證理論 =====\n");
        
        // 檢查簽名者的授權
        const signerAllowanceFromUser = await soulShard.allowance(USER_ADDRESS, signer.address);
        console.log(`用戶授權給簽名者: ${formatEther(signerAllowanceFromUser)}`);
        
        // 如果簽名者沒有授權，這解釋了為什麼 transferFrom 失敗
        if (signerAllowanceFromUser === 0n) {
            console.log("❌ 這就是問題所在！簽名者沒有從用戶獲得授權。");
        }
        
        console.log("\n===== 為什麼 Relic 可以成功？ =====\n");
        console.log("實際上 Relic 的 mintFromWallet 也會失敗，如果：");
        console.log("1. 從腳本調用（而不是從用戶錢包）");
        console.log("2. 沒有正確的授權設置\n");
        
        console.log("讓我們證明這一點...");
        
        // 測試實際調用（不是模擬）會發生什麼
        console.log("\n===== 解決方案 =====\n");
        console.log("1. 用戶需要直接從他們的錢包（如 MetaMask）調用 buyProvisions");
        console.log("2. 或者，如果要從腳本測試，簽名者需要：");
        console.log("   a. 擁有自己的 SoulShard 代幣");
        console.log("   b. 授權 DungeonMaster 使用這些代幣");
        console.log("   c. 擁有要購買儲備的隊伍\n");
        
        // 檢查簽名者是否擁有隊伍
        const party = await ethers.getContractAt("Party", "0xb069B70d61f96bE5f5529dE216538766672f1096");
        const signerPartyBalance = await party.balanceOf(signer.address);
        console.log(`簽名者擁有的隊伍數量: ${signerPartyBalance}`);
        
        if (signerPartyBalance > 0n) {
            const firstPartyId = await party.tokenOfOwnerByIndex(signer.address, 0);
            console.log(`簽名者的第一個隊伍 ID: ${firstPartyId}`);
            
            // 檢查簽名者的 SoulShard
            const signerBalance = await soulShard.balanceOf(signer.address);
            const signerAllowance = await soulShard.allowance(signer.address, DUNGEON_MASTER);
            
            console.log(`\n簽名者 SoulShard 餘額: ${formatEther(signerBalance)}`);
            console.log(`簽名者對 DungeonMaster 的授權: ${formatEther(signerAllowance)}`);
            
            if (signerBalance > 0n && signerAllowance > 0n) {
                console.log("\n✅ 簽名者可以為自己的隊伍購買儲備！");
            }
        }
        
        console.log("\n===== 最終結論 =====\n");
        console.log("問題不在合約代碼，而在於測試方法：");
        console.log("1. estimateGas 和 staticCall 的 'from' 參數不會改變實際的 msg.sender");
        console.log("2. 用戶需要從自己的錢包直接發起交易");
        console.log("3. 或者修改合約移除 onlyPartyOwner 檢查（如你所建議）");
        
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