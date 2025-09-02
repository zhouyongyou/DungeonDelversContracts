// fix-v25-1-connections.js - 修復 V25.1 更新後的合約連接
// 使用正確的函數名稱完成配置

const hre = require("hardhat");

async function main() {
    console.log("🔧 修復 V25.1 更新後的合約連接...\n");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("🔑 執行錢包:", deployer.address);
    console.log("💰 BNB 餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(deployer.address)), "BNB");
    
    // V25.1 合約地址（從剛才的部署結果）
    const CONTRACTS = {
        // 新部署的合約
        Hero: "0x60bdCE3d1412C1aA8F18a58801895Bb0C3D45357",
        Relic: "0xE80d9c0E6dA24f1C71C3A77E0565abc8bb139817",
        VRFManager: "0x0497108f4734BbC0381DF82e95A41e1425C53981",
        
        // 現有的合約（保持不變）
        DungeonCore: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
        Oracle: "0xEE322Eff70320759487f67875113C062AC1F4cfB",
        SoulShard: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
        USD: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
        Party: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
        DungeonMaster: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
        DungeonStorage: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
        AltarOfAscension: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
        PlayerVault: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
        PlayerProfile: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
        VIPStaking: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661"
    };
    
    console.log("📋 配置範圍:");
    console.log("🔗 DungeonCore -> 新 Hero, 新 Relic");
    console.log("🔗 新 Hero, 新 Relic -> DungeonCore");
    console.log("🔗 新 Hero, 新 Relic -> 新 VRF Manager");
    console.log("🔗 新 VRF Manager -> 授權所有客戶端");
    console.log("=" .repeat(60));
    
    const transactions = [];
    let txCount = 0;
    
    try {
        // ===========================================
        // 1. 更新 DungeonCore 中的 Hero 和 Relic 地址
        // ===========================================
        console.log("\n🏛️ 第1階段: 更新 DungeonCore 連接");
        console.log("-".repeat(40));
        
        const coreABI = [
            "function setHeroContract(address)",
            "function setRelicContract(address)",
            "function setVRFManager(address)"
        ];
        
        const coreContract = new hre.ethers.Contract(CONTRACTS.DungeonCore, coreABI, deployer);
        
        // 設定新的 Hero 地址
        console.log("🦸 設定 DungeonCore -> Hero...");
        try {
            const tx1 = await coreContract.setHeroContract(CONTRACTS.Hero, { gasLimit: 300000 });
            await tx1.wait();
            transactions.push({ name: "DungeonCore.setHeroContract", hash: tx1.hash });
            txCount++;
            console.log("✅ Hero 地址設定完成");
        } catch (error) {
            console.log("❌ Hero 地址設定失敗:", error.message);
        }
        
        // 設定新的 Relic 地址
        console.log("🏺 設定 DungeonCore -> Relic...");
        try {
            const tx2 = await coreContract.setRelicContract(CONTRACTS.Relic, { gasLimit: 300000 });
            await tx2.wait();
            transactions.push({ name: "DungeonCore.setRelicContract", hash: tx2.hash });
            txCount++;
            console.log("✅ Relic 地址設定完成");
        } catch (error) {
            console.log("❌ Relic 地址設定失敗:", error.message);
        }
        
        // 設定新的 VRF Manager 地址
        console.log("📡 設定 DungeonCore -> VRF Manager...");
        try {
            const tx3 = await coreContract.setVRFManager(CONTRACTS.VRFManager, { gasLimit: 300000 });
            await tx3.wait();
            transactions.push({ name: "DungeonCore.setVRFManager", hash: tx3.hash });
            txCount++;
            console.log("✅ VRF Manager 地址設定完成");
        } catch (error) {
            console.log("❌ VRF Manager 地址設定失敗:", error.message);
        }
        
        // ===========================================
        // 2. 設定新合約的 DungeonCore 引用
        // ===========================================
        console.log("\n🔄 第2階段: 設定新合約的 DungeonCore 引用");
        console.log("-".repeat(40));
        
        const nftABI = ["function setDungeonCore(address)"];
        
        // Hero -> DungeonCore
        console.log("🦸 設定 Hero -> DungeonCore...");
        try {
            const heroContract = new hre.ethers.Contract(CONTRACTS.Hero, nftABI, deployer);
            const tx = await heroContract.setDungeonCore(CONTRACTS.DungeonCore, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Hero.setDungeonCore", hash: tx.hash });
            txCount++;
            console.log("✅ Hero DungeonCore 引用設定完成");
        } catch (error) {
            console.log("❌ Hero DungeonCore 引用設定失敗:", error.message);
        }
        
        // Relic -> DungeonCore
        console.log("🏺 設定 Relic -> DungeonCore...");
        try {
            const relicContract = new hre.ethers.Contract(CONTRACTS.Relic, nftABI, deployer);
            const tx = await relicContract.setDungeonCore(CONTRACTS.DungeonCore, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Relic.setDungeonCore", hash: tx.hash });
            txCount++;
            console.log("✅ Relic DungeonCore 引用設定完成");
        } catch (error) {
            console.log("❌ Relic DungeonCore 引用設定失敗:", error.message);
        }
        
        // ===========================================
        // 3. 配置 VRF 授權
        // ===========================================
        console.log("\n📡 第3階段: 配置 VRF 授權");
        console.log("-".repeat(40));
        
        const vrfABI = ["function authorize(address) external"];
        
        try {
            const vrfContract = new hre.ethers.Contract(CONTRACTS.VRFManager, vrfABI, deployer);
            
            const clientsToAuthorize = [
                { name: "Hero", address: CONTRACTS.Hero },
                { name: "Relic", address: CONTRACTS.Relic },
                { name: "DungeonMaster", address: CONTRACTS.DungeonMaster },
                { name: "AltarOfAscension", address: CONTRACTS.AltarOfAscension }
            ];
            
            for (const client of clientsToAuthorize) {
                console.log(`🔑 授權 ${client.name}...`);
                try {
                    const tx = await vrfContract.authorize(client.address, { gasLimit: 300000 });
                    await tx.wait();
                    transactions.push({ name: `VRF.authorize(${client.name})`, hash: tx.hash });
                    txCount++;
                    console.log(`✅ ${client.name} VRF 授權完成`);
                } catch (error) {
                    console.log(`❌ ${client.name} VRF 授權失敗:`, error.message);
                }
            }
        } catch (error) {
            console.log("❌ VRF Manager 連接失敗:", error.message);
        }
        
        // ===========================================
        // 4. 設定 NFT 合約的 VRF Manager 引用
        // ===========================================
        console.log("\n🎨 第4階段: 設定 NFT 合約的 VRF Manager 引用");
        console.log("-".repeat(40));
        
        const vrfSetterABI = ["function setVRFManager(address)"];
        
        // Hero VRF Manager 設定
        console.log("🦸 設定 Hero -> VRF Manager...");
        try {
            const heroContract = new hre.ethers.Contract(CONTRACTS.Hero, vrfSetterABI, deployer);
            const tx = await heroContract.setVRFManager(CONTRACTS.VRFManager, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Hero.setVRFManager", hash: tx.hash });
            txCount++;
            console.log("✅ Hero VRF Manager 引用設定完成");
        } catch (error) {
            console.log("❌ Hero VRF Manager 引用設定失敗:", error.message);
        }
        
        // Relic VRF Manager 設定
        console.log("🏺 設定 Relic -> VRF Manager...");
        try {
            const relicContract = new hre.ethers.Contract(CONTRACTS.Relic, vrfSetterABI, deployer);
            const tx = await relicContract.setVRFManager(CONTRACTS.VRFManager, { gasLimit: 300000 });
            await tx.wait();
            transactions.push({ name: "Relic.setVRFManager", hash: tx.hash });
            txCount++;
            console.log("✅ Relic VRF Manager 引用設定完成");
        } catch (error) {
            console.log("❌ Relic VRF Manager 引用設定失敗:", error.message);
        }
        
        // ===========================================
        // 完成總結
        // ===========================================
        console.log("\n" + "=".repeat(60));
        console.log("🎉 V25.1 連接配置完成！");
        console.log("=".repeat(60));
        
        console.log(`\n📊 配置統計:`);
        console.log(`🔗 成功交易: ${txCount} 筆`);
        console.log(`⛽ 執行錢包: ${deployer.address}`);
        console.log(`📦 當前區塊: ${await hre.ethers.provider.getBlockNumber()}`);
        
        console.log(`\n📋 執行的交易:`);
        transactions.forEach((tx, index) => {
            console.log(`${index + 1}. ${tx.name}`);
            console.log(`   Hash: ${tx.hash}`);
            console.log(`   BSCScan: https://bscscan.com/tx/${tx.hash}`);
        });
        
        console.log(`\n🚀 後續步驟:`);
        console.log("1. 運行驗證腳本: node scripts/verify-deployment-connections.js .env.v25-1");
        console.log("2. 測試鑄造功能: node scripts/test-mint-functionality.js .env.v25-1");
        console.log("3. 同步配置到前端: node scripts/ultimate-config-system.js sync");
        console.log("4. 更新子圖配置");
        
        console.log(`\n✨ V25.1 針對性更新和配置全部完成！`);
        
    } catch (error) {
        console.error("\n❌ 配置過程中發生錯誤:");
        console.error(error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });