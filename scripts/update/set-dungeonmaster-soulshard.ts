// scripts/set-dungeonmaster-soulshard.ts
import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔧 設定 DungeonMaster 的 SoulShard Token...\n");

    const dungeonMasterAddress = "0x311730fa5459fa099976B139f7007d98C2F1E7A7"; // V3 DungeonMaster
    const soulShardAddress = process.env.SOUL_SHARD_TOKEN_ADDRESS || "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
    
    const [signer] = await ethers.getSigners();
    console.log(`執行者: ${signer.address}`);
    
    // 取得 DungeonMaster 合約
    const dungeonMaster = await ethers.getContractAt("DungeonMasterV2", dungeonMasterAddress);
    
    try {
        // 檢查當前設定
        const currentSoulShard = await dungeonMaster.soulShardToken();
        console.log(`\n當前 SoulShard Token: ${currentSoulShard}`);
        
        if (currentSoulShard === ethers.ZeroAddress) {
            console.log("❌ SoulShard Token 尚未設定！");
            
            // 設定 SoulShard Token
            console.log(`\n正在設定 SoulShard Token 為: ${soulShardAddress}...`);
            const tx = await dungeonMaster.setSoulShardToken(soulShardAddress);
            console.log(`交易已發送: ${tx.hash}`);
            
            await tx.wait();
            console.log("✅ 交易已確認！");
            
            // 驗證設定
            const newSoulShard = await dungeonMaster.soulShardToken();
            console.log(`\n新的 SoulShard Token: ${newSoulShard}`);
            
            if (newSoulShard === soulShardAddress) {
                console.log("✅ SoulShard Token 設定成功！");
            } else {
                console.log("❌ 設定失敗，請檢查交易");
            }
        } else if (currentSoulShard.toLowerCase() === soulShardAddress.toLowerCase()) {
            console.log("✅ SoulShard Token 已正確設定");
        } else {
            console.log(`⚠️ SoulShard Token 已設定為不同地址: ${currentSoulShard}`);
            console.log(`期望地址: ${soulShardAddress}`);
        }
        
    } catch (error: any) {
        console.error("\n❌ 錯誤:", error.message);
        
        if (error.message.includes("Ownable")) {
            console.error("需要合約擁有者權限");
        }
    }
}

main().catch((error) => {
    console.error("❌ 致命錯誤:", error);
    process.exitCode = 1;
});