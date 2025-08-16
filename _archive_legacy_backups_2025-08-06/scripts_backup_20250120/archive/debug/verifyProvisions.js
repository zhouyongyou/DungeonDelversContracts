const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 驗證儲備購買配置...\n");
    
    const addresses = {
        dungeonCore: "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6",  // 從前端 contracts.ts
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0", // 從前端 contracts.ts
        soulShardInClaude: "0x9FbEc5f0d73D86B1d1C72D97e8973E476cA0E7Be", // CLAUDE.md 記錄
        soulShardInEnv: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",   // .env 使用
    };
    
    try {
        // 檢查 DungeonCore 中的 SoulShard 地址
        const dungeonCore = await ethers.getContractAt("DungeonCore", addresses.dungeonCore);
        const soulShardInContract = await dungeonCore.soulShardTokenAddress();
        
        console.log("📋 SoulShard 地址比較:");
        console.log(`   CLAUDE.md 記錄: ${addresses.soulShardInClaude}`);
        console.log(`   .env 文件使用: ${addresses.soulShardInEnv}`);
        console.log(`   DungeonCore 中: ${soulShardInContract}`);
        console.log(`   前端使用的是: ${addresses.soulShardInEnv}`);
        
        console.log("\n📊 匹配情況:");
        console.log(`   DungeonCore 與 .env 匹配: ${soulShardInContract.toLowerCase() === addresses.soulShardInEnv.toLowerCase() ? '✅' : '❌'}`);
        console.log(`   DungeonCore 與 CLAUDE.md 匹配: ${soulShardInContract.toLowerCase() === addresses.soulShardInClaude.toLowerCase() ? '✅' : '❌'}`);
        
        // 檢查兩個地址是否都是有效的 ERC20 合約
        console.log("\n🔍 驗證代幣合約:");
        
        try {
            const token1 = await ethers.getContractAt("IERC20", addresses.soulShardInEnv);
            const name1 = await token1.name();
            const symbol1 = await token1.symbol();
            console.log(`   ${addresses.soulShardInEnv}: ${name1} (${symbol1}) ✅`);
        } catch (e) {
            console.log(`   ${addresses.soulShardInEnv}: ❌ 不是有效的 ERC20`);
        }
        
        try {
            const token2 = await ethers.getContractAt("IERC20", addresses.soulShardInClaude);
            const name2 = await token2.name();
            const symbol2 = await token2.symbol();
            console.log(`   ${addresses.soulShardInClaude}: ${name2} (${symbol2}) ✅`);
        } catch (e) {
            console.log(`   ${addresses.soulShardInClaude}: ❌ 不是有效的 ERC20`);
        }
        
        // 檢查授權情況（使用測試地址）
        const testUser = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
        console.log(`\n💰 檢查用戶 ${testUser} 的授權:`);
        
        try {
            const token = await ethers.getContractAt("IERC20", soulShardInContract);
            const allowance = await token.allowance(testUser, addresses.dungeonMaster);
            const balance = await token.balanceOf(testUser);
            
            console.log(`   餘額: ${ethers.formatEther(balance)} $SOUL`);
            console.log(`   授權給 DungeonMaster: ${ethers.formatEther(allowance)} $SOUL`);
        } catch (e) {
            console.log(`   無法檢查授權狀態`);
        }
        
        console.log("\n🎯 結論:");
        if (soulShardInContract.toLowerCase() === addresses.soulShardInEnv.toLowerCase()) {
            console.log("✅ DungeonCore 使用的是 .env 中的地址（正確）");
            console.log("⚠️  但 CLAUDE.md 中記錄了不同的地址，需要更新文檔");
        } else {
            console.log("❌ SoulShard 地址不一致！這會導致儲備購買失敗");
            console.log("🔧 解決方案：確認哪個是正確的 SoulShard 地址");
        }
        
    } catch (error) {
        console.error("驗證過程中發生錯誤:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });