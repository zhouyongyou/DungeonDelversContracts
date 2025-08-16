// scripts/fix-soulshard-setting.ts - 修復 SoulShard 設置的腳本

import { ethers } from "hardhat";
import { formatEther } from "ethers";

const SOUL_SHARD_TOKEN_ADDRESS = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
const DUNGEON_MASTER_ADDRESS = "0x8550ACe3B6C9Ef311B995678F9263A69bC00EC3A";

async function main() {
    console.log("🔧 開始修復 DungeonMaster 中的 SoulShard 設置...\n");
    
    const [deployer] = await ethers.getSigners();
    console.log("部署者地址:", deployer.address);
    console.log("餘額:", formatEther(await deployer.provider.getBalance(deployer.address)), "BNB\n");
    
    // 連接到 DungeonMaster 合約
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", DUNGEON_MASTER_ADDRESS);
    
    try {
        // 1. 檢查當前的 SoulShard 設置
        console.log("📋 檢查當前 SoulShard 設置...");
        
        try {
            // 嘗試讀取當前設置的 SoulShard 地址
            const currentSoulShard = await dungeonMaster.soulShardToken();
            console.log("當前 SoulShard 地址:", currentSoulShard);
            
            if (currentSoulShard === SOUL_SHARD_TOKEN_ADDRESS) {
                console.log("✅ SoulShard 地址已正確設置！");
                return;
            }
            
            if (currentSoulShard === "0x0000000000000000000000000000000000000000") {
                console.log("❌ SoulShard 地址尚未設置");
            } else {
                console.log("⚠️ SoulShard 地址設置錯誤");
            }
        } catch (error) {
            console.log("❌ 無法讀取 soulShardToken，可能合約版本不同");
            console.log("錯誤:", error.message);
            
            // 嘗試通過 DungeonCore 檢查
            try {
                const dungeonCoreAddress = await dungeonMaster.dungeonCore();
                console.log("DungeonCore 地址:", dungeonCoreAddress);
                
                if (dungeonCoreAddress !== "0x0000000000000000000000000000000000000000") {
                    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
                    const soulShardFromCore = await dungeonCore.soulShardTokenAddress();
                    console.log("DungeonCore 中的 SoulShard:", soulShardFromCore);
                    
                    if (soulShardFromCore === SOUL_SHARD_TOKEN_ADDRESS) {
                        console.log("✅ DungeonCore 中的 SoulShard 地址已正確設置！");
                        console.log("此版本的 DungeonMaster 通過 DungeonCore 獲取 SoulShard 地址");
                        return;
                    }
                }
            } catch (coreError) {
                console.log("無法通過 DungeonCore 檢查 SoulShard");
            }
        }
        
        // 2. 嘗試設置 SoulShard 地址
        console.log("\n🔧 嘗試設置 SoulShard 地址...");
        
        try {
            const tx = await dungeonMaster.setSoulShardToken(SOUL_SHARD_TOKEN_ADDRESS);
            console.log("交易哈希:", tx.hash);
            
            const receipt = await tx.wait();
            console.log("✅ SoulShard 地址設置成功！");
            console.log("Gas 使用:", receipt.gasUsed.toString());
            
            // 驗證設置
            const newSoulShard = await dungeonMaster.soulShardToken();
            console.log("新的 SoulShard 地址:", newSoulShard);
            
            if (newSoulShard === SOUL_SHARD_TOKEN_ADDRESS) {
                console.log("✅ 驗證成功！SoulShard 地址已正確設置");
            } else {
                console.log("❌ 驗證失敗！設置可能有問題");
            }
            
        } catch (error) {
            console.log("❌ 設置 SoulShard 失敗:", error.message);
            
            // 檢查是否是權限問題
            if (error.message.includes("Ownable")) {
                console.log("💡 可能是權限問題，檢查部署者是否為合約 owner");
                
                try {
                    const owner = await dungeonMaster.owner();
                    console.log("合約 owner:", owner);
                    console.log("當前地址:", deployer.address);
                    console.log("是否為 owner:", owner.toLowerCase() === deployer.address.toLowerCase());
                } catch (ownerError) {
                    console.log("無法檢查 owner");
                }
            }
        }
        
    } catch (error) {
        console.error("❌ 修復過程中發生錯誤:", error);
    }
}

main()
    .then(() => {
        console.log("\n🎉 SoulShard 設置修復完成！");
        process.exit(0);
    })
    .catch((error) => {
        console.error("❌ 修復失敗:", error);
        process.exit(1);
    });