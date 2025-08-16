// deploy-native-ethers.js - 使用純原生 ethers 部署
const { ethers } = require('ethers');
const fs = require('fs');
require('dotenv').config();

// 合約 ABI 和 Bytecode
const heroArtifact = require('../../artifacts/contracts/current/nft/Hero.sol/Hero.json');
const relicArtifact = require('../../artifacts/contracts/current/nft/Relic.sol/Relic.json');
const altarArtifact = require('../../artifacts/contracts/current/core/AltarOfAscension.sol/AltarOfAscension.json');
const dungeonMasterArtifact = require('../../artifacts/contracts/current/core/DungeonMaster.sol/DungeonMaster.json');

async function main() {
    console.log("🚀 使用純原生 ethers 部署 VRF 修復合約...\n");

    // 設置提供者和錢包
    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("部署者地址:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("部署者餘額:", ethers.formatEther(balance), "BNB\n");

    // 獲取當前 gas 價格
    const feeData = await provider.getFeeData();
    console.log("當前 gas 價格:", ethers.formatUnits(feeData.gasPrice, 'gwei'), "gwei");

    const deploymentRecord = {
        timestamp: new Date().toISOString(),
        deployer: wallet.address,
        network: "bsc",
        contracts: {},
        errors: []
    };

    const currentAddresses = {
        DUNGEONCORE: '0x8a2D2b1961135127228EdD71Ff98d6B097915a13',
        SOULSHARD: '0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF',
        VRFMANAGER: '0xD062785C376560A392e1a5F1b25ffb35dB5b67bD',
        DUNGEONSTORAGE: '0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468'
    };

    try {
        // 1. 部署 Hero 合約
        console.log("📦 部署 Hero 合約...");
        const heroFactory = new ethers.ContractFactory(
            heroArtifact.abi,
            heroArtifact.bytecode,
            wallet
        );

        // 直接使用較大的 gas limit，不依賴估算
        const heroGasLimit = 6000000; // 6M gas
        console.log("Hero gas limit:", heroGasLimit);

        const heroContract = await heroFactory.deploy(wallet.address, {
            gasLimit: heroGasLimit,
            gasPrice: feeData.gasPrice
        });

        console.log("⏳ 等待 Hero 交易確認...");
        const heroReceipt = await heroContract.waitForDeployment();
        const heroAddress = await heroContract.getAddress();
        
        deploymentRecord.contracts.HERO = heroAddress;
        console.log("✅ Hero 部署成功:", heroAddress);
        console.log("   Gas 使用:", (await heroContract.deploymentTransaction().wait()).gasUsed.toString());

        // 2. 部署 Relic 合約
        console.log("\n📦 部署 Relic 合約...");
        const relicFactory = new ethers.ContractFactory(
            relicArtifact.abi,
            relicArtifact.bytecode,
            wallet
        );

        const relicGasLimit = 6000000; // 6M gas
        console.log("Relic gas limit:", relicGasLimit);

        const relicContract = await relicFactory.deploy(wallet.address, {
            gasLimit: relicGasLimit,
            gasPrice: feeData.gasPrice
        });

        console.log("⏳ 等待 Relic 交易確認...");
        await relicContract.waitForDeployment();
        const relicAddress = await relicContract.getAddress();
        
        deploymentRecord.contracts.RELIC = relicAddress;
        console.log("✅ Relic 部署成功:", relicAddress);
        console.log("   Gas 使用:", (await relicContract.deploymentTransaction().wait()).gasUsed.toString());

        // 3. 部署 AltarOfAscension 合約
        console.log("\n📦 部署 AltarOfAscension 合約...");
        const altarFactory = new ethers.ContractFactory(
            altarArtifact.abi,
            altarArtifact.bytecode,
            wallet
        );

        const altarGasLimit = 6000000; // 6M gas
        console.log("Altar gas limit:", altarGasLimit);

        const altarContract = await altarFactory.deploy(wallet.address, {
            gasLimit: altarGasLimit,
            gasPrice: feeData.gasPrice
        });

        console.log("⏳ 等待 AltarOfAscension 交易確認...");
        await altarContract.waitForDeployment();
        const altarAddress = await altarContract.getAddress();
        
        deploymentRecord.contracts.ALTAROFASCENSION = altarAddress;
        console.log("✅ AltarOfAscension 部署成功:", altarAddress);
        console.log("   Gas 使用:", (await altarContract.deploymentTransaction().wait()).gasUsed.toString());

        // 4. 部署 DungeonMaster 合約
        console.log("\n📦 部署 DungeonMaster 合約...");
        const dungeonMasterFactory = new ethers.ContractFactory(
            dungeonMasterArtifact.abi,
            dungeonMasterArtifact.bytecode,
            wallet
        );

        const dmGasLimit = 6000000; // 6M gas
        console.log("DungeonMaster gas limit:", dmGasLimit);

        const dungeonMasterContract = await dungeonMasterFactory.deploy(wallet.address, {
            gasLimit: dmGasLimit,
            gasPrice: feeData.gasPrice
        });

        console.log("⏳ 等待 DungeonMaster 交易確認...");
        await dungeonMasterContract.waitForDeployment();
        const dungeonMasterAddress = await dungeonMasterContract.getAddress();
        
        deploymentRecord.contracts.DUNGEONMASTER = dungeonMasterAddress;
        console.log("✅ DungeonMaster 部署成功:", dungeonMasterAddress);
        console.log("   Gas 使用:", (await dungeonMasterContract.deploymentTransaction().wait()).gasUsed.toString());

        // 5. 設置合約連接
        console.log("\n⚙️ 設置合約連接...");

        // Hero 連接設置
        console.log("🔗 設置 Hero 合約連接...");
        let tx = await heroContract.setDungeonCore(currentAddresses.DUNGEONCORE, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ DungeonCore 已設置");

        tx = await heroContract.setSoulShardToken(currentAddresses.SOULSHARD, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ SoulShardToken 已設置");

        tx = await heroContract.setVRFManager(currentAddresses.VRFMANAGER, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ VRFManager 已設置");

        // Relic 連接設置
        console.log("🔗 設置 Relic 合約連接...");
        tx = await relicContract.setDungeonCore(currentAddresses.DUNGEONCORE, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();

        tx = await relicContract.setSoulShardToken(currentAddresses.SOULSHARD, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();

        tx = await relicContract.setVRFManager(currentAddresses.VRFMANAGER, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ Relic 連接已設置");

        // AltarOfAscension 連接設置
        console.log("🔗 設置 AltarOfAscension 合約連接...");
        tx = await altarContract.setDungeonCore(currentAddresses.DUNGEONCORE, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();

        tx = await altarContract.setVRFManager(currentAddresses.VRFMANAGER, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ AltarOfAscension 連接已設置");

        // DungeonMaster 連接設置
        console.log("🔗 設置 DungeonMaster 合約連接...");
        tx = await dungeonMasterContract.setDungeonCore(currentAddresses.DUNGEONCORE, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();

        tx = await dungeonMasterContract.setDungeonStorage(currentAddresses.DUNGEONSTORAGE, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();

        tx = await dungeonMasterContract.setVRFManager(currentAddresses.VRFMANAGER, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ DungeonMaster 連接已設置");

        // 6. VRF 授權
        console.log("\n🔐 授權合約使用 VRF Manager...");
        const vrfManagerContract = new ethers.Contract(
            currentAddresses.VRFMANAGER,
            [
                "function authorizeContract(address contract_) external"
            ],
            wallet
        );

        tx = await vrfManagerContract.authorizeContract(heroAddress, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ Hero 已授權使用 VRF");

        tx = await vrfManagerContract.authorizeContract(relicAddress, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ Relic 已授權使用 VRF");

        tx = await vrfManagerContract.authorizeContract(altarAddress, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ AltarOfAscension 已授權使用 VRF");

        tx = await vrfManagerContract.authorizeContract(dungeonMasterAddress, {
            gasPrice: feeData.gasPrice
        });
        await tx.wait();
        console.log("  ✅ DungeonMaster 已授權使用 VRF");

        // 7. 輸出結果
        console.log("\n🎉 所有合約部署和設置完成！");
        console.log("\n📋 新合約地址：");
        console.log("HERO:", heroAddress);
        console.log("RELIC:", relicAddress);
        console.log("ALTAROFASCENSION:", altarAddress);
        console.log("DUNGEONMASTER:", dungeonMasterAddress);

        // 8. 保存記錄
        const deploymentDir = './scripts/deployments';
        if (!fs.existsSync(deploymentDir)) {
            fs.mkdirSync(deploymentDir, { recursive: true });
        }
        
        const deploymentPath = `${deploymentDir}/vrf-fix-native-${Date.now()}.json`;
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentRecord, null, 2));
        console.log("\n💾 部署記錄已保存到:", deploymentPath);

        // 9. 環境變數
        console.log("\n📝 環境變數配置：");
        console.log(`HERO_ADDRESS=${heroAddress}`);
        console.log(`RELIC_ADDRESS=${relicAddress}`);
        console.log(`ALTAROFASCENSION_ADDRESS=${altarAddress}`);
        console.log(`DUNGEONMASTER_ADDRESS=${dungeonMasterAddress}`);

    } catch (error) {
        console.error("❌ 部署失敗:", error);
        deploymentRecord.errors.push({
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        const errorPath = `./scripts/deployments/vrf-fix-error-${Date.now()}.json`;
        fs.writeFileSync(errorPath, JSON.stringify(deploymentRecord, null, 2));
        console.log("💾 錯誤記錄已保存到:", errorPath);
        
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });