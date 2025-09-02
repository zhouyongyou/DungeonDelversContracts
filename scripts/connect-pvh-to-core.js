// connect-pvh-to-core.js
// 配置 PlayerVault、Hero、Relic 與 DungeonCore 的雙向連接

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔗 開始配置 PlayerVault、Hero、Relic 與 DungeonCore 的連接");
    console.log("=".repeat(60));

    const [signer] = await hre.ethers.getSigners();
    console.log("操作者地址:", signer.address);
    console.log("操作者餘額:", hre.ethers.formatEther(await signer.provider.getBalance(signer.address)), "BNB");

    // 獲取 DungeonCore 地址
    const DUNGEONCORE_ADDRESS = process.env.VITE_DUNGEONCORE_ADDRESS;
    if (!DUNGEONCORE_ADDRESS) {
        throw new Error("❌ DungeonCore 地址未設定");
    }
    console.log("DungeonCore 地址:", DUNGEONCORE_ADDRESS);

    // 從部署記錄中讀取新合約地址
    const deploymentsDir = path.join(__dirname, '../deployments');
    const files = fs.readdirSync(deploymentsDir)
        .filter(file => file.startsWith('pvh-deployment-') && file.endsWith('.json'))
        .sort()
        .reverse();

    if (files.length === 0) {
        throw new Error("❌ 找不到部署記錄，請先執行部署腳本");
    }

    const latestDeployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, files[0]), 'utf8'));
    const contracts = latestDeployment.contracts;
    
    console.log("📋 使用部署記錄:", files[0]);
    console.log("PlayerVault:", contracts.PlayerVault.address);
    console.log("Hero:       ", contracts.Hero.address);
    console.log("Relic:      ", contracts.Relic.address);

    const connectionResults = {};
    const transactions = [];

    try {
        // 獲取合約實例
        const dungeonCore = await hre.ethers.getContractAt("DungeonCore", DUNGEONCORE_ADDRESS);
        const playerVault = await hre.ethers.getContractAt("PlayerVault", contracts.PlayerVault.address);
        const hero = await hre.ethers.getContractAt("Hero", contracts.Hero.address);
        const relic = await hre.ethers.getContractAt("Relic", contracts.Relic.address);

        // Phase 1: 設定新合約的 DungeonCore
        console.log("\n📍 Phase 1: 設定新合約的 DungeonCore 地址");
        console.log("-".repeat(50));

        // 1.1 PlayerVault.setDungeonCore()
        console.log("1.1 設定 PlayerVault.dungeonCore...");
        try {
            const currentCore = await playerVault.dungeonCore();
            if (currentCore.toLowerCase() !== DUNGEONCORE_ADDRESS.toLowerCase()) {
                const tx = await playerVault.setDungeonCore(DUNGEONCORE_ADDRESS);
                console.log("    交易已發送:", tx.hash);
                await tx.wait();
                transactions.push({ contract: 'PlayerVault', method: 'setDungeonCore', tx: tx.hash });
                console.log("    ✅ PlayerVault.dungeonCore 設定成功");
                connectionResults.playerVaultToDungeonCore = 'success';
            } else {
                console.log("    ✅ PlayerVault.dungeonCore 已經正確設定");
                connectionResults.playerVaultToDungeonCore = 'already_set';
            }
        } catch (error) {
            console.error("    ❌ PlayerVault.setDungeonCore 失敗:", error.message);
            connectionResults.playerVaultToDungeonCore = 'failed';
        }

        // 1.2 Hero.setDungeonCore()
        console.log("1.2 設定 Hero.dungeonCore...");
        try {
            const currentCore = await hero.dungeonCore();
            if (currentCore.toLowerCase() !== DUNGEONCORE_ADDRESS.toLowerCase()) {
                const tx = await hero.setDungeonCore(DUNGEONCORE_ADDRESS);
                console.log("    交易已發送:", tx.hash);
                await tx.wait();
                transactions.push({ contract: 'Hero', method: 'setDungeonCore', tx: tx.hash });
                console.log("    ✅ Hero.dungeonCore 設定成功");
                connectionResults.heroToDungeonCore = 'success';
            } else {
                console.log("    ✅ Hero.dungeonCore 已經正確設定");
                connectionResults.heroToDungeonCore = 'already_set';
            }
        } catch (error) {
            console.error("    ❌ Hero.setDungeonCore 失敗:", error.message);
            connectionResults.heroToDungeonCore = 'failed';
        }

        // 1.3 Relic.setDungeonCore()
        console.log("1.3 設定 Relic.dungeonCore...");
        try {
            const currentCore = await relic.dungeonCore();
            if (currentCore.toLowerCase() !== DUNGEONCORE_ADDRESS.toLowerCase()) {
                const tx = await relic.setDungeonCore(DUNGEONCORE_ADDRESS);
                console.log("    交易已發送:", tx.hash);
                await tx.wait();
                transactions.push({ contract: 'Relic', method: 'setDungeonCore', tx: tx.hash });
                console.log("    ✅ Relic.dungeonCore 設定成功");
                connectionResults.relicToDungeonCore = 'success';
            } else {
                console.log("    ✅ Relic.dungeonCore 已經正確設定");
                connectionResults.relicToDungeonCore = 'already_set';
            }
        } catch (error) {
            console.error("    ❌ Relic.setDungeonCore 失敗:", error.message);
            connectionResults.relicToDungeonCore = 'failed';
        }

        // Phase 2: 更新 DungeonCore 中的合約地址
        console.log("\n📍 Phase 2: 更新 DungeonCore 中的合約地址");
        console.log("-".repeat(50));

        // 2.1 DungeonCore.setPlayerVault()
        console.log("2.1 設定 DungeonCore.playerVault...");
        try {
            const currentVault = await dungeonCore.playerVaultAddress();
            if (currentVault.toLowerCase() !== contracts.PlayerVault.address.toLowerCase()) {
                const tx = await dungeonCore.setPlayerVault(contracts.PlayerVault.address);
                console.log("    交易已發送:", tx.hash);
                await tx.wait();
                transactions.push({ contract: 'DungeonCore', method: 'setPlayerVault', tx: tx.hash });
                console.log("    ✅ DungeonCore.playerVault 設定成功");
                connectionResults.dungeonCoreToPlayerVault = 'success';
            } else {
                console.log("    ✅ DungeonCore.playerVault 已經正確設定");
                connectionResults.dungeonCoreToPlayerVault = 'already_set';
            }
        } catch (error) {
            console.error("    ❌ DungeonCore.setPlayerVault 失敗:", error.message);
            connectionResults.dungeonCoreToPlayerVault = 'failed';
        }

        // 2.2 DungeonCore.setHeroContract()
        console.log("2.2 設定 DungeonCore.heroContract...");
        try {
            const currentHero = await dungeonCore.heroContractAddress();
            if (currentHero.toLowerCase() !== contracts.Hero.address.toLowerCase()) {
                const tx = await dungeonCore.setHeroContract(contracts.Hero.address);
                console.log("    交易已發送:", tx.hash);
                await tx.wait();
                transactions.push({ contract: 'DungeonCore', method: 'setHeroContract', tx: tx.hash });
                console.log("    ✅ DungeonCore.heroContract 設定成功");
                connectionResults.dungeonCoreToHero = 'success';
            } else {
                console.log("    ✅ DungeonCore.heroContract 已經正確設定");
                connectionResults.dungeonCoreToHero = 'already_set';
            }
        } catch (error) {
            console.error("    ❌ DungeonCore.setHeroContract 失敗:", error.message);
            connectionResults.dungeonCoreToHero = 'failed';
        }

        // 2.3 DungeonCore.setRelicContract()
        console.log("2.3 設定 DungeonCore.relicContract...");
        try {
            const currentRelic = await dungeonCore.relicContractAddress();
            if (currentRelic.toLowerCase() !== contracts.Relic.address.toLowerCase()) {
                const tx = await dungeonCore.setRelicContract(contracts.Relic.address);
                console.log("    交易已發送:", tx.hash);
                await tx.wait();
                transactions.push({ contract: 'DungeonCore', method: 'setRelicContract', tx: tx.hash });
                console.log("    ✅ DungeonCore.relicContract 設定成功");
                connectionResults.dungeonCoreToRelic = 'success';
            } else {
                console.log("    ✅ DungeonCore.relicContract 已經正確設定");
                connectionResults.dungeonCoreToRelic = 'already_set';
            }
        } catch (error) {
            console.error("    ❌ DungeonCore.setRelicContract 失敗:", error.message);
            connectionResults.dungeonCoreToRelic = 'failed';
        }

        // Phase 3: 驗證所有連接
        console.log("\n📍 Phase 3: 驗證所有連接");
        console.log("-".repeat(50));

        // 驗證雙向連接
        const verificationResults = {};
        
        // PlayerVault 連接驗證
        const vaultCore = await playerVault.dungeonCore();
        const coreVault = await dungeonCore.playerVaultAddress();
        verificationResults.playerVault = {
            toCore: vaultCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase(),
            fromCore: coreVault.toLowerCase() === contracts.PlayerVault.address.toLowerCase()
        };

        // Hero 連接驗證
        const heroCore = await hero.dungeonCore();
        const coreHero = await dungeonCore.heroContractAddress();
        verificationResults.hero = {
            toCore: heroCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase(),
            fromCore: coreHero.toLowerCase() === contracts.Hero.address.toLowerCase()
        };

        // Relic 連接驗證
        const relicCore = await relic.dungeonCore();
        const coreRelicAddr = await dungeonCore.relicContractAddress();
        verificationResults.relic = {
            toCore: relicCore.toLowerCase() === DUNGEONCORE_ADDRESS.toLowerCase(),
            fromCore: coreRelicAddr.toLowerCase() === contracts.Relic.address.toLowerCase()
        };

        // 顯示驗證結果
        Object.entries(verificationResults).forEach(([contract, results]) => {
            const toCoreStatus = results.toCore ? "✅" : "❌";
            const fromCoreStatus = results.fromCore ? "✅" : "❌";
            console.log(`${contract.toUpperCase().padEnd(12)}: → Core ${toCoreStatus}, ← Core ${fromCoreStatus}`);
        });

        // 保存連接記錄
        const connectionRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            deployer: signer.address,
            results: connectionResults,
            verificationResults,
            transactions,
            contracts: {
                playerVault: contracts.PlayerVault.address,
                hero: contracts.Hero.address,
                relic: contracts.Relic.address,
                dungeonCore: DUNGEONCORE_ADDRESS
            },
            notes: "PlayerVault、Hero、Relic 與 DungeonCore 連接配置"
        };

        const connectFilename = `pvh-connection-${new Date().toISOString().split('T')[0]}.json`;
        const connectFilepath = path.join(deploymentsDir, connectFilename);
        fs.writeFileSync(connectFilepath, JSON.stringify(connectionRecord, null, 2));

        // 顯示摘要
        console.log("\n" + "=" * 60);
        console.log("🎉 連接配置完成摘要");
        console.log("=".repeat(60));
        console.log("執行的交易數:", transactions.length);
        console.log("連接記錄已保存:", connectFilename);

        // 檢查是否有失敗
        const hasFailures = Object.values(connectionResults).some(r => r === 'failed') ||
                           Object.values(verificationResults).some(r => !r.toCore || !r.fromCore);

        if (hasFailures) {
            console.log("\n⚠️ 部分連接配置失敗，請檢查日誌");
        } else {
            console.log("\n✅ 所有合約連接配置成功！");
            console.log("\n⚠️ 下一步：");
            console.log("1. 更新 .env 文件中的合約地址");
            console.log("2. 執行配置同步: node scripts/ultimate-config-system.js sync");
            console.log("3. 測試合約功能");
        }

        return connectionRecord;

    } catch (error) {
        console.error("❌ 連接配置過程發生錯誤:", error);
        
        const errorRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            error: error.message,
            results: connectionResults,
            transactions,
            notes: "連接配置過程中發生錯誤"
        };
        
        const errorFilename = `pvh-connection-error-${new Date().toISOString().split('T')[0]}.json`;
        const errorFilepath = path.join(deploymentsDir, errorFilename);
        fs.writeFileSync(errorFilepath, JSON.stringify(errorRecord, null, 2));
        
        throw error;
    }
}

if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;