// scripts/active/diagnose-vault-balance.js
// 診斷 PlayerVault 餘額讀取問題

const hre = require("hardhat");

async function main() {
    console.log("🔍 Diagnosing PlayerVault Balance Issues...\n");

    // V25 合約地址
    const PLAYERVAULT_ADDRESS = "0x663b5F27f406A84C4Fe70041638Ed0fCD732a658";
    const SOULSHARD_ADDRESS = "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF";
    const DUNGEONCORE_ADDRESS = "0xA1c1e58fB2077b5Db861902B4A15F50b54F3f7e4";
    const ORACLE_ADDRESS = "0xd5A7E1F84D4E3032b9217f8Bf60f532088999158";

    // 獲取簽名者
    const [deployer] = await ethers.getSigners();
    console.log("🔑 Using account:", deployer.address);

    try {
        // 1. 檢查 PlayerVault 合約基本狀態
        console.log("1️⃣ Checking PlayerVault basic configuration...");
        const PlayerVault = await ethers.getContractFactory("PlayerVault");
        const playerVault = PlayerVault.attach(PLAYERVAULT_ADDRESS);

        // 檢查初始化狀態
        const { isReady, tokenAddress, coreAddress } = await playerVault.isInitialized();
        console.log("   - isReady:", isReady);
        console.log("   - tokenAddress:", tokenAddress);
        console.log("   - coreAddress:", coreAddress);

        if (!isReady) {
            console.log("❌ PlayerVault is not properly initialized!");
            
            if (tokenAddress === "0x0000000000000000000000000000000000000000") {
                console.log("   - SoulShardToken not set");
            }
            if (coreAddress === "0x0000000000000000000000000000000000000000") {
                console.log("   - DungeonCore not set");
            }
        }

        // 2. 檢查合約餘額
        console.log("\n2️⃣ Checking contract token balance...");
        const ERC20_ABI = [
            "function balanceOf(address account) external view returns (uint256)",
            "function name() external view returns (string memory)",
            "function symbol() external view returns (string memory)",
            "function decimals() external view returns (uint8)"
        ];
        const soulShard = new ethers.Contract(SOULSHARD_ADDRESS, ERC20_ABI, deployer);

        const contractBalance = await soulShard.balanceOf(PLAYERVAULT_ADDRESS);
        console.log("   - PlayerVault contract balance:", ethers.formatEther(contractBalance), "SOUL");

        // 3. 檢查玩家餘額（使用 deployer 作為測試地址）
        console.log("\n3️⃣ Checking player withdrawable balance...");
        const playerInfo = await playerVault.playerInfo(deployer.address);
        console.log("   - Withdrawable balance:", ethers.formatEther(playerInfo.withdrawableBalance), "SOUL");
        console.log("   - Last withdraw timestamp:", new Date(Number(playerInfo.lastWithdrawTimestamp) * 1000).toISOString());
        console.log("   - Last free withdraw timestamp:", new Date(Number(playerInfo.lastFreeWithdrawTimestamp) * 1000).toISOString());

        // 4. 檢查 Oracle 是否正常工作
        console.log("\n4️⃣ Checking Oracle price functionality...");
        const DUNGEONCORE_ABI = [
            "function getUSDValueForSoulShard(uint256 soulShardAmount) external view returns (uint256)",
            "function getSoulShardValueForUSD(uint256 usdAmount) external view returns (uint256)",
            "function vipStakingAddress() external view returns (address)",
            "function dungeonMasterAddress() external view returns (address)"
        ];
        const dungeonCore = new ethers.Contract(DUNGEONCORE_ADDRESS, DUNGEONCORE_ABI, deployer);
        
        try {
            const testAmount = ethers.parseEther("100"); // 100 SOUL
            const usdValue = await dungeonCore.getUSDValueForSoulShard(testAmount);
            console.log("   - 100 SOUL = $", ethers.formatEther(usdValue), "USD");
            
            const soulValue = await dungeonCore.getSoulShardValueForUSD(ethers.parseEther("100")); // $100
            console.log("   - $100 USD =", ethers.formatEther(soulValue), "SOUL");
        } catch (error) {
            console.log("❌ Oracle price check failed:", error.message);
        }

        // 5. 檢查 VIP 等級（如果有）
        console.log("\n5️⃣ Checking VIP status...");
        try {
            const vipAddress = await dungeonCore.vipStakingAddress();
            console.log("   - VIP Staking address:", vipAddress);
            
            if (vipAddress !== "0x0000000000000000000000000000000000000000") {
                const VIP_ABI = [
                    "function getVipLevel(address account) external view returns (uint256)"
                ];
                const vipStaking = new ethers.Contract(vipAddress, VIP_ABI, deployer);
                
                const vipLevel = await vipStaking.getVipLevel(deployer.address);
                console.log("   - Your VIP level:", vipLevel.toString());

                // 計算提款稅率
                const taxRate = await playerVault.callStatic._calculateTaxRate(
                    deployer.address, 
                    ethers.parseEther("100") // $100 USD
                );
                console.log("   - Current tax rate for $100 withdrawal:", (Number(taxRate) / 100).toString() + "%");
            }
        } catch (error) {
            console.log("⚠️  VIP check failed:", error.message);
        }

        // 6. 檢查子圖相關的 events
        console.log("\n6️⃣ Checking recent events...");
        try {
            const latestBlock = await hre.ethers.provider.getBlockNumber();
            const fromBlock = Math.max(0, latestBlock - 1000); // 最近 1000 個區塊

            const depositEvents = await playerVault.queryFilter(
                playerVault.filters.Deposited(deployer.address),
                fromBlock,
                latestBlock
            );
            console.log("   - Recent deposits:", depositEvents.length);

            const withdrawEvents = await playerVault.queryFilter(
                playerVault.filters.Withdrawn(deployer.address),
                fromBlock,
                latestBlock
            );
            console.log("   - Recent withdrawals:", withdrawEvents.length);

            if (depositEvents.length > 0) {
                const lastDeposit = depositEvents[depositEvents.length - 1];
                console.log("   - Last deposit amount:", ethers.formatEther(lastDeposit.args.amount), "SOUL");
                console.log("   - Last deposit block:", lastDeposit.blockNumber);
            }

        } catch (error) {
            console.log("⚠️  Event query failed:", error.message);
        }

        // 7. 測試權限
        console.log("\n7️⃣ Testing contract permissions...");
        try {
            const owner = await playerVault.owner();
            console.log("   - PlayerVault owner:", owner);
            console.log("   - Is deployer owner?", owner.toLowerCase() === deployer.address.toLowerCase());

            const dungeonMasterAddress = await dungeonCore.dungeonMasterAddress();
            console.log("   - DungeonMaster address:", dungeonMasterAddress);
        } catch (error) {
            console.log("⚠️  Permission check failed:", error.message);
        }

        console.log("\n✅ Diagnosis completed!");

    } catch (error) {
        console.error("\n❌ Diagnosis failed:", error.message);
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