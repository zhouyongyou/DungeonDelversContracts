const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 深入診斷儲備購買問題...\n");
    
    const [signer] = await ethers.getSigners();
    
    const addresses = {
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0".toLowerCase(),
        dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6".toLowerCase(),
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a".toLowerCase(),
        party: "0xE0272e1D76de1F789ce0996F3226bCf54a8c7735".toLowerCase(),
        hero: "0x929a4187A462314fCC480ff547019fA122A283f0".toLowerCase(),
    };
    
    try {
        // 1. 比較 Hero 和 DungeonMaster 的設置
        console.log("1️⃣ 比較 Hero 和 DungeonMaster 的 SoulShard 設置:");
        
        const hero = await ethers.getContractAt("Hero", addresses.hero);
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        
        // Hero 的 soulShardToken
        const heroSoulShard = await hero.soulShardToken();
        console.log(`   Hero.soulShardToken: ${heroSoulShard}`);
        
        // DungeonCore 的 soulShardTokenAddress
        const coreSoulShard = await dungeonCore.soulShardTokenAddress();
        console.log(`   DungeonCore.soulShardTokenAddress: ${coreSoulShard}`);
        
        console.log(`   兩者匹配: ${heroSoulShard.toLowerCase() === coreSoulShard.toLowerCase() ? '✅' : '❌'}`);
        
        // 2. 檢查 DungeonMaster 的 dungeonCore 設置
        console.log("\n2️⃣ 檢查 DungeonMaster 的設置:");
        const dmDungeonCore = await dungeonMaster.dungeonCore();
        console.log(`   DungeonMaster.dungeonCore: ${dmDungeonCore}`);
        console.log(`   正確設置: ${dmDungeonCore.toLowerCase() === addresses.dungeonCore.toLowerCase() ? '✅' : '❌'}`);
        
        // 3. 模擬調用 buyProvisions 的前幾步
        console.log("\n3️⃣ 模擬 buyProvisions 執行過程:");
        
        // 獲取第一個隊伍
        const party = await ethers.getContractAt("Party", addresses.party);
        const balance = await party.balanceOf(signer.address);
        
        if (balance === 0n) {
            console.log("   ❌ 沒有隊伍，無法繼續測試");
            return;
        }
        
        // 簡單使用 tokenId 1 進行測試
        const partyId = 1;
        console.log(`   使用隊伍 ID: ${partyId}`);
        
        // 檢查是否為隊伍擁有者
        const partyOwner = await party.ownerOf(partyId);
        console.log(`   隊伍擁有者: ${partyOwner}`);
        console.log(`   是擁有者: ${partyOwner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);
        
        // 檢查合約是否暫停
        const isPaused = await dungeonMaster.paused();
        console.log(`   合約暫停: ${isPaused ? '❌' : '✅ 否'}`);
        
        // 獲取儲備價格
        const provisionPriceUSD = await dungeonMaster.provisionPriceUSD();
        console.log(`   儲備單價: ${ethers.formatEther(provisionPriceUSD)} USD`);
        
        // 4. 測試 getSoulShardAmountForUSD
        console.log("\n4️⃣ 測試價格轉換:");
        try {
            const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(provisionPriceUSD);
            console.log(`   1個儲備需要: ${ethers.formatEther(requiredSoulShard)} SOUL`);
            
            // 檢查餘額
            const soulShardToken = await ethers.getContractAt("IERC20", addresses.soulShard);
            const userBalance = await soulShardToken.balanceOf(signer.address);
            console.log(`   用戶餘額: ${ethers.formatEther(userBalance)} SOUL`);
            console.log(`   餘額充足: ${userBalance >= requiredSoulShard ? '✅' : '❌'}`);
            
            // 檢查授權
            const allowance = await soulShardToken.allowance(signer.address, addresses.dungeonMaster);
            console.log(`   授權額度: ${ethers.formatEther(allowance)} SOUL`);
            console.log(`   授權充足: ${allowance >= requiredSoulShard ? '✅' : '❌'}`);
            
        } catch (error) {
            console.log(`   ❌ 價格轉換失敗: ${error.message}`);
        }
        
        // 5. 直接調用 buyProvisions 看錯誤
        console.log("\n5️⃣ 嘗試購買儲備:");
        try {
            // 先確保有授權
            const soulShardToken = await ethers.getContractAt("IERC20", addresses.soulShard);
            const allowance = await soulShardToken.allowance(signer.address, addresses.dungeonMaster);
            
            if (allowance === 0n) {
                console.log("   正在授權...");
                const approveTx = await soulShardToken.approve(addresses.dungeonMaster, ethers.MaxUint256);
                await approveTx.wait();
                console.log("   ✅ 授權成功");
            }
            
            // 執行購買
            console.log("   執行 buyProvisions(partyId: " + partyId + ", amount: 1)...");
            const tx = await dungeonMaster.buyProvisions(partyId, 1);
            const receipt = await tx.wait();
            console.log("   ✅ 購買成功！交易: " + receipt.hash);
            
        } catch (error) {
            console.log("   ❌ 購買失敗!");
            console.log("   錯誤訊息: " + error.message);
            
            // 解析具體錯誤
            if (error.data) {
                try {
                    const decodedError = dungeonMaster.interface.parseError(error.data);
                    console.log("   解碼錯誤: ", decodedError);
                } catch {}
            }
        }
        
    } catch (error) {
        console.error("診斷過程中發生錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });