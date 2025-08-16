// scripts/active/test-vault-deposit.js
// 測試 PlayerVault 的存款功能

const hre = require("hardhat");

async function main() {
    console.log("🧪 Testing PlayerVault Deposit Functionality...\n");

    // V25 合約地址
    const PLAYERVAULT_ADDRESS = "0x663b5F27f406A84C4Fe70041638Ed0fCD732a658";
    const DUNGEONMASTER_ADDRESS = "0x2E2F5569192526B4b4B51D51BcB6d9290492078d";
    const DUNGEONCORE_ADDRESS = "0xA1c1e58fB2077b5Db861902B4A15F50b54F3f7e4";
    const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";

    // 獲取簽名者
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);

    try {
        // 1. 檢查 DungeonMaster 和 PlayerVault 的連接
        console.log("1️⃣ Checking DungeonMaster -> PlayerVault connection...");
        
        const DUNGEONCORE_ABI = [
            "function dungeonMasterAddress() external view returns (address)",
            "function playerVaultAddress() external view returns (address)"
        ];
        const dungeonCore = new ethers.Contract(DUNGEONCORE_ADDRESS, DUNGEONCORE_ABI, deployer);
        
        const registeredDungeonMaster = await dungeonCore.dungeonMasterAddress();
        const registeredPlayerVault = await dungeonCore.playerVaultAddress();
        
        console.log("   - Registered DungeonMaster:", registeredDungeonMaster);
        console.log("   - Expected DungeonMaster:", DUNGEONMASTER_ADDRESS);
        console.log("   - DungeonMaster match:", registeredDungeonMaster.toLowerCase() === DUNGEONMASTER_ADDRESS.toLowerCase());
        
        console.log("   - Registered PlayerVault:", registeredPlayerVault);
        console.log("   - Expected PlayerVault:", PLAYERVAULT_ADDRESS);
        console.log("   - PlayerVault match:", registeredPlayerVault.toLowerCase() === PLAYERVAULT_ADDRESS.toLowerCase());

        // 2. 檢查 DungeonMaster 的 SoulShard token 餘額
        console.log("\n2️⃣ Checking DungeonMaster token balance...");
        const ERC20_ABI = [
            "function balanceOf(address account) external view returns (uint256)",
            "function allowance(address owner, address spender) external view returns (uint256)",
            "function approve(address spender, uint256 amount) external returns (bool)",
            "function transfer(address to, uint256 amount) external returns (bool)"
        ];
        const soulShard = new ethers.Contract(SOULSHARD_ADDRESS, ERC20_ABI, deployer);
        
        const dungeonMasterBalance = await soulShard.balanceOf(DUNGEONMASTER_ADDRESS);
        console.log("   - DungeonMaster SOUL balance:", ethers.formatEther(dungeonMasterBalance), "SOUL");
        
        if (dungeonMasterBalance === 0n) {
            console.log("❌ DungeonMaster has no SOUL tokens to distribute!");
        }

        // 3. 測試手動存款到 PlayerVault（如果我們是 owner）
        console.log("\n3️⃣ Testing manual deposit...");
        const PlayerVault = await ethers.getContractFactory("PlayerVault");
        const playerVault = PlayerVault.attach(PLAYERVAULT_ADDRESS);
        
        const owner = await playerVault.owner();
        console.log("   - PlayerVault owner:", owner);
        console.log("   - Is deployer owner?", owner.toLowerCase() === deployer.address.toLowerCase());
        
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            // 檢查我們是否有 SOUL tokens
            const deployerBalance = await soulShard.balanceOf(deployer.address);
            console.log("   - Deployer SOUL balance:", ethers.formatEther(deployerBalance), "SOUL");
            
            if (deployerBalance > 0n) {
                const testAmount = ethers.parseEther("1"); // 1 SOUL for testing
                
                // 先檢查 allowance
                const allowance = await soulShard.allowance(deployer.address, PLAYERVAULT_ADDRESS);
                console.log("   - Current allowance:", ethers.formatEther(allowance), "SOUL");
                
                if (allowance < testAmount) {
                    console.log("   - Approving PlayerVault to spend SOUL...");
                    const approveTx = await soulShard.approve(PLAYERVAULT_ADDRESS, testAmount);
                    await approveTx.wait();
                    console.log("   ✅ Approval successful");
                }
                
                // 檢查用戶餘額前
                const beforeBalance = await playerVault.playerInfo(deployer.address);
                console.log("   - Balance before deposit:", ethers.formatEther(beforeBalance.withdrawableBalance), "SOUL");
                
                // 嘗試直接調用 deposit（模擬 DungeonMaster 的行為）
                try {
                    console.log("   - Attempting manual deposit of 1 SOUL...");
                    
                    // 首先轉移代幣到合約
                    const transferTx = await soulShard.transfer(PLAYERVAULT_ADDRESS, testAmount);
                    await transferTx.wait();
                    console.log("   ✅ Transferred 1 SOUL to PlayerVault");
                    
                    // 然後調用 deposit 函數（需要是 DungeonMaster 調用）
                    // 由於我們不是 DungeonMaster，這裡會失敗，但我們可以看到錯誤
                    // const depositTx = await playerVault.deposit(deployer.address, testAmount);
                    // await depositTx.wait();
                    
                    console.log("   ⚠️  Cannot call deposit directly - only DungeonMaster can call this");
                    
                } catch (error) {
                    console.log("   ❌ Manual deposit failed:", error.message);
                }
            } else {
                console.log("   ❌ Deployer has no SOUL tokens to test with");
            }
        }

        // 4. 檢查最近的遊戲事件（從 DungeonMaster）
        console.log("\n4️⃣ Checking if rewards are being generated...");
        
        try {
            // 檢查最新的探險事件
            const DUNGEONMASTER_ABI = [
                "event ExpeditionResult(address indexed player, uint256 indexed dungeonId, bool success, uint256 rewardAmount, uint256 experience)",
                "function getPlayerProfile(address player) view returns (uint256 level, uint256 experience, uint256 totalExpeditions, uint256 successfulExpeditions)"
            ];
            const dungeonMaster = new ethers.Contract(DUNGEONMASTER_ADDRESS, DUNGEONMASTER_ABI, deployer);
            
            // 獲取用戶檔案
            const playerProfile = await dungeonMaster.getPlayerProfile(deployer.address);
            console.log("   - Player level:", playerProfile.level.toString());
            console.log("   - Player experience:", playerProfile.experience.toString());
            console.log("   - Total expeditions:", playerProfile.totalExpeditions.toString());
            console.log("   - Successful expeditions:", playerProfile.successfulExpeditions.toString());
            
            if (playerProfile.totalExpeditions === 0n) {
                console.log("❌ Player has never done any expeditions - no rewards to deposit!");
            }
            
        } catch (error) {
            console.log("   ⚠️  Could not check DungeonMaster profile:", error.message);
        }

        // 5. 建議和結論
        console.log("\n📊 DIAGNOSIS SUMMARY:");
        
        if (dungeonMasterBalance === 0n) {
            console.log("🔴 CRITICAL ISSUE: DungeonMaster has no SOUL tokens to distribute as rewards!");
            console.log("   - This explains why PlayerVault balances are 0");
            console.log("   - Need to fund DungeonMaster with SOUL tokens");
        }
        
        console.log("\n💡 RECOMMENDATIONS:");
        console.log("   1. Fund DungeonMaster with SOUL tokens for rewards");
        console.log("   2. Test expedition functionality to see if rewards flow correctly");
        console.log("   3. Check if subgraph is properly indexing deposit events");
        console.log("   4. Verify frontend is reading from correct PlayerVault address");

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