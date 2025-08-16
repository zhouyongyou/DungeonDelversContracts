const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 詳細診斷儲備購買錯誤...\n");
    
    const [signer] = await ethers.getSigners();
    
    const addresses = {
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
        dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6",
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
        party: "0xE0272e1D76de1F789ce0996F3226bCf54a8c7735",
    };
    
    try {
        // 獲取合約
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        const party = await ethers.getContractAt("Party", addresses.party);
        
        // 使用簡單的 ERC20 ABI
        const ERC20_ABI = [
            "function balanceOf(address) view returns (uint256)",
            "function allowance(address,address) view returns (uint256)",
            "function transfer(address,uint256) returns (bool)",
            "function transferFrom(address,address,uint256) returns (bool)"
        ];
        const soulShard = new ethers.Contract(addresses.soulShard, ERC20_ABI, signer);
        
        console.log("1️⃣ 檢查 DungeonMaster 設定:");
        const dmCore = await dungeonMaster.dungeonCore();
        const dmStorage = await dungeonMaster.dungeonStorage();
        console.log(`   dungeonCore: ${dmCore}`);
        console.log(`   dungeonStorage: ${dmStorage}`);
        console.log(`   暫停狀態: ${await dungeonMaster.paused()}`);
        
        console.log("\n2️⃣ 檢查 DungeonCore 的 SoulShard:");
        const coreSoulShard = await dungeonCore.soulShardTokenAddress();
        console.log(`   SoulShard in Core: ${coreSoulShard}`);
        console.log(`   匹配前端地址: ${coreSoulShard.toLowerCase() === addresses.soulShard.toLowerCase() ? '✅' : '❌'}`);
        
        console.log("\n3️⃣ 檢查隊伍擁有權:");
        const partyId = 1;
        try {
            const owner = await party.ownerOf(partyId);
            console.log(`   隊伍 #${partyId} 擁有者: ${owner}`);
            console.log(`   是當前錢包: ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);
        } catch (e) {
            console.log(`   隊伍 #${partyId}: ❌ 不存在`);
            return;
        }
        
        console.log("\n4️⃣ 計算購買成本:");
        const provisionPrice = await dungeonMaster.provisionPriceUSD();
        const requiredSoul = await dungeonCore.getSoulShardAmountForUSD(provisionPrice);
        console.log(`   單價: ${ethers.formatEther(provisionPrice)} USD`);
        console.log(`   需要: ${ethers.formatEther(requiredSoul)} SOUL`);
        
        console.log("\n5️⃣ 檢查餘額和授權:");
        const balance = await soulShard.balanceOf(signer.address);
        const allowance = await soulShard.allowance(signer.address, addresses.dungeonMaster);
        console.log(`   餘額: ${ethers.formatEther(balance)} SOUL`);
        console.log(`   授權: ${ethers.formatEther(allowance)} SOUL`);
        console.log(`   餘額充足: ${balance >= requiredSoul ? '✅' : '❌'}`);
        console.log(`   授權充足: ${allowance >= requiredSoul ? '✅' : '❌'}`);
        
        console.log("\n6️⃣ 模擬 buyProvisions 內部流程:");
        
        // 測試從 DungeonCore 獲取 SoulShard 地址
        console.log("   測試 dungeonCore.soulShardTokenAddress()...");
        const testSoulShardAddress = await dungeonCore.soulShardTokenAddress();
        console.log(`   返回: ${testSoulShardAddress}`);
        
        // 測試能否創建 IERC20 實例
        console.log("   測試創建 IERC20 實例...");
        const testToken = new ethers.Contract(testSoulShardAddress, ERC20_ABI, signer);
        const testBalance = await testToken.balanceOf(signer.address);
        console.log(`   成功獲取餘額: ${ethers.formatEther(testBalance)} SOUL`);
        
        console.log("\n7️⃣ 執行實際購買:");
        try {
            // 使用 staticCall 來獲取更詳細的錯誤
            await dungeonMaster.buyProvisions.staticCall(partyId, 1);
            console.log("   ✅ 靜態調用成功，開始實際交易...");
            
            const tx = await dungeonMaster.buyProvisions(partyId, 1);
            const receipt = await tx.wait();
            console.log("   ✅ 購買成功!");
            console.log("   交易哈希:", receipt.hash);
        } catch (error) {
            console.log("   ❌ 購買失敗!");
            console.log("   錯誤類型:", error.code);
            console.log("   錯誤訊息:", error.message);
            
            if (error.data) {
                console.log("   錯誤數據:", error.data);
                
                // 嘗試解碼錯誤
                try {
                    const iface = dungeonMaster.interface;
                    const decoded = iface.parseError(error.data);
                    console.log("   解碼錯誤:", decoded);
                } catch (e) {
                    console.log("   無法解碼錯誤");
                }
            }
            
            // 檢查是否是 SafeERC20 的錯誤
            if (error.message.includes("SafeERC20")) {
                console.log("\n   💡 可能是 SafeERC20 相關問題");
                console.log("   檢查 DungeonMaster 是否能正確調用 transferFrom...");
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