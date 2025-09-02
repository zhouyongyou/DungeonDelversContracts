// scripts/test-soulshard-transfer.ts - 測試 SoulShard transferFrom 功能

import { ethers } from "hardhat";
import { formatEther, parseEther } from "ethers";

const USER_ADDRESS = "0xEbCF4A36Ad1485A9737025e9d72186b604487274";
const SOUL_SHARD = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
const DUNGEON_MASTER = "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A";

async function main() {
    console.log("🔍 測試 SoulShard transferFrom 功能...\n");
    
    const [signer] = await ethers.getSigners();
    console.log(`當前簽名者: ${signer.address}\n`);
    
    const soulShard = await ethers.getContractAt("@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20", SOUL_SHARD);
    
    try {
        // 1. 檢查基本信息
        console.log("1️⃣ 檢查 SoulShard 基本信息...");
        const name = await soulShard.name();
        const symbol = await soulShard.symbol();
        const decimals = await soulShard.decimals();
        const totalSupply = await soulShard.totalSupply();
        
        console.log(`名稱: ${name}`);
        console.log(`符號: ${symbol}`);
        console.log(`小數位: ${decimals}`);
        console.log(`總供應量: ${formatEther(totalSupply)}\n`);
        
        // 2. 檢查用戶餘額和授權
        console.log("2️⃣ 檢查用戶餘額和授權...");
        const userBalance = await soulShard.balanceOf(USER_ADDRESS);
        const userAllowance = await soulShard.allowance(USER_ADDRESS, DUNGEON_MASTER);
        const signerBalance = await soulShard.balanceOf(signer.address);
        
        console.log(`用戶餘額: ${formatEther(userBalance)}`);
        console.log(`用戶對 DungeonMaster 的授權: ${formatEther(userAllowance)}`);
        console.log(`簽名者餘額: ${formatEther(signerBalance)}\n`);
        
        // 3. 測試直接轉帳（從簽名者）
        if (signerBalance > parseEther("1")) {
            console.log("3️⃣ 測試直接轉帳...");
            const transferAmount = parseEther("0.1");
            
            try {
                const tx = await soulShard.transfer(USER_ADDRESS, transferAmount);
                console.log(`轉帳交易: ${tx.hash}`);
                await tx.wait();
                console.log("✅ 直接轉帳成功\n");
            } catch (error: any) {
                console.log("❌ 直接轉帳失敗:", error.message, "\n");
            }
        }
        
        // 4. 測試 transferFrom（模擬 DungeonMaster 的操作）
        console.log("4️⃣ 測試 transferFrom（模擬 DungeonMaster）...");
        const testAmount = parseEther("1"); // 測試轉帳 1 個代幣
        
        if (userBalance >= testAmount && userAllowance >= testAmount) {
            console.log(`嘗試從用戶轉帳 ${formatEther(testAmount)} 到簽名者地址...`);
            
            try {
                // 獲取轉帳前的餘額
                const beforeUserBalance = await soulShard.balanceOf(USER_ADDRESS);
                const beforeSignerBalance = await soulShard.balanceOf(signer.address);
                
                // 執行 transferFrom
                const tx = await soulShard.transferFrom(USER_ADDRESS, signer.address, testAmount);
                console.log(`TransferFrom 交易: ${tx.hash}`);
                const receipt = await tx.wait();
                console.log(`Gas 使用: ${receipt.gasUsed}`);
                
                // 檢查轉帳後的餘額
                const afterUserBalance = await soulShard.balanceOf(USER_ADDRESS);
                const afterSignerBalance = await soulShard.balanceOf(signer.address);
                
                console.log("\n餘額變化:");
                console.log(`用戶: ${formatEther(beforeUserBalance)} → ${formatEther(afterUserBalance)}`);
                console.log(`簽名者: ${formatEther(beforeSignerBalance)} → ${formatEther(afterSignerBalance)}`);
                console.log("✅ TransferFrom 成功！");
                
            } catch (error: any) {
                console.log("❌ TransferFrom 失敗");
                console.log("錯誤訊息:", error.message);
                
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
        } else {
            console.log("❌ 無法測試 transferFrom：餘額或授權不足");
        }
        
        // 5. 獲取更多合約信息
        console.log("\n5️⃣ 獲取更多合約信息...");
        const code = await ethers.provider.getCode(SOUL_SHARD);
        console.log(`合約代碼長度: ${code.length} bytes`);
        console.log(`是否為合約: ${code.length > 2 ? '✅ 是' : '❌ 否'}`);
        
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