// scripts/active/fund-dungeonmaster.js
// 為 DungeonMaster 提供 SOUL 代幣以分發獎勵

const hre = require("hardhat");

async function main() {
    console.log("💰 Funding DungeonMaster with SOUL tokens...\n");

    // V25 合約地址
    const DUNGEONMASTER_ADDRESS = "0x2E2F5569192526B4b4B51D51BcB6d9290492078d";
    const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
    
    // 要轉移的金額（建議先轉移 100,000 SOUL 作為獎勵池）
    const FUNDING_AMOUNT = ethers.parseEther("100000"); // 100,000 SOUL

    // 獲取簽名者
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);

    try {
        // 1. 檢查當前狀態
        console.log("1️⃣ Checking current balances...");
        
        const ERC20_ABI = [
            "function balanceOf(address account) external view returns (uint256)",
            "function transfer(address to, uint256 amount) external returns (bool)",
            "function name() external view returns (string memory)",
            "function symbol() external view returns (string memory)"
        ];
        const soulShard = new ethers.Contract(SOULSHARD_ADDRESS, ERC20_ABI, deployer);
        
        const tokenName = await soulShard.name();
        const tokenSymbol = await soulShard.symbol();
        console.log(`   - Token: ${tokenName} (${tokenSymbol})`);
        
        const deployerBalance = await soulShard.balanceOf(deployer.address);
        const dungeonMasterBalance = await soulShard.balanceOf(DUNGEONMASTER_ADDRESS);
        
        console.log("   - Deployer balance:", ethers.formatEther(deployerBalance), "SOUL");
        console.log("   - DungeonMaster balance:", ethers.formatEther(dungeonMasterBalance), "SOUL");
        
        if (deployerBalance < FUNDING_AMOUNT) {
            console.log("❌ Insufficient SOUL tokens in deployer account");
            console.log("   - Required:", ethers.formatEther(FUNDING_AMOUNT), "SOUL");
            console.log("   - Available:", ethers.formatEther(deployerBalance), "SOUL");
            console.log("   - Deficit:", ethers.formatEther(FUNDING_AMOUNT - deployerBalance), "SOUL");
            return;
        }

        // 2. 執行轉移
        console.log(`\n2️⃣ Transferring ${ethers.formatEther(FUNDING_AMOUNT)} SOUL to DungeonMaster...`);
        
        const transferTx = await soulShard.transfer(DUNGEONMASTER_ADDRESS, FUNDING_AMOUNT, {
            gasLimit: 100000 // 設定 gas limit
        });
        
        console.log("   - Transaction hash:", transferTx.hash);
        console.log("   - Waiting for confirmation...");
        
        const receipt = await transferTx.wait(2); // 等待 2 個區塊確認
        console.log("   ✅ Transfer confirmed in block:", receipt.blockNumber);

        // 3. 驗證轉移結果
        console.log("\n3️⃣ Verifying transfer result...");
        
        const newDeployerBalance = await soulShard.balanceOf(deployer.address);
        const newDungeonMasterBalance = await soulShard.balanceOf(DUNGEONMASTER_ADDRESS);
        
        console.log("   - Deployer new balance:", ethers.formatEther(newDeployerBalance), "SOUL");
        console.log("   - DungeonMaster new balance:", ethers.formatEther(newDungeonMasterBalance), "SOUL");
        
        const expectedDeployerBalance = deployerBalance - FUNDING_AMOUNT;
        const expectedDungeonMasterBalance = dungeonMasterBalance + FUNDING_AMOUNT;
        
        if (newDeployerBalance === expectedDeployerBalance && 
            newDungeonMasterBalance === expectedDungeonMasterBalance) {
            console.log("   ✅ Transfer successful!");
        } else {
            console.log("   ❌ Transfer amounts don't match expected values");
        }

        // 4. 測試獎勵分發功能
        console.log("\n4️⃣ Testing reward distribution capability...");
        
        // 估算每次探險的獎勵（假設平均 20 USD，SOUL 價格約 0.006 USD）
        const estimatedRewardPerExpedition = ethers.parseEther("3333"); // ~20 USD worth of SOUL
        const possibleExpeditions = newDungeonMasterBalance / estimatedRewardPerExpedition;
        
        console.log("   - Estimated reward per expedition:", ethers.formatEther(estimatedRewardPerExpedition), "SOUL (~$20)");
        console.log("   - Possible expeditions with current funds:", possibleExpeditions.toString());
        
        if (possibleExpeditions > 100n) {
            console.log("   ✅ DungeonMaster is well-funded for rewards");
        } else if (possibleExpeditions > 10n) {
            console.log("   ⚠️  DungeonMaster has moderate funding");
        } else {
            console.log("   ❌ DungeonMaster funding may be insufficient");
        }

        // 5. 總結和後續步驟
        console.log("\n📊 FUNDING SUMMARY:");
        console.log(`   ✅ Successfully transferred ${ethers.formatEther(FUNDING_AMOUNT)} SOUL to DungeonMaster`);
        console.log(`   ✅ DungeonMaster now has ${ethers.formatEther(newDungeonMasterBalance)} SOUL for rewards`);
        
        console.log("\n🎯 NEXT STEPS:");
        console.log("   1. Test expedition functionality to verify rewards are distributed");
        console.log("   2. Check that PlayerVault balances update correctly");
        console.log("   3. Verify frontend displays updated balances");
        console.log("   4. Monitor DungeonMaster balance and refund as needed");
        
        console.log("\n💡 MONITORING:");
        console.log("   - Set up alerts when DungeonMaster balance drops below 10,000 SOUL");
        console.log("   - Regular funding ensures continuous gameplay rewards");

        console.log("\n✅ Funding completed successfully!");

    } catch (error) {
        console.error("\n❌ Funding failed:", error.message);
        if (error.reason) {
            console.error("Reason:", error.reason);
        }
        if (error.code) {
            console.error("Error code:", error.code);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });