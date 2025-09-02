const hre = require("hardhat");

async function main() {
    console.log("🔧 修復 V25.0.4 合約互連 (使用管理員錢包)...\n");
    
    // 確保使用管理員私鑰
    const adminPrivateKey = "0x752ea9f5a05debf36cbf2fd52a52d30ba135ca439208279922d8410157091c89";
    const adminWallet = new hre.ethers.Wallet(adminPrivateKey, hre.ethers.provider);
    console.log("🔑 管理員地址:", adminWallet.address);
    console.log("💰 BNB 餘額:", hre.ethers.formatEther(await hre.ethers.provider.getBalance(adminWallet.address)), "BNB\n");
    
    // V25.0.4 合約地址
    const CONTRACTS = {
        DungeonCore: "0x5B64A5939735Ff762493D9B9666b3e13118c5722",
        Oracle: "0xEE322Eff70320759487f67875113C062AC1F4cfB", 
        Hero: "0xE44A7CA10bAC8B1042EeBd66ccF24c5b1D734b19",
        Relic: "0x91Bf924E9CEF490F7C999C1F083eE1636595220D",
        Party: "0x495bcE2D9561E0f7623fF244e4BA28DCFfEe71d9",
        DungeonMaster: "0xAAdE1919B2EA95cBBFcDEa41CBf9D48ae0d44cdF",
        DungeonStorage: "0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec",
        AltarOfAscension: "0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3",
        PlayerVault: "0x446a82f2003484Bdc83f29e094fcb66D01094db0",
        PlayerProfile: "0x3509d0f0cD6f7b518860f945128205ac4F426090",
        VIPStaking: "0x18d13f4FdE3245ABa6D0fb91597291e1F46b0661",
        SoulShard: "0xB73FE158689EAB3396B64794b573D4BEc7113412",
        USD: "0x9DC0b768533222fddbe6A9Bd71eAD96a7c612C61",
        VRFManager: "0xa94555C309Dd83d9fB0531852d209c46Fa50637f"
    };
    
    console.log("=" .repeat(60));
    
    let txCount = 0;
    const transactions = [];
    
    // ===========================================
    // 1. 設定 DungeonCore 的模組地址
    // ===========================================
    console.log("\n🏛️ 設定 DungeonCore 模組地址...");
    console.log("-".repeat(60));
    
    const dungeonCoreABI = [
        "function setHeroAddress(address)",
        "function setRelicAddress(address)",  
        "function setPartyAddress(address)",
        "function setSoulShardAddress(address)",
        "function heroAddress() view returns (address)",
        "function relicAddress() view returns (address)",
        "function partyAddress() view returns (address)",
        "function soulShardAddress() view returns (address)"
    ];
    
    try {
        const dungeonCore = new hre.ethers.Contract(CONTRACTS.DungeonCore, dungeonCoreABI, adminWallet);
        
        // 檢查並設定 Hero 地址
        try {
            const currentHero = await dungeonCore.heroAddress();
            if (currentHero.toLowerCase() !== CONTRACTS.Hero.toLowerCase()) {
                console.log(`設定 Hero 地址: ${CONTRACTS.Hero}`);
                const tx = await dungeonCore.setHeroAddress(CONTRACTS.Hero, { gasLimit: 300000 });
                transactions.push({ name: "DungeonCore.setHeroAddress", hash: tx.hash });
                txCount++;
                await tx.wait();
                console.log("✅ Hero 地址設定完成");
            } else {
                console.log("✅ Hero 地址已正確");
            }
        } catch (e) {
            console.log("❌ 設定 Hero 地址失敗:", e.message);
        }
        
        // 檢查並設定 Relic 地址
        try {
            const currentRelic = await dungeonCore.relicAddress();
            if (currentRelic.toLowerCase() !== CONTRACTS.Relic.toLowerCase()) {
                console.log(`設定 Relic 地址: ${CONTRACTS.Relic}`);
                const tx = await dungeonCore.setRelicAddress(CONTRACTS.Relic, { gasLimit: 300000 });
                transactions.push({ name: "DungeonCore.setRelicAddress", hash: tx.hash });
                txCount++;
                await tx.wait();
                console.log("✅ Relic 地址設定完成");
            } else {
                console.log("✅ Relic 地址已正確");
            }
        } catch (e) {
            console.log("❌ 設定 Relic 地址失敗:", e.message);
        }
        
        // 檢查並設定 Party 地址
        try {
            const currentParty = await dungeonCore.partyAddress();
            if (currentParty.toLowerCase() !== CONTRACTS.Party.toLowerCase()) {
                console.log(`設定 Party 地址: ${CONTRACTS.Party}`);
                const tx = await dungeonCore.setPartyAddress(CONTRACTS.Party, { gasLimit: 300000 });
                transactions.push({ name: "DungeonCore.setPartyAddress", hash: tx.hash });
                txCount++;
                await tx.wait();
                console.log("✅ Party 地址設定完成");
            } else {
                console.log("✅ Party 地址已正確");
            }
        } catch (e) {
            console.log("❌ 設定 Party 地址失敗:", e.message);
        }
        
        // 檢查並設定 SoulShard 地址
        try {
            const currentSoulShard = await dungeonCore.soulShardAddress();
            if (currentSoulShard.toLowerCase() !== CONTRACTS.SoulShard.toLowerCase()) {
                console.log(`設定 SoulShard 地址: ${CONTRACTS.SoulShard}`);
                const tx = await dungeonCore.setSoulShardAddress(CONTRACTS.SoulShard, { gasLimit: 300000 });
                transactions.push({ name: "DungeonCore.setSoulShardAddress", hash: tx.hash });
                txCount++;
                await tx.wait();
                console.log("✅ SoulShard 地址設定完成");
            } else {
                console.log("✅ SoulShard 地址已正確");
            }
        } catch (e) {
            console.log("❌ 設定 SoulShard 地址失敗:", e.message);
        }
        
    } catch (error) {
        console.log("❌ DungeonCore 設定失敗:", error.message);
    }
    
    // ===========================================
    // 2. 設定各合約的 DungeonCore 地址
    // ===========================================
    console.log("\n🔄 設定各合約的 DungeonCore 地址...");
    console.log("-".repeat(60));
    
    const coreSetterABI = [
        "function setDungeonCoreAddress(address)"
    ];
    
    const contractsToSetCore = [
        "Hero", "Relic", "Party", "DungeonMaster", 
        "PlayerVault", "PlayerProfile", "VIPStaking"
    ];
    
    for (const contractName of contractsToSetCore) {
        try {
            const contract = new hre.ethers.Contract(CONTRACTS[contractName], coreSetterABI, adminWallet);
            console.log(`設定 ${contractName} 的 DungeonCore 地址`);
            const tx = await contract.setDungeonCoreAddress(CONTRACTS.DungeonCore, { gasLimit: 300000 });
            transactions.push({ name: `${contractName}.setDungeonCoreAddress`, hash: tx.hash });
            txCount++;
            await tx.wait();
            console.log(`✅ ${contractName} DungeonCore 地址設定完成`);
        } catch (e) {
            console.log(`❌ ${contractName} DungeonCore 地址設定失敗:`, e.message);
        }
    }
    
    // ===========================================
    // 3. 設定 DungeonMaster 的 DungeonStorage 地址
    // ===========================================
    console.log("\n🗄️ 設定 DungeonMaster 的 DungeonStorage 地址...");
    console.log("-".repeat(60));
    
    const dmStorageABI = [
        "function setDungeonStorageAddress(address)"
    ];
    
    try {
        const dungeonMaster = new hre.ethers.Contract(CONTRACTS.DungeonMaster, dmStorageABI, adminWallet);
        console.log(`設定 DungeonStorage 地址: ${CONTRACTS.DungeonStorage}`);
        const tx = await dungeonMaster.setDungeonStorageAddress(CONTRACTS.DungeonStorage, { gasLimit: 300000 });
        transactions.push({ name: "DungeonMaster.setDungeonStorageAddress", hash: tx.hash });
        txCount++;
        await tx.wait();
        console.log("✅ DungeonStorage 地址設定完成");
    } catch (e) {
        console.log("❌ DungeonStorage 地址設定失敗:", e.message);
    }
    
    // ===========================================
    // 4. 設定 Oracle 的 Token 地址
    // ===========================================
    console.log("\n💰 設定 Oracle 的 Token 地址...");
    console.log("-".repeat(60));
    
    const oracleABI = [
        "function setSoulShardAddress(address)",
        "function setUsdAddress(address)"
    ];
    
    try {
        const oracle = new hre.ethers.Contract(CONTRACTS.Oracle, oracleABI, adminWallet);
        
        // 設定 SoulShard 地址
        try {
            console.log(`設定 Oracle SoulShard 地址: ${CONTRACTS.SoulShard}`);
            const tx = await oracle.setSoulShardAddress(CONTRACTS.SoulShard, { gasLimit: 300000 });
            transactions.push({ name: "Oracle.setSoulShardAddress", hash: tx.hash });
            txCount++;
            await tx.wait();
            console.log("✅ Oracle SoulShard 地址設定完成");
        } catch (e) {
            console.log("❌ Oracle SoulShard 地址設定失敗:", e.message);
        }
        
        // 設定 USD 地址
        try {
            console.log(`設定 Oracle USD 地址: ${CONTRACTS.USD}`);
            const tx = await oracle.setUsdAddress(CONTRACTS.USD, { gasLimit: 300000 });
            transactions.push({ name: "Oracle.setUsdAddress", hash: tx.hash });
            txCount++;
            await tx.wait();
            console.log("✅ Oracle USD 地址設定完成");
        } catch (e) {
            console.log("❌ Oracle USD 地址設定失敗:", e.message);
        }
    } catch (error) {
        console.log("❌ Oracle 合約連接失敗:", error.message);
    }
    
    // ===========================================
    // 5. 授權 VRF Manager
    // ===========================================
    console.log("\n📡 授權 VRF Manager...");
    console.log("-".repeat(60));
    
    const vrfManagerABI = [
        "function authorize(address)"
    ];
    
    try {
        const vrfManager = new hre.ethers.Contract(CONTRACTS.VRFManager, vrfManagerABI, adminWallet);
        
        const vrfClients = ["DungeonMaster", "Hero", "Relic", "AltarOfAscension"];
        for (const clientName of vrfClients) {
            try {
                console.log(`授權 ${clientName} 使用 VRF`);
                const tx = await vrfManager.authorize(CONTRACTS[clientName], { gasLimit: 300000 });
                transactions.push({ name: `VRFManager.authorize(${clientName})`, hash: tx.hash });
                txCount++;
                await tx.wait();
                console.log(`✅ ${clientName} VRF 授權完成`);
            } catch (e) {
                console.log(`❌ ${clientName} VRF 授權失敗:`, e.message);
            }
        }
    } catch (error) {
        console.log("❌ VRF Manager 連接失敗:", error.message);
    }
    
    // ===========================================
    // 總結
    // ===========================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 修復結果總結");
    console.log("=".repeat(60));
    
    console.log(`\n執行了 ${txCount} 個交易:`);
    transactions.forEach((tx, index) => {
        console.log(`${index + 1}. ${tx.name}`);
        console.log(`   Hash: ${tx.hash}`);
        console.log(`   BSCScan: https://bscscan.com/tx/${tx.hash}`);
    });
    
    if (txCount > 0) {
        console.log("\n✅ 合約互連修復完成！");
        console.log("建議運行 check-all-connections.js 驗證結果");
        console.log("\n🚀 下一步:");
        console.log("1. 編譯子圖準備部署");
        console.log("2. 前端測試鑄造功能");
        console.log("3. 確認所有功能正常運作");
    } else {
        console.log("\n✅ 所有連接都已正確，無需修復！");
    }
    
    console.log("\n💡 V25.0.4 部署完整性檢查完成");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("修復過程發生錯誤:", error);
        process.exit(1);
    });