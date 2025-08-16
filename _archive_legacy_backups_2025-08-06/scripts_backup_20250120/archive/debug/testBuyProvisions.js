const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 測試儲備購買功能...\n");
    
    const [signer] = await ethers.getSigners();
    console.log("測試錢包:", signer.address);
    
    const addresses = {
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
        party: "0xE0272e1D76de1F789ce0996F3226bCf54a8c7735",
    };
    
    try {
        // 1. 獲取合約實例
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        const soulShard = await ethers.getContractAt("IERC20", addresses.soulShard);
        const party = await ethers.getContractAt("Party", addresses.party);
        
        // 2. 檢查用戶是否有隊伍
        const balance = await party.balanceOf(signer.address);
        console.log(`隊伍數量: ${balance}`);
        
        if (balance === 0n) {
            console.log("❌ 沒有隊伍，無法測試");
            return;
        }
        
        // 獲取第一個隊伍
        const partyId = await party.tokenOfOwnerByIndex(signer.address, 0);
        console.log(`使用隊伍 ID: ${partyId}`);
        
        // 3. 檢查 SoulShard 餘額
        const soulBalance = await soulShard.balanceOf(signer.address);
        console.log(`SoulShard 餘額: ${ethers.formatEther(soulBalance)} $SOUL`);
        
        // 4. 檢查授權
        const allowance = await soulShard.allowance(signer.address, addresses.dungeonMaster);
        console.log(`授權額度: ${ethers.formatEther(allowance)} $SOUL`);
        
        // 5. 計算購買 1 個儲備需要的金額
        const provisionPrice = await dungeonMaster.provisionPriceUSD();
        const dungeonCore = await dungeonMaster.dungeonCore();
        console.log(`儲備單價: ${ethers.formatEther(provisionPrice)} USD`);
        console.log(`DungeonCore 地址: ${dungeonCore}`);
        
        // 計算實際需要的 SoulShard（這裡簡化處理）
        const estimatedCost = ethers.parseEther("0.1"); // 估算 0.1 SOUL
        
        // 6. 如果授權不足，先授權
        if (allowance < estimatedCost) {
            console.log("\n📝 授權 SoulShard...");
            const approveTx = await soulShard.approve(addresses.dungeonMaster, ethers.MaxUint256);
            await approveTx.wait();
            console.log("✅ 授權成功!");
        }
        
        // 7. 嘗試購買儲備
        console.log("\n💰 購買 1 個儲備...");
        try {
            const buyTx = await dungeonMaster.buyProvisions(partyId, 1);
            const receipt = await buyTx.wait();
            console.log("✅ 購買成功!");
            console.log("交易哈希:", receipt.hash);
        } catch (error) {
            console.error("❌ 購買失敗:");
            console.error(error.message);
            
            // 解析錯誤
            if (error.message.includes("DM: DungeonCore not set")) {
                console.log("🔧 問題: DungeonCore 未設置");
            } else if (error.message.includes("DM: Amount must be > 0")) {
                console.log("🔧 問題: 數量必須大於 0");
            } else if (error.message.includes("transfer amount exceeds balance")) {
                console.log("🔧 問題: SoulShard 餘額不足");
            } else if (error.message.includes("transfer amount exceeds allowance")) {
                console.log("🔧 問題: 授權額度不足");
            }
        }
        
    } catch (error) {
        console.error("測試過程中發生錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });