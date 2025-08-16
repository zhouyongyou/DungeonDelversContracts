const { ethers } = require("hardhat");

async function main() {
    console.log("🔬 模擬 buyProvisions 的每一步...\n");
    
    const [signer] = await ethers.getSigners();
    
    const addresses = {
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
        dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6",
        dungeonStorage: "0x40D0DFA394707e26247a1EFfAe0f9C1b248Fff10",
        party: "0xE0272e1D76de1F789ce0996F3226bCf54a8c7735",
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
    };
    
    try {
        // 獲取合約實例
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        const dungeonStorage = await ethers.getContractAt("DungeonStorage", addresses.dungeonStorage);
        const party = await ethers.getContractAt("Party", addresses.party);
        
        const partyId = 1;
        const amount = 1;
        
        console.log("步驟 1: 檢查 onlyPartyOwner 修飾符");
        const owner = await party.ownerOf(partyId);
        console.log(`隊伍 #${partyId} 擁有者: ${owner}`);
        console.log(`當前錢包: ${signer.address}`);
        console.log(`是擁有者: ${owner.toLowerCase() === signer.address.toLowerCase() ? '✅' : '❌'}`);
        
        console.log("\n步驟 2: 檢查 whenNotPaused");
        const isPaused = await dungeonMaster.paused();
        console.log(`合約暫停狀態: ${isPaused}`);
        console.log(`通過檢查: ${!isPaused ? '✅' : '❌'}`);
        
        console.log("\n步驟 3: 檢查金額和 DungeonCore");
        console.log(`金額 > 0: ${amount > 0 ? '✅' : '❌'}`);
        const coreAddress = await dungeonMaster.dungeonCore();
        console.log(`DungeonCore 地址: ${coreAddress}`);
        console.log(`DungeonCore 已設定: ${coreAddress !== ethers.ZeroAddress ? '✅' : '❌'}`);
        
        console.log("\n步驟 4: 計算成本");
        const provisionPrice = await dungeonMaster.provisionPriceUSD();
        const totalCostUSD = provisionPrice * BigInt(amount);
        console.log(`單價: ${ethers.formatEther(provisionPrice)} USD`);
        console.log(`總價: ${ethers.formatEther(totalCostUSD)} USD`);
        
        console.log("\n步驟 5: 獲取 SoulShard 需求");
        const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(totalCostUSD);
        console.log(`需要 SoulShard: ${ethers.formatEther(requiredSoulShard)}`);
        
        console.log("\n步驟 6: 檢查 SoulShard 餘額和授權");
        const ERC20_ABI = [
            "function balanceOf(address) view returns (uint256)",
            "function allowance(address,address) view returns (uint256)"
        ];
        const soulShard = new ethers.Contract(addresses.soulShard, ERC20_ABI, signer);
        const balance = await soulShard.balanceOf(signer.address);
        const allowance = await soulShard.allowance(signer.address, addresses.dungeonMaster);
        console.log(`餘額: ${ethers.formatEther(balance)}`);
        console.log(`授權: ${ethers.formatEther(allowance)}`);
        console.log(`餘額充足: ${balance >= requiredSoulShard ? '✅' : '❌'}`);
        console.log(`授權充足: ${allowance >= requiredSoulShard ? '✅' : '❌'}`);
        
        console.log("\n步驟 7: 測試 safeTransferFrom");
        // 這步會在實際交易中執行
        console.log("safeTransferFrom 將轉移", ethers.formatEther(requiredSoulShard), "SOUL");
        
        console.log("\n步驟 8: 測試讀取隊伍狀態");
        const status = await dungeonStorage.getPartyStatus(partyId);
        console.log("當前隊伍狀態:");
        console.log(`  儲備: ${status.provisionsRemaining}`);
        console.log(`  冷卻結束: ${status.cooldownEndsAt}`);
        console.log(`  未領取獎勵: ${status.unclaimedRewards}`);
        console.log(`  疲勞等級: ${status.fatigueLevel}`);
        
        console.log("\n步驟 9: 測試更新隊伍狀態");
        const newProvisions = status.provisionsRemaining + BigInt(amount);
        console.log(`新的儲備數量將是: ${newProvisions}`);
        
        // 嘗試模擬整個交易
        console.log("\n步驟 10: 執行完整的 staticCall 測試");
        try {
            await dungeonMaster.buyProvisions.staticCall(partyId, amount);
            console.log("✅ staticCall 成功！");
        } catch (error) {
            console.log("❌ staticCall 失敗!");
            console.log("錯誤:", error.message);
            
            // 更詳細的錯誤分析
            if (error.message.includes("DM: Not party owner")) {
                console.log("問題: 不是隊伍擁有者");
            } else if (error.message.includes("transfer amount exceeds balance")) {
                console.log("問題: SoulShard 餘額不足");
            } else if (error.message.includes("transfer amount exceeds allowance")) {
                console.log("問題: 授權額度不足");
            } else if (error.message.includes("Storage: Caller is not the authorized logic contract")) {
                console.log("問題: DungeonMaster 無法調用 DungeonStorage");
            }
        }
        
    } catch (error) {
        console.error("\n發生錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });