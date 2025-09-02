// verify-v25-deployed-contracts.js - 驗證已部署的9個合約
// 根據實際部署的合約地址進行BSCScan驗證

const hre = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔍 V25.2.2 合約驗證\n");
    
    // 根據區塊鏈記錄的實際部署地址（已從BSCScan確認）
    const deployedContracts = {
        // 按照部署順序
        AltarOfAscension: "0x3146E1026c134f098cAf15C4e3c2b751A357D77c",
        DungeonMaster: "0x0256aeceC4D93EF13e14237Ab5C63d2DD3EEe2be",
        DungeonStorage: "0x474ee307d9Cd81670a4773E4E9A124853fa51Db0",
        Relic: "0x5B967D67C7cbBcBA140820757C670c99c61EE530",
        Hero: "0x3052ab6c5b307478d943beba63efcdd97aecb526",
        PlayerProfile: "0xc869e2dcc64f76149e8392a0735b76bcfe79669a",
        VIPStaking: "0xacce5647880211c07d17eeae49364bb7db36aa3c",
        Party: "0x3cfed1ac185f66830342a9a796cb5bb4ef611fe6",
        PlayerVault: "0x6a3fb49538c58cbeb537daf12c276cbc97c6e8ec"
    };
    
    console.log("=".repeat(60));
    console.log("📋 待驗證合約清單:");
    console.log("=".repeat(60));
    
    const verifyQueue = [];
    
    // 準備驗證隊列
    for (const [name, address] of Object.entries(deployedContracts)) {
        if (address) {
            console.log(`${name}: ${address}`);
            verifyQueue.push({ 
                name: name, 
                address: address, 
                constructorArgs: [] 
            });
        }
    }
    
    console.log("\n⚠️ 請先從BSCScan確認所有合約地址");
    console.log("交易哈希列表:");
    console.log("1. 0x99340f0ad5770fa8102d8044f1e50373e626ed0ce8721a729e48b8111d1f9815");
    console.log("2. 0xd4b4f731961eae44e5cd2b056665ee0500122f21a2dfcb02935e0461176b17fc");
    console.log("3. 0x2814e609735be060820f3fb5532b9ceffe1aeb78f773381176163d01bc4bc0af");
    console.log("4. 0x1902b7237d76f150b6c09700546b5f714bf0c374706a596e4972062f812c5285");
    console.log("5. 0xad40abeae79c3b9aee0164a8ad0dfe677786e0c22b79e81c67d3ddebde03e45b");
    console.log("6. 0xb74effd03199d8744855afdd9fd7e56b83846f84be278e5034d189414c8daa37");
    console.log("7. 0x9e00308a581593cca851409d834f580066863480488215a042decbb23fc84987");
    console.log("8. 0x7d4aeba07c310015ce5919f1dc1e629f99f018ac7197c03a302fdb84f1938d92");
    console.log("9. 0xeb760ba269c9e44c0d6fdfb524e322af0b63d376b1934b6311b8c0139340be99");
    
    if (verifyQueue.length === 0) {
        console.log("\n❌ 請先更新合約地址後再執行驗證");
        return;
    }
    
    console.log("\n開始驗證 " + verifyQueue.length + " 個合約...");
    console.log("按 Ctrl+C 取消，或等待 3 秒開始驗證...");
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log("\n" + "=".repeat(50));
    console.log("🔍 開始 BSCScan 驗證");
    console.log("=".repeat(50));
    
    const verificationResults = {};
    
    for (let i = 0; i < verifyQueue.length; i++) {
        const contract = verifyQueue[i];
        console.log(`\n📋 [${i + 1}/${verifyQueue.length}] 驗證 ${contract.name}...`);
        console.log(`   地址: ${contract.address}`);
        
        try {
            await hre.run("verify:verify", {
                address: contract.address,
                constructorArguments: contract.constructorArgs,
            });
            console.log(`   ✅ ${contract.name} 驗證成功`);
            verificationResults[contract.name] = "成功";
        } catch (error) {
            if (error.message.includes("already verified")) {
                console.log(`   ✅ ${contract.name} 已驗證過`);
                verificationResults[contract.name] = "已驗證";
            } else {
                console.log(`   ❌ ${contract.name} 驗證失敗:`, error.message);
                verificationResults[contract.name] = `失敗: ${error.message}`;
            }
        }
        
        // 防止API限制
        if (i < verifyQueue.length - 1) {
            console.log("   ⏳ 等待 3 秒避免API限制...");
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
    
    // 保存驗證結果
    const verificationReport = {
        version: "V25.2.2",
        timestamp: new Date().toISOString(),
        contracts: deployedContracts,
        verificationResults: verificationResults,
        blockNumber: await hre.ethers.provider.getBlockNumber()
    };
    
    const deploymentDir = path.join(__dirname, '../deployments');
    if (!fs.existsSync(deploymentDir)) {
        fs.mkdirSync(deploymentDir, { recursive: true });
    }
    
    const timestamp = Date.now();
    const resultFile = path.join(deploymentDir, `v25-verification-result-${timestamp}.json`);
    fs.writeFileSync(resultFile, JSON.stringify(verificationReport, null, 2));
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 驗證完成！");
    console.log("=".repeat(60));
    
    console.log("\n📊 驗證統計:");
    for (const [name, result] of Object.entries(verificationResults)) {
        const icon = result === "成功" || result === "已驗證" ? "✅" : "❌";
        console.log(`   ${icon} ${name}: ${result}`);
    }
    
    console.log(`\n💾 結果文件: v25-verification-result-${timestamp}.json`);
    console.log(`📦 當前區塊: ${await hre.ethers.provider.getBlockNumber()}`);
    
    console.log("\n✨ V25.2.2 合約驗證完成！");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });