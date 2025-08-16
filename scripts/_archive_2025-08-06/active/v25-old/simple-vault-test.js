// scripts/active/simple-vault-test.js
// 簡單測試 PlayerVault 的存款功能

const hre = require("hardhat");

async function main() {
    console.log("🧪 Simple PlayerVault Test...\n");

    // V25 合約地址
    const DUNGEONMASTER_ADDRESS = "0x2E2F5569192526B4b4B51D51BcB6d9290492078d";
    const PLAYERVAULT_ADDRESS = "0x663b5F27f406A84C4Fe70041638Ed0fCD732a658";
    const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";

    // 獲取簽名者
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);

    try {
        // 1. 檢查當前餘額
        console.log("1️⃣ Checking current balances...");
        
        const PlayerVault = await ethers.getContractFactory("PlayerVault");
        const playerVault = PlayerVault.attach(PLAYERVAULT_ADDRESS);
        
        const playerInfo = await playerVault.playerInfo(deployer.address);
        console.log("   - Current vault balance:", ethers.formatEther(playerInfo.withdrawableBalance), "SOUL");

        const ERC20_ABI = [
            "function balanceOf(address account) external view returns (uint256)"
        ];
        const soulShard = new ethers.Contract(SOULSHARD_ADDRESS, ERC20_ABI, deployer);
        
        const dungeonMasterBalance = await soulShard.balanceOf(DUNGEONMASTER_ADDRESS);
        console.log("   - DungeonMaster balance:", ethers.formatEther(dungeonMasterBalance), "SOUL");

        // 2. 模擬 DungeonMaster 向用戶存款
        console.log("\n2️⃣ Testing deposit function...");
        
        // 檢查我們是否可以以 owner 身份操作
        const owner = await playerVault.owner();
        console.log("   - PlayerVault owner:", owner);
        console.log("   - Is deployer owner?", owner.toLowerCase() === deployer.address.toLowerCase());
        
        if (owner.toLowerCase() === deployer.address.toLowerCase()) {
            // 我們是 owner，可以設置 DungeonCore 為特殊權限
            console.log("   - We are the owner, can test deposit");
            
            // 首先確保 PlayerVault 合約有一些 SOUL 代幣用於測試
            const vaultBalance = await soulShard.balanceOf(PLAYERVAULT_ADDRESS);
            console.log("   - PlayerVault contract balance:", ethers.formatEther(vaultBalance), "SOUL");
            
            // 測試手動存款 1 SOUL
            const testAmount = ethers.parseEther("1");
            
            try {
                console.log("   - Attempting to deposit 1 SOUL manually...");
                
                // 我們需要模擬 DungeonMaster 的調用
                // 由於我們是 owner，可以暫時給自己權限進行測試
                const depositTx = await playerVault.deposit(deployer.address, testAmount);
                await depositTx.wait();
                
                console.log("   ✅ Manual deposit successful!");
                
                // 檢查餘額變化
                const newPlayerInfo = await playerVault.playerInfo(deployer.address);
                console.log("   - New vault balance:", ethers.formatEther(newPlayerInfo.withdrawableBalance), "SOUL");
                
            } catch (error) {
                console.log("   ❌ Manual deposit failed:", error.message);
                
                // 如果直接存款失敗，嘗試另一種方法
                if (error.message.includes("onlyDungeonMaster")) {
                    console.log("   - Only DungeonMaster can call deposit function");
                    console.log("   - This is correct behavior for security");
                }
            }
        }

        // 3. 檢查提款功能
        if (playerInfo.withdrawableBalance > 0n) {
            console.log("\n3️⃣ Testing withdrawal function...");
            
            const withdrawAmount = ethers.parseEther("0.1"); // 嘗試提取 0.1 SOUL
            
            if (playerInfo.withdrawableBalance >= withdrawAmount) {
                try {
                    console.log("   - Attempting to withdraw 0.1 SOUL...");
                    
                    const withdrawTx = await playerVault.withdraw(withdrawAmount);
                    await withdrawTx.wait();
                    
                    console.log("   ✅ Withdrawal successful!");
                    
                    // 檢查餘額變化
                    const newPlayerInfo = await playerVault.playerInfo(deployer.address);
                    console.log("   - Balance after withdrawal:", ethers.formatEther(newPlayerInfo.withdrawableBalance), "SOUL");
                    
                } catch (error) {
                    console.log("   ❌ Withdrawal failed:", error.message);
                }
            } else {
                console.log("   - Insufficient balance for withdrawal test");
            }
        } else {
            console.log("\n3️⃣ Skipping withdrawal test - no balance to withdraw");
        }

        // 4. 檢查稅率計算
        console.log("\n4️⃣ Checking tax calculation...");
        try {
            // 檢查 VIP 等級對稅率的影響
            const testUSDAmount = ethers.parseEther("100"); // $100 USD
            
            // 我們不能直接調用 _calculateTaxRate，但可以檢查相關參數
            const standardRate = await playerVault.standardInitialRate();
            const decreaseRate = await playerVault.decreaseRatePerPeriod();
            const periodDuration = await playerVault.periodDuration();
            
            console.log("   - Standard tax rate:", (Number(standardRate) / 100).toString() + "%");
            console.log("   - Decrease per period:", (Number(decreaseRate) / 100).toString() + "%");
            console.log("   - Period duration:", Number(periodDuration), "seconds");
            
        } catch (error) {
            console.log("   ⚠️  Could not check tax parameters:", error.message);
        }

        // 5. 總結狀態
        console.log("\n📊 CURRENT STATE SUMMARY:");
        console.log(`   - Player vault balance: ${ethers.formatEther(playerInfo.withdrawableBalance)} SOUL`);
        console.log(`   - DungeonMaster balance: ${ethers.formatEther(dungeonMasterBalance)} SOUL`);
        console.log(`   - PlayerVault contract: ${PLAYERVAULT_ADDRESS}`);
        
        if (playerInfo.withdrawableBalance === 0n) {
            console.log("\n🔍 ROOT CAUSE ANALYSIS:");
            console.log("   - User vault balance is 0 SOUL");
            console.log("   - DungeonMaster has been funded with 100,000 SOUL");
            console.log("   - Need to test actual expedition to generate rewards");
            console.log("   - Or manually trigger deposit from DungeonMaster");
        }

        console.log("\n✅ Simple test completed!");

    } catch (error) {
        console.error("\n❌ Test failed:", error.message);
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