// scripts/active/check-user-vault-balance.js
// 檢查特定用戶的金庫餘額

const hre = require("hardhat");

async function main() {
    console.log("🔍 Checking User Vault Balance...\n");

    // V25 合約地址
    const PLAYERVAULT_ADDRESS = "0x663b5F27f406A84C4Fe70041638Ed0fCD732a658";
    const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
    const DUNGEONCORE_ADDRESS = "0xA1c1e58fB2077b5Db861902B4A15F50b54F3f7e4";

    // 測试用戶地址（如果你有特定用戶地址，請在這裡添加）
    const TEST_USER_ADDRESS = "0xEbCF4A36Ad1485A9737025e9d72186b604487274"; // 替換為實際用戶地址

    // 獲取簽名者
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);
    console.log("👤 Checking user:", TEST_USER_ADDRESS);

    try {
        // 獲取 PlayerVault 合約實例
        const PlayerVault = await ethers.getContractFactory("PlayerVault");
        const playerVault = PlayerVault.attach(PLAYERVAULT_ADDRESS);

        // 1. 檢查用戶餘額
        console.log("\n1️⃣ Checking user vault balance...");
        const playerInfo = await playerVault.playerInfo(TEST_USER_ADDRESS);
        console.log("   - Withdrawable balance:", ethers.formatEther(playerInfo.withdrawableBalance), "SOUL");
        
        if (playerInfo.withdrawableBalance > 0) {
            console.log("✅ User has balance in vault");
        } else {
            console.log("❌ User balance is 0 - this might be the issue!");
        }

        // 2. 檢查最近的存款事件
        console.log("\n2️⃣ Checking recent deposit events for user...");
        try {
            const latestBlock = await hre.ethers.provider.getBlockNumber();
            const fromBlock = Math.max(55808316, latestBlock - 10000); // 從部署區塊或最近10k區塊開始

            console.log(`   - Searching from block ${fromBlock} to ${latestBlock}`);

            const depositEvents = await playerVault.queryFilter(
                playerVault.filters.Deposited(TEST_USER_ADDRESS),
                fromBlock,
                latestBlock
            );

            console.log("   - Total deposit events found:", depositEvents.length);

            if (depositEvents.length > 0) {
                console.log("   - Recent deposits:");
                depositEvents.slice(-5).forEach((event, index) => {
                    console.log(`     ${index + 1}. Block ${event.blockNumber}: ${ethers.formatEther(event.args.amount)} SOUL`);
                });

                // 計算總存款
                const totalDeposits = depositEvents.reduce((total, event) => {
                    return total + event.args.amount;
                }, 0n);
                console.log("   - Total deposited:", ethers.formatEther(totalDeposits), "SOUL");
            } else {
                console.log("❌ No deposit events found for this user");
            }

        } catch (error) {
            console.log("⚠️  Could not query deposit events:", error.message);
        }

        // 3. 檢查最近的提款事件
        console.log("\n3️⃣ Checking recent withdrawal events for user...");
        try {
            const latestBlock = await hre.ethers.provider.getBlockNumber();
            const fromBlock = Math.max(55808316, latestBlock - 10000);

            const withdrawEvents = await playerVault.queryFilter(
                playerVault.filters.Withdrawn(TEST_USER_ADDRESS),
                fromBlock,
                latestBlock
            );

            console.log("   - Total withdrawal events found:", withdrawEvents.length);

            if (withdrawEvents.length > 0) {
                console.log("   - Recent withdrawals:");
                withdrawEvents.slice(-5).forEach((event, index) => {
                    console.log(`     ${index + 1}. Block ${event.blockNumber}: ${ethers.formatEther(event.args.amount)} SOUL (tax: ${ethers.formatEther(event.args.taxAmount)} SOUL)`);
                });

                // 計算總提款
                const totalWithdrawn = withdrawEvents.reduce((total, event) => {
                    return total + event.args.amount + event.args.taxAmount;
                }, 0n);
                console.log("   - Total withdrawn (including tax):", ethers.formatEther(totalWithdrawn), "SOUL");
            } else {
                console.log("✅ No withdrawal events found for this user");
            }

        } catch (error) {
            console.log("⚠️  Could not query withdrawal events:", error.message);
        }

        // 4. 檢查遊戲消費事件
        console.log("\n4️⃣ Checking game spending events for user...");
        try {
            const latestBlock = await hre.ethers.provider.getBlockNumber();
            const fromBlock = Math.max(55808316, latestBlock - 10000);

            const spendingEvents = await playerVault.queryFilter(
                playerVault.filters.GameSpending(TEST_USER_ADDRESS),
                fromBlock,
                latestBlock
            );

            console.log("   - Total spending events found:", spendingEvents.length);

            if (spendingEvents.length > 0) {
                console.log("   - Recent game spending:");
                spendingEvents.slice(-5).forEach((event, index) => {
                    console.log(`     ${index + 1}. Block ${event.blockNumber}: ${ethers.formatEther(event.args.amount)} SOUL to ${event.args.spender}`);
                });

                // 計算總消費
                const totalSpent = spendingEvents.reduce((total, event) => {
                    return total + event.args.amount;
                }, 0n);
                console.log("   - Total spent on games:", ethers.formatEther(totalSpent), "SOUL");
            } else {
                console.log("✅ No game spending events found for this user");
            }

        } catch (error) {
            console.log("⚠️  Could not query spending events:", error.message);
        }

        // 5. 檢查是否有推薦人設置
        console.log("\n5️⃣ Checking referral setup...");
        try {
            const referrer = await playerVault.referrers(TEST_USER_ADDRESS);
            if (referrer !== "0x0000000000000000000000000000000000000000") {
                console.log("   - Referrer:", referrer);
            } else {
                console.log("   - No referrer set");
            }

            // 檢查總佣金
            const totalCommission = await playerVault.getTotalCommissionPaid(TEST_USER_ADDRESS);
            console.log("   - Total commission earned:", ethers.formatEther(totalCommission), "SOUL");
        } catch (error) {
            console.log("⚠️  Could not check referral info:", error.message);
        }

        // 6. 總結和建議
        console.log("\n📊 SUMMARY AND RECOMMENDATIONS:");
        
        if (playerInfo.withdrawableBalance === 0n) {
            console.log("❌ ISSUE IDENTIFIED: User's withdrawable balance is 0");
            console.log("\n💡 Possible causes:");
            console.log("   1. User never made any deposits through the game");
            console.log("   2. All deposits were withdrawn or spent on games");
            console.log("   3. There's a problem with the deposit mechanism from DungeonMaster");
            console.log("   4. Events are not being emitted properly");
            
            console.log("\n🔧 Recommended actions:");
            console.log("   1. Check if DungeonMaster is properly depositing rewards");
            console.log("   2. Verify that game mechanics are working correctly");
            console.log("   3. Test a small deposit manually to see if it reflects");
            console.log("   4. Check subgraph indexing for missing events");
        } else {
            console.log("✅ User has balance in vault - frontend display issue likely");
        }

        console.log("\n✅ Analysis completed!");

    } catch (error) {
        console.error("\n❌ Analysis failed:", error.message);
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