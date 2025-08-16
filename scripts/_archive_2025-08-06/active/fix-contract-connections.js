// fix-contract-connections.js - 修復合約連接和地址設定
const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
    console.log("🔧 修復 V25 VRF 版本合約連接和地址設定...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("操作者地址:", wallet.address);
    
    // 正確的 V25 VRF 版本地址
    const correctAddresses = {
        // 核心合約
        DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
        ORACLE: '0xf8CE896aF39f95a9d5Dd688c35d381062263E25a',
        PLAYERVAULT: '0x62Bce9aF5E2C47b13f62A2e0fCB1f9C7AfaF8787',
        PLAYERPROFILE: '0x0f5932e89908400a5AfDC306899A2987b67a3155',
        VIPSTAKING: '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C',
        
        // 更新的合約 (V26 VRF 修復版本)
        HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
        RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
        PARTY: '0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3',
        ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
        DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253',
        DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468',
        
        // 代幣合約
        SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
        USD: '0x7C67Af4EBC6651c95dF78De11cfe325660d935FE',
        VRFMANAGER: '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD'
    };

    try {
        const feeData = await provider.getFeeData();
        const gasOptions = { gasPrice: feeData.gasPrice, gasLimit: 200000 };

        // 1. 修復 DungeonCore 中的地址設定
        console.log("🔧 修復 DungeonCore 中的地址設定...");
        const dungeonCoreABI = [
            'function setOracle(address _newAddress) external',
            'function setPlayerVault(address _newAddress) external', 
            'function setPlayerProfile(address _newAddress) external',
            'function setVipStaking(address _newAddress) external',
            'function setPartyContract(address _newAddress) external',
            'function oracleAddress() external view returns (address)',
            'function playerVaultAddress() external view returns (address)',
            'function playerProfileAddress() external view returns (address)',
            'function vipStakingAddress() external view returns (address)',
            'function partyContractAddress() external view returns (address)'
        ];
        
        const dungeonCore = new ethers.Contract(correctAddresses.DUNGEONCORE, dungeonCoreABI, wallet);

        // 檢查並更新 Oracle
        const currentOracle = await dungeonCore.oracleAddress();
        if (currentOracle.toLowerCase() !== correctAddresses.ORACLE.toLowerCase()) {
            console.log(`🔄 更新 Oracle: ${currentOracle} → ${correctAddresses.ORACLE}`);
            let tx = await dungeonCore.setOracle(correctAddresses.ORACLE, gasOptions);
            await tx.wait();
            console.log("✅ Oracle 地址已更新");
        } else {
            console.log("✅ Oracle 地址已正確");
        }

        // 檢查並更新 PlayerVault
        const currentVault = await dungeonCore.playerVaultAddress();
        if (currentVault.toLowerCase() !== correctAddresses.PLAYERVAULT.toLowerCase()) {
            console.log(`🔄 更新 PlayerVault: ${currentVault} → ${correctAddresses.PLAYERVAULT}`);
            let tx = await dungeonCore.setPlayerVault(correctAddresses.PLAYERVAULT, gasOptions);
            await tx.wait();
            console.log("✅ PlayerVault 地址已更新");
        } else {
            console.log("✅ PlayerVault 地址已正確");
        }

        // 檢查並更新 PlayerProfile
        const currentProfile = await dungeonCore.playerProfileAddress();
        if (currentProfile.toLowerCase() !== correctAddresses.PLAYERPROFILE.toLowerCase()) {
            console.log(`🔄 更新 PlayerProfile: ${currentProfile} → ${correctAddresses.PLAYERPROFILE}`);
            let tx = await dungeonCore.setPlayerProfile(correctAddresses.PLAYERPROFILE, gasOptions);
            await tx.wait();
            console.log("✅ PlayerProfile 地址已更新");
        } else {
            console.log("✅ PlayerProfile 地址已正確");
        }

        // 檢查並更新 VIPStaking
        const currentVip = await dungeonCore.vipStakingAddress();
        if (currentVip.toLowerCase() !== correctAddresses.VIPSTAKING.toLowerCase()) {
            console.log(`🔄 更新 VIPStaking: ${currentVip} → ${correctAddresses.VIPSTAKING}`);
            let tx = await dungeonCore.setVipStaking(correctAddresses.VIPSTAKING, gasOptions);
            await tx.wait();
            console.log("✅ VIPStaking 地址已更新");
        } else {
            console.log("✅ VIPStaking 地址已正確");
        }

        // 檢查並更新 Party
        const currentParty = await dungeonCore.partyContractAddress();
        if (currentParty.toLowerCase() !== correctAddresses.PARTY.toLowerCase()) {
            console.log(`🔄 更新 Party: ${currentParty} → ${correctAddresses.PARTY}`);
            let tx = await dungeonCore.setPartyContract(correctAddresses.PARTY, gasOptions);
            await tx.wait();
            console.log("✅ Party 地址已更新");
        } else {
            console.log("✅ Party 地址已正確");
        }

        // 2. 修復各模組的回連設定
        console.log("\n🔧 修復各模組的回連設定...");

        // Party 設定 DungeonCore
        console.log("🔗 設定 Party → DungeonCore 連接...");
        const partyABI = ['function setDungeonCore(address _newAddress) external'];
        const party = new ethers.Contract(correctAddresses.PARTY, partyABI, wallet);
        let tx = await party.setDungeonCore(correctAddresses.DUNGEONCORE, gasOptions);
        await tx.wait();
        console.log("✅ Party → DungeonCore 連接已設定");

        // PlayerProfile 設定 DungeonCore  
        console.log("🔗 設定 PlayerProfile → DungeonCore 連接...");
        const profileABI = ['function setDungeonCore(address _newAddress) external'];
        const profile = new ethers.Contract(correctAddresses.PLAYERPROFILE, profileABI, wallet);
        tx = await profile.setDungeonCore(correctAddresses.DUNGEONCORE, gasOptions);
        await tx.wait();
        console.log("✅ PlayerProfile → DungeonCore 連接已設定");

        // AltarOfAscension 設定 DungeonCore
        console.log("🔗 設定 AltarOfAscension → DungeonCore 連接...");
        const altarABI = ['function setDungeonCore(address _newAddress) external'];
        const altar = new ethers.Contract(correctAddresses.ALTAROFASCENSION, altarABI, wallet);
        tx = await altar.setDungeonCore(correctAddresses.DUNGEONCORE, gasOptions);
        await tx.wait();
        console.log("✅ AltarOfAscension → DungeonCore 連接已設定");

        // DungeonMaster 設定 SoulShard
        console.log("🔗 設定 DungeonMaster → SoulShard 連接...");
        const dmABI = ['function setSoulShardToken(address _newAddress) external'];
        const dungeonMaster = new ethers.Contract(correctAddresses.DUNGEONMASTER, dmABI, wallet);
        tx = await dungeonMaster.setSoulShardToken(correctAddresses.SOULSHARD, gasOptions);
        await tx.wait();
        console.log("✅ DungeonMaster → SoulShard 連接已設定");

        console.log("\n🎉 所有合約連接修復完成！");
        
        // 3. 驗證設定
        console.log("\n📋 驗證最終設定：");
        console.log("Oracle:", await dungeonCore.oracleAddress());
        console.log("PlayerVault:", await dungeonCore.playerVaultAddress());
        console.log("PlayerProfile:", await dungeonCore.playerProfileAddress());
        console.log("VIPStaking:", await dungeonCore.vipStakingAddress());
        console.log("Party:", await dungeonCore.partyContractAddress());

    } catch (error) {
        console.error("❌ 修復過程中發生錯誤:", error.message);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });