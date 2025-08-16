// scripts/active/test-expedition-rewards.js
// 測試探險獎勵系統是否正常工作

const hre = require("hardhat");

async function main() {
    console.log("⚔️ Testing Expedition Reward System...\n");

    // V25 合約地址
    const DUNGEONMASTER_ADDRESS = "0x2E2F5569192526B4b4B51D51BcB6d9290492078d";
    const PLAYERVAULT_ADDRESS = "0x663b5F27f406A84C4Fe70041638Ed0fCD732a658";
    const HERO_ADDRESS = "0xF6A318568CFF7704c24C1Ab81B34de26Cd473d40";
    const PARTY_ADDRESS = "0xA4BA997d806FeAde847Cf82a070a694a9e51fAf2";
    const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";

    // 獲取簽名者
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);

    try {
        // 1. 檢查用戶是否有 Hero NFT
        console.log("1️⃣ Checking user's Hero NFTs...");
        
        const ERC721_ABI = [
            "function balanceOf(address owner) external view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
            "function tokenURI(uint256 tokenId) external view returns (string memory)"
        ];
        const hero = new ethers.Contract(HERO_ADDRESS, ERC721_ABI, deployer);
        
        const heroBalance = await hero.balanceOf(deployer.address);
        console.log("   - Hero NFTs owned:", heroBalance.toString());
        
        if (heroBalance === 0n) {
            console.log("❌ User has no Hero NFTs - cannot participate in expeditions");
            console.log("   - Need to mint a Hero NFT first");
            return;
        }
        
        // 獲取第一個 Hero NFT ID
        const heroTokenId = await hero.tokenOfOwnerByIndex(deployer.address, 0);
        console.log("   - Using Hero NFT ID:", heroTokenId.toString());

        // 2. 檢查是否有 Party
        console.log("\n2️⃣ Checking user's Party...");
        const party = new ethers.Contract(PARTY_ADDRESS, ERC721_ABI, deployer);
        
        const partyBalance = await party.balanceOf(deployer.address);
        console.log("   - Party NFTs owned:", partyBalance.toString());
        
        let partyTokenId = 0n;
        if (partyBalance > 0n) {
            partyTokenId = await party.tokenOfOwnerByIndex(deployer.address, 0);
            console.log("   - Using Party NFT ID:", partyTokenId.toString());
        } else {
            console.log("   - No Party NFT found - using 0 for solo expedition");
        }

        // 3. 檢查 PlayerVault 餘額（探險前）
        console.log("\n3️⃣ Checking PlayerVault balance before expedition...");
        const PlayerVault = await ethers.getContractFactory("PlayerVault");
        const playerVault = PlayerVault.attach(PLAYERVAULT_ADDRESS);
        
        const beforePlayerInfo = await playerVault.playerInfo(deployer.address);
        console.log("   - Balance before:", ethers.formatEther(beforePlayerInfo.withdrawableBalance), "SOUL");

        // 4. 嘗試執行探險
        console.log("\n4️⃣ Attempting expedition...");
        
        try {
            const DungeonMaster = await ethers.getContractFactory("contracts/current/core/DungeonMaster.sol:DungeonMasterV2_Fixed");
            const dungeonMaster = DungeonMaster.attach(DUNGEONMASTER_ADDRESS);
            
            // 探險參數
            const dungeonId = 1; // 新手礦洞
            console.log(`   - Targeting dungeon ID: ${dungeonId} (新手礦洞)`);
            console.log(`   - Hero ID: ${heroTokenId}`);
            console.log(`   - Party ID: ${partyTokenId}`);
            
            // 執行探險
            console.log("   - Sending expedition transaction...");
            const expeditionTx = await dungeonMaster.startExpedition(
                heroTokenId,
                partyTokenId,
                dungeonId,
                {
                    gasLimit: 500000 // 設定較高的 gas limit
                }
            );
            
            console.log("   - Transaction hash:", expeditionTx.hash);
            console.log("   - Waiting for confirmation...");
            
            const receipt = await expeditionTx.wait(2);
            console.log("   ✅ Expedition confirmed in block:", receipt.blockNumber);
            
            // 解析事件
            console.log("   - Parsing expedition events...");
            const expeditionEvents = receipt.logs.filter(log => {
                try {
                    const parsed = dungeonMaster.interface.parseLog(log);
                    return parsed.name === 'ExpeditionResult';
                } catch (e) {
                    return false;
                }
            });
            
            if (expeditionEvents.length > 0) {
                const event = dungeonMaster.interface.parseLog(expeditionEvents[0]);
                console.log("   - Expedition result:");
                console.log("     • Success:", event.args.success);
                console.log("     • Reward:", ethers.formatEther(event.args.rewardAmount), "SOUL");
                console.log("     • Experience:", event.args.experience.toString());
            }
            
        } catch (error) {
            console.log("   ❌ Expedition failed:", error.message);
            
            // 檢查常見問題
            if (error.message.includes("insufficient funds")) {
                console.log("   - Possible cause: Insufficient gas or token balance");
            } else if (error.message.includes("cooldown")) {
                console.log("   - Possible cause: Hero still in cooldown period");
            } else if (error.message.includes("not authorized")) {
                console.log("   - Possible cause: Hero not owned by sender");
            }
        }

        // 5. 檢查 PlayerVault 餘額（探險後）
        console.log("\n5️⃣ Checking PlayerVault balance after expedition...");
        
        const afterPlayerInfo = await playerVault.playerInfo(deployer.address);
        console.log("   - Balance after:", ethers.formatEther(afterPlayerInfo.withdrawableBalance), "SOUL");
        
        const balanceIncrease = afterPlayerInfo.withdrawableBalance - beforePlayerInfo.withdrawableBalance;
        if (balanceIncrease > 0n) {
            console.log("   ✅ Balance increased by:", ethers.formatEther(balanceIncrease), "SOUL");
        } else if (balanceIncrease < 0n) {
            console.log("   ⚠️  Balance decreased by:", ethers.formatEther(-balanceIncrease), "SOUL");
        } else {
            console.log("   - No balance change detected");
        }

        // 6. 檢查 DungeonMaster 餘額變化
        console.log("\n6️⃣ Checking DungeonMaster balance...");
        
        const ERC20_ABI = [
            "function balanceOf(address account) external view returns (uint256)"
        ];
        const soulShard = new ethers.Contract(SOULSHARD_ADDRESS, ERC20_ABI, deployer);
        
        const dungeonMasterBalance = await soulShard.balanceOf(DUNGEONMASTER_ADDRESS);
        console.log("   - DungeonMaster balance:", ethers.formatEther(dungeonMasterBalance), "SOUL");

        // 7. 總結
        console.log("\n📊 TEST SUMMARY:");
        
        if (balanceIncrease > 0n) {
            console.log("✅ REWARD SYSTEM WORKING:");
            console.log(`   - Successfully received ${ethers.formatEther(balanceIncrease)} SOUL reward`);
            console.log("   - PlayerVault is properly receiving deposits from DungeonMaster");
            console.log("   - Frontend should now display the updated balance");
        } else {
            console.log("❌ REWARD SYSTEM ISSUE:");
            console.log("   - No balance increase detected after expedition");
            console.log("   - Need to investigate expedition mechanics");
        }
        
        console.log("\n💡 RECOMMENDATIONS:");
        console.log("   1. If rewards are working: Check frontend balance display");
        console.log("   2. If no rewards: Check expedition requirements and cooldowns");
        console.log("   3. Monitor subgraph indexing of new events");
        console.log("   4. Test withdrawal functionality next");

        console.log("\n✅ Testing completed!");

    } catch (error) {
        console.error("\n❌ Testing failed:", error.message);
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });