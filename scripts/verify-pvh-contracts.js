// verify-pvh-contracts.js
// 驗證 PlayerVault、Hero、Relic 合約在 BSCscan 上開源

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔍 開始驗證 PlayerVault、Hero、Relic 合約");
    console.log("=".repeat(60));

    // 檢查 BSCSCAN_API_KEY
    const apiKey = process.env.BSCSCAN_API_KEY;
    if (!apiKey) {
        throw new Error("❌ BSCSCAN_API_KEY 未設定，請在 .env 文件中添加");
    }

    // 從部署記錄中讀取地址
    const deploymentsDir = path.join(__dirname, '../deployments');
    const files = fs.readdirSync(deploymentsDir)
        .filter(file => file.startsWith('pvh-deployment-') && file.endsWith('.json'))
        .sort()
        .reverse(); // 最新的在前面

    if (files.length === 0) {
        throw new Error("❌ 找不到部署記錄，請先執行部署腳本");
    }

    const latestDeployment = JSON.parse(fs.readFileSync(path.join(deploymentsDir, files[0]), 'utf8'));
    console.log("📋 使用部署記錄:", files[0]);
    
    const contracts = latestDeployment.contracts;
    if (!contracts || !contracts.PlayerVault || !contracts.Hero || !contracts.Relic) {
        throw new Error("❌ 部署記錄不完整，請重新部署");
    }

    const verificationResults = {};

    try {
        // 1. 驗證 PlayerVault
        console.log("\n📋 1. 驗證 PlayerVault...");
        console.log("地址:", contracts.PlayerVault.address);
        
        try {
            await hre.run("verify:verify", {
                address: contracts.PlayerVault.address,
                constructorArguments: []
            });
            verificationResults.PlayerVault = { status: 'success', address: contracts.PlayerVault.address };
            console.log("✅ PlayerVault 驗證成功");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ PlayerVault 已經驗證過了");
                verificationResults.PlayerVault = { status: 'already_verified', address: contracts.PlayerVault.address };
            } else {
                console.error("❌ PlayerVault 驗證失敗:", error.message);
                verificationResults.PlayerVault = { status: 'failed', error: error.message, address: contracts.PlayerVault.address };
            }
        }

        // 2. 驗證 Hero
        console.log("\n⚔️ 2. 驗證 Hero...");
        console.log("地址:", contracts.Hero.address);
        
        try {
            await hre.run("verify:verify", {
                address: contracts.Hero.address,
                constructorArguments: []
            });
            verificationResults.Hero = { status: 'success', address: contracts.Hero.address };
            console.log("✅ Hero 驗證成功");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ Hero 已經驗證過了");
                verificationResults.Hero = { status: 'already_verified', address: contracts.Hero.address };
            } else {
                console.error("❌ Hero 驗證失敗:", error.message);
                verificationResults.Hero = { status: 'failed', error: error.message, address: contracts.Hero.address };
            }
        }

        // 3. 驗證 Relic
        console.log("\n💎 3. 驗證 Relic...");
        console.log("地址:", contracts.Relic.address);
        
        try {
            await hre.run("verify:verify", {
                address: contracts.Relic.address,
                constructorArguments: []
            });
            verificationResults.Relic = { status: 'success', address: contracts.Relic.address };
            console.log("✅ Relic 驗證成功");
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log("✅ Relic 已經驗證過了");
                verificationResults.Relic = { status: 'already_verified', address: contracts.Relic.address };
            } else {
                console.error("❌ Relic 驗證失敗:", error.message);
                verificationResults.Relic = { status: 'failed', error: error.message, address: contracts.Relic.address };
            }
        }

        // 4. 保存驗證記錄
        console.log("\n📝 4. 保存驗證記錄...");
        
        const verificationRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            results: verificationResults,
            deploymentFile: files[0],
            notes: "PlayerVault、Hero、Relic 合約驗證記錄"
        };

        const verifyFilename = `pvh-verification-${new Date().toISOString().split('T')[0]}.json`;
        const verifyFilepath = path.join(deploymentsDir, verifyFilename);
        fs.writeFileSync(verifyFilepath, JSON.stringify(verificationRecord, null, 2));
        
        console.log("✅ 驗證記錄已保存:", verifyFilename);

        // 5. 顯示摘要
        console.log("\n" + "=" * 60);
        console.log("🎉 驗證完成摘要");
        console.log("=".repeat(60));
        
        Object.entries(verificationResults).forEach(([contract, result]) => {
            const statusEmoji = result.status === 'success' || result.status === 'already_verified' ? '✅' : '❌';
            console.log(`${statusEmoji} ${contract.padEnd(12)}: ${result.status} (${result.address})`);
        });

        // 檢查是否有失敗
        const hasFailures = Object.values(verificationResults).some(r => r.status === 'failed');
        if (hasFailures) {
            console.log("\n⚠️ 有合約驗證失敗，請檢查錯誤信息");
        }

        console.log("\n🔗 BSCscan 鏈接:");
        Object.entries(contracts).forEach(([name, contract]) => {
            console.log(`${name}: https://bscscan.com/address/${contract.address}`);
        });

        console.log("\n⚠️ 下一步:");
        console.log("請執行連接腳本: npm run connect-pvh");

        return verificationResults;
        
    } catch (error) {
        console.error("❌ 驗證過程發生錯誤:", error);
        
        // 保存錯誤記錄
        const errorRecord = {
            timestamp: Date.now(),
            date: new Date().toISOString(),
            error: error.message,
            results: verificationResults,
            notes: "驗證過程中發生錯誤"
        };
        
        const errorFilename = `pvh-verification-error-${new Date().toISOString().split('T')[0]}.json`;
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