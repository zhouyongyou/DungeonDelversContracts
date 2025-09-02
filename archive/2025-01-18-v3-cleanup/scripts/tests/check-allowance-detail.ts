// scripts/check-allowance-detail.ts - 詳細檢查授權問題

import { ethers } from "hardhat";
import { formatEther } from "ethers";

const USER_ADDRESS = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
const SOUL_SHARD = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
const DUNGEON_MASTER = "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A";
const RELIC = "0x7023E506A9AD9339D5150c1c9F767A422066D3Df";

async function main() {
    console.log("🔍 詳細檢查 SoulShard 授權問題...\n");
    
    const [signer] = await ethers.getSigners();
    console.log(`當前簽名者: ${signer.address}\n`);
    
    const soulShard = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SOUL_SHARD);
    
    try {
        console.log("===== 1. 檢查授權狀態 =====\n");
        
        // 用戶對 DungeonMaster 的授權
        const dmAllowance = await soulShard.allowance(USER_ADDRESS, DUNGEON_MASTER);
        console.log(`用戶對 DungeonMaster 的授權: ${formatEther(dmAllowance)}`);
        
        // 用戶對 Relic 的授權
        const relicAllowance = await soulShard.allowance(USER_ADDRESS, RELIC);
        console.log(`用戶對 Relic 的授權: ${formatEther(relicAllowance)}`);
        
        // 簽名者對 DungeonMaster 的授權
        const signerDMAllowance = await soulShard.allowance(signer.address, DUNGEON_MASTER);
        console.log(`簽名者對 DungeonMaster 的授權: ${formatEther(signerDMAllowance)}`);
        
        console.log("\n===== 2. 測試 transferFrom（作為簽名者） =====\n");
        
        // 測試從用戶轉帳到簽名者
        const testAmount = ethers.parseEther("1");
        
        console.log("嘗試 transferFrom 從用戶到簽名者...");
        console.log(`調用者: ${signer.address}`);
        console.log(`從: ${USER_ADDRESS}`);
        console.log(`到: ${signer.address}`);
        console.log(`金額: ${formatEther(testAmount)}`);
        
        try {
            // 檢查簽名者對用戶的授權
            const signerAllowanceFromUser = await soulShard.allowance(USER_ADDRESS, signer.address);
            console.log(`\n簽名者從用戶獲得的授權: ${formatEther(signerAllowanceFromUser)}`);
            
            if (signerAllowanceFromUser >= testAmount) {
                const result = await soulShard.transferFrom.staticCall(
                    USER_ADDRESS,
                    signer.address,
                    testAmount
                );
                console.log("✅ transferFrom 模擬成功！");
            } else {
                console.log("❌ 授權不足");
            }
        } catch (error: any) {
            console.log(`❌ transferFrom 失敗: ${error.message}`);
        }
        
        console.log("\n===== 3. 模擬 DungeonMaster 調用 =====\n");
        
        // 使用 impersonateAccount 來模擬 DungeonMaster
        console.log("檢查如果從 DungeonMaster 合約調用...");
        
        // 直接測試授權查詢
        const dmToUserAllowance = await soulShard.allowance(USER_ADDRESS, DUNGEON_MASTER);
        console.log(`再次確認：用戶對 DungeonMaster 的授權: ${formatEther(dmToUserAllowance)}`);
        
        // 測試是否可以從用戶轉到 DungeonMaster
        console.log("\n模擬 transferFrom 從用戶到 DungeonMaster...");
        try {
            const transferData = soulShard.interface.encodeFunctionData("transferFrom", [
                USER_ADDRESS,
                DUNGEON_MASTER,
                testAmount
            ]);
            
            // 嘗試從不同地址調用
            const result = await signer.call({
                to: SOUL_SHARD,
                data: transferData
            });
            
            console.log("調用結果:", result);
        } catch (error: any) {
            console.log("❌ 調用失敗:", error.message);
            
            if (error.data) {
                try {
                    const errorString = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + error.data.slice(10))[0];
                    console.log("錯誤訊息:", errorString);
                } catch (e) {}
            }
        }
        
        console.log("\n===== 4. 比較 Relic 合約的調用 =====\n");
        
        // 測試與 Relic 合約的交互
        console.log("測試 transferFrom 到 Relic 合約...");
        try {
            const relicTransferData = soulShard.interface.encodeFunctionData("transferFrom", [
                USER_ADDRESS,
                RELIC,
                testAmount
            ]);
            
            const relicResult = await signer.call({
                to: SOUL_SHARD,
                data: relicTransferData
            });
            
            console.log("Relic 調用結果:", relicResult);
        } catch (error: any) {
            console.log("❌ Relic 調用失敗:", error.message);
        }
        
        console.log("\n===== 5. 檢查 msg.sender 問題 =====\n");
        
        console.log("關鍵發現：");
        console.log("- 當從外部帳戶（EOA）調用 DungeonMaster.buyProvisions 時");
        console.log("- DungeonMaster 合約會調用 soulShard.safeTransferFrom(msg.sender, address(this), amount)");
        console.log("- 此時 msg.sender 是用戶地址，但執行 transferFrom 的是 DungeonMaster 合約");
        console.log("- 需要檢查的授權是：用戶授權給 DungeonMaster，而不是用戶授權給調用者");
        
    } catch (error: any) {
        console.error("\n❌ 檢查過程中發生錯誤:", error);
    }
}

main()
    .then(() => {
        console.log("\n🎉 檢查完成！");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 檢查失敗:", error);
        process.exit(1);
    });