import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
    console.log("測試遠征請求...\n");

    // 讀取 contract-config.json
    const configPath = path.join(__dirname, "../contract-config.json");
    const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
    
    // 獲取合約地址
    const dungeonMasterAddress = config.contracts.game.dungeonMaster.address;
    const partyAddress = config.contracts.nft.party.address;
    
    console.log(`DungeonMaster 地址: ${dungeonMasterAddress}`);
    console.log(`Party 合約地址: ${partyAddress}`);

    // 連接到合約
    const DungeonMaster = await ethers.getContractFactory("DungeonMasterV2");
    const dungeonMaster = DungeonMaster.attach(dungeonMasterAddress);
    
    const Party = await ethers.getContractFactory("Party");
    const party = Party.attach(partyAddress);

    // 獲取測試帳戶
    const [signer] = await ethers.getSigners();
    console.log(`\n測試帳戶: ${signer.address}`);

    // 查找用戶的隊伍
    console.log("\n查找用戶的隊伍...");
    let userParties = [];
    
    try {
        const balance = await party.balanceOf(signer.address);
        console.log(`用戶擁有的隊伍數量: ${balance}`);
        
        for (let i = 0; i < balance; i++) {
            const partyId = await party.tokenOfOwnerByIndex(signer.address, i);
            userParties.push(partyId);
            console.log(`  - 隊伍 #${partyId}`);
        }
    } catch (error) {
        console.log("獲取隊伍時出錯:", error.message);
    }

    // 測試不同的地下城ID
    const testCases = [
        { dungeonId: 1, description: "正常的地下城ID" },
        { dungeonId: 10, description: "最高的地下城ID" },
        { dungeonId: 11, description: "超出範圍的地下城ID" },
        { dungeonId: 1002, description: "錯誤信息中的ID" }
    ];

    // 獲取探索費用
    const explorationFee = await dungeonMaster.explorationFee();
    console.log(`\n探索費用: ${ethers.formatEther(explorationFee)} BNB`);

    for (const testCase of testCases) {
        console.log(`\n測試案例: ${testCase.description} (地下城 #${testCase.dungeonId})`);
        console.log("=".repeat(60));
        
        if (userParties.length === 0) {
            console.log("用戶沒有隊伍，跳過遠征測試");
            continue;
        }

        const partyId = userParties[0]; // 使用第一個隊伍
        
        try {
            // 檢查地下城是否存在
            const DungeonStorage = await ethers.getContractFactory("DungeonStorage");
            const dungeonStorage = DungeonStorage.attach(await dungeonMaster.dungeonStorage());
            
            const dungeon = await dungeonStorage.getDungeon(testCase.dungeonId);
            console.log(`地下城是否初始化: ${dungeon.isInitialized}`);
            console.log(`所需戰力: ${dungeon.requiredPower}`);
            
            // 檢查隊伍戰力
            const partyComposition = await party.partyCompositions(partyId);
            console.log(`隊伍戰力: ${partyComposition.maxPower}`);
            
            // 嘗試模擬交易
            console.log("\n模擬 requestExpedition 交易...");
            try {
                await dungeonMaster.requestExpedition.staticCall(
                    partyId, 
                    testCase.dungeonId,
                    { value: explorationFee }
                );
                console.log("✅ 交易模擬成功！");
            } catch (simError) {
                console.log("❌ 交易模擬失敗:", simError.message);
            }
            
        } catch (error) {
            console.log("❌ 錯誤:", error.message);
        }
    }

    // 檢查前端可能的問題
    console.log("\n\n前端集成檢查清單:");
    console.log("=".repeat(60));
    console.log("1. 確認前端使用的合約地址是否為最新的 v3 地址");
    console.log("2. 確認子圖是否已更新到 v3.0.0 並同步完成");
    console.log("3. 確認前端傳遞的地下城ID是否在 1-10 範圍內");
    console.log("4. 確認用戶是否擁有隊伍");
    console.log("5. 確認用戶的隊伍戰力是否滿足地下城要求");
    console.log("6. 確認交易包含足夠的 BNB 作為探索費用");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });