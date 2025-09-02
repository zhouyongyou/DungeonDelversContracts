// setup-v25-interconnections.js
// 互連設置腳本 - 設置 V25 合約之間的所有必要連接
// 基於實際合約代碼分析，確保所有合約能夠正確互相調用

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔗 開始 V25 合約互連設置流程");
    console.log("=" + "=".repeat(60));
    
    const [signer] = await ethers.getSigners();
    console.log("👤 設置操作者:", signer.address);
    console.log("💰 操作者餘額:", ethers.formatEther(await ethers.provider.getBalance(signer.address)), "BNB");
    
    // 網路驗證
    const network = await ethers.provider.getNetwork();
    console.log("🌐 目標網路:", network.name, "Chain ID:", network.chainId.toString());
    
    // 載入合約地址 - 支持多種來源
    let contractAddresses = {};
    
    // 1. 優先從環境變數載入
    const contractNames = [
        'DUNGEONCORE', 'ALTAROFASCENSION', 'DUNGEONMASTER', 
        'VRFCONSUMERV2PLUS', 'RELIC', 'HERO', 
        'PLAYERPROFILE', 'VIPSTAKING', 'PARTY',
        'PLAYERVAULT', 'DUNGEONSTORAGE', 'ORACLE'
    ];
    
    contractNames.forEach(name => {
        const address = process.env[`${name}_ADDRESS`];
        if (address) {
            contractAddresses[name] = address;
        }
    });
    
    // 2. 或從最新部署文件載入
    if (Object.keys(contractAddresses).length < 5) { // 如果環境變數不足，從文件載入
        try {
            const deploymentsDir = path.join(__dirname, '../deployments');
            if (fs.existsSync(deploymentsDir)) {
                const files = fs.readdirSync(deploymentsDir)
                    .filter(f => f.startsWith('v25-') && f.endsWith('.json'))
                    .sort()
                    .reverse();
                
                if (files.length > 0) {
                    const latestFile = files[0];
                    const deploymentData = JSON.parse(
                        fs.readFileSync(path.join(deploymentsDir, latestFile))
                    );
                    
                    // 將部署數據轉換為地址映射
                    if (deploymentData.contracts) {
                        Object.entries(deploymentData.contracts).forEach(([name, data]) => {
                            if (typeof data === 'object' && data.address) {
                                contractAddresses[name.toUpperCase()] = data.address;
                            } else if (typeof data === 'string') {
                                contractAddresses[name.toUpperCase()] = data;
                            }
                        });
                    }
                    
                    console.log("📂 從部署文件載入地址:", latestFile);
                }
            }
        } catch (error) {
            console.log("⚠️  無法從部署文件載入地址:", error.message);
        }
    }
    
    console.log("\n📋 合約地址清單:");
    Object.entries(contractAddresses).forEach(([name, address]) => {
        console.log(`  ${name}:`, address);
    });
    
    if (Object.keys(contractAddresses).length < 3) {
        throw new Error("❌ 合約地址不足。請確保已正確部署合約或設置環境變數。");
    }
    
    // 獲取合約實例
    const contracts = {};
    const errors = [];
    
    try {
        console.log("\n🏭 創建合約實例...");
        
        // DungeonCore - 核心中樞
        if (contractAddresses.DUNGEONCORE) {
            contracts.dungeonCore = await ethers.getContractAt("DungeonCore", contractAddresses.DUNGEONCORE);
            console.log("✅ DungeonCore 實例已創建");
        }
        
        // VRF Consumer
        if (contractAddresses.VRFCONSUMERV2PLUS) {
            contracts.vrfConsumer = await ethers.getContractAt("VRFConsumerV2Plus", contractAddresses.VRFCONSUMERV2PLUS);
            console.log("✅ VRFConsumerV2Plus 實例已創建");
        }
        
        // NFT 合約
        if (contractAddresses.HERO) {
            contracts.hero = await ethers.getContractAt("Hero", contractAddresses.HERO);
            console.log("✅ Hero 實例已創建");
        }
        
        if (contractAddresses.RELIC) {
            contracts.relic = await ethers.getContractAt("Relic", contractAddresses.RELIC);
            console.log("✅ Relic 實例已創建");
        }
        
        if (contractAddresses.PARTY) {
            contracts.party = await ethers.getContractAt("Party", contractAddresses.PARTY);
            console.log("✅ Party 實例已創建");
        }
        
        if (contractAddresses.PLAYERPROFILE) {
            contracts.playerProfile = await ethers.getContractAt("PlayerProfile", contractAddresses.PLAYERPROFILE);
            console.log("✅ PlayerProfile 實例已創建");
        }
        
        if (contractAddresses.VIPSTAKING) {
            contracts.vipStaking = await ethers.getContractAt("VIPStaking", contractAddresses.VIPSTAKING);
            console.log("✅ VIPStaking 實例已創建");
        }
        
        // 遊戲邏輯合約
        if (contractAddresses.DUNGEONMASTER) {
            contracts.dungeonMaster = await ethers.getContractAt("DungeonMaster", contractAddresses.DUNGEONMASTER);
            console.log("✅ DungeonMaster 實例已創建");
        }
        
        if (contractAddresses.ALTAROFASCENSION) {
            contracts.altar = await ethers.getContractAt("AltarOfAscension", contractAddresses.ALTAROFASCENSION);
            console.log("✅ AltarOfAscension 實例已創建");
        }
        
    } catch (error) {
        console.error("❌ 創建合約實例失敗:", error.message);
        errors.push(`合約實例創建失敗: ${error.message}`);
    }
    
    // === 開始設置互連 ===
    console.log("\n" + "=".repeat(60));
    console.log("🔗 開始設置合約互連");
    console.log("=".repeat(60));
    
    const results = {
        successful: [],
        failed: [],
        skipped: []
    };
    
    // Helper function for safe transaction execution
    async function safeExecute(description, contractMethod, ...args) {
        try {
            console.log(`\n🔄 ${description}...`);
            
            // 檢查是否已經設置正確
            let needsUpdate = true;
            try {
                // 根據不同合約檢查當前狀態
                if (description.includes("DungeonCore")) {
                    // DungeonCore 設置檢查會根據具體情況實現
                }
                // 其他檢查可以在這裡添加
            } catch (checkError) {
                // 如果檢查失敗，假設需要更新
            }
            
            if (needsUpdate) {
                const tx = await contractMethod(...args);
                console.log(`   交易已發送: ${tx.hash}`);
                
                const receipt = await tx.wait();
                console.log(`   Gas 使用: ${receipt.gasUsed.toString()}`);
                console.log(`✅ ${description} 完成`);
                
                results.successful.push(description);
            } else {
                console.log(`ℹ️  ${description} 已正確設置，跳過`);
                results.skipped.push(description);
            }
            
        } catch (error) {
            console.error(`❌ ${description} 失敗: ${error.message}`);
            results.failed.push(`${description}: ${error.message}`);
        }
    }
    
    // === Phase 1: 設置 DungeonCore 中的合約地址 ===
    if (contracts.dungeonCore) {
        console.log("\n📍 Phase 1: 配置 DungeonCore 合約註冊");
        
        // 設置 Hero 合約
        if (contracts.hero) {
            await safeExecute(
                "DungeonCore → Hero 註冊",
                contracts.dungeonCore.setHeroContract.bind(contracts.dungeonCore),
                contractAddresses.HERO
            );
        }
        
        // 設置 Relic 合約
        if (contracts.relic) {
            await safeExecute(
                "DungeonCore → Relic 註冊",
                contracts.dungeonCore.setRelicContract.bind(contracts.dungeonCore),
                contractAddresses.RELIC
            );
        }
        
        // 設置 Party 合約
        if (contracts.party) {
            await safeExecute(
                "DungeonCore → Party 註冊",
                contracts.dungeonCore.setPartyContract.bind(contracts.dungeonCore),
                contractAddresses.PARTY
            );
        }
        
        // 設置 PlayerProfile 合約
        if (contracts.playerProfile) {
            await safeExecute(
                "DungeonCore → PlayerProfile 註冊",
                contracts.dungeonCore.setPlayerProfile.bind(contracts.dungeonCore),
                contractAddresses.PLAYERPROFILE
            );
        }
        
        // 設置 VIPStaking 合約
        if (contracts.vipStaking) {
            await safeExecute(
                "DungeonCore → VIPStaking 註冊",
                contracts.dungeonCore.setVipStaking.bind(contracts.dungeonCore),
                contractAddresses.VIPSTAKING
            );
        }
        
        // 設置 DungeonMaster 合約
        if (contracts.dungeonMaster) {
            await safeExecute(
                "DungeonCore → DungeonMaster 註冊",
                contracts.dungeonCore.setDungeonMaster.bind(contracts.dungeonCore),
                contractAddresses.DUNGEONMASTER
            );
        }
        
        // 設置 AltarOfAscension 合約
        if (contracts.altar) {
            await safeExecute(
                "DungeonCore → AltarOfAscension 註冊",
                contracts.dungeonCore.setAltarOfAscension.bind(contracts.dungeonCore),
                contractAddresses.ALTAROFASCENSION
            );
        }
        
        // 設置 VRF Manager
        if (contracts.vrfConsumer) {
            await safeExecute(
                "DungeonCore → VRF Manager 註冊",
                contracts.dungeonCore.setVRFManager.bind(contracts.dungeonCore),
                contractAddresses.VRFCONSUMERV2PLUS
            );
        }
        
        // 設置其他核心地址
        if (contractAddresses.PLAYERVAULT) {
            await safeExecute(
                "DungeonCore → PlayerVault 註冊",
                contracts.dungeonCore.setPlayerVault.bind(contracts.dungeonCore),
                contractAddresses.PLAYERVAULT
            );
        }
        
        if (contractAddresses.ORACLE) {
            await safeExecute(
                "DungeonCore → Oracle 註冊",
                contracts.dungeonCore.setOracle.bind(contracts.dungeonCore),
                contractAddresses.ORACLE
            );
        }
    }
    
    // === Phase 2: 各合約設置 DungeonCore 連接 ===
    console.log("\n📍 Phase 2: 各合約連接到 DungeonCore");
    
    if (contractAddresses.DUNGEONCORE) {
        // Hero → DungeonCore
        if (contracts.hero) {
            await safeExecute(
                "Hero → DungeonCore 連接",
                contracts.hero.setDungeonCore.bind(contracts.hero),
                contractAddresses.DUNGEONCORE
            );
        }
        
        // Relic → DungeonCore
        if (contracts.relic) {
            await safeExecute(
                "Relic → DungeonCore 連接",
                contracts.relic.setDungeonCore.bind(contracts.relic),
                contractAddresses.DUNGEONCORE
            );
        }
        
        // Party → DungeonCore
        if (contracts.party) {
            await safeExecute(
                "Party → DungeonCore 連接",
                contracts.party.setDungeonCore.bind(contracts.party),
                contractAddresses.DUNGEONCORE
            );
        }
        
        // PlayerProfile → DungeonCore
        if (contracts.playerProfile) {
            await safeExecute(
                "PlayerProfile → DungeonCore 連接",
                contracts.playerProfile.setDungeonCore.bind(contracts.playerProfile),
                contractAddresses.DUNGEONCORE
            );
        }
        
        // VIPStaking → DungeonCore
        if (contracts.vipStaking) {
            await safeExecute(
                "VIPStaking → DungeonCore 連接",
                contracts.vipStaking.setDungeonCore.bind(contracts.vipStaking),
                contractAddresses.DUNGEONCORE
            );
        }
        
        // DungeonMaster → DungeonCore
        if (contracts.dungeonMaster) {
            await safeExecute(
                "DungeonMaster → DungeonCore 連接",
                contracts.dungeonMaster.setDungeonCore.bind(contracts.dungeonMaster),
                contractAddresses.DUNGEONCORE
            );
        }
        
        // AltarOfAscension → DungeonCore
        if (contracts.altar) {
            await safeExecute(
                "AltarOfAscension → DungeonCore 連接",
                contracts.altar.setDungeonCore.bind(contracts.altar),
                contractAddresses.DUNGEONCORE
            );
        }
    }
    
    // === Phase 3: VRF Manager 設置 ===
    console.log("\n📍 Phase 3: VRF Manager 特殊設置");
    
    if (contracts.vrfConsumer && contractAddresses.DUNGEONCORE) {
        await safeExecute(
            "VRF Manager → DungeonCore 連接",
            contracts.vrfConsumer.setDungeonCore.bind(contracts.vrfConsumer),
            contractAddresses.DUNGEONCORE
        );
    }
    
    // === 設置總結 ===
    console.log("\n" + "=".repeat(60));
    console.log("📊 互連設置完成總結");
    console.log("=".repeat(60));
    
    console.log(`✅ 成功設置: ${results.successful.length} 個連接`);
    console.log(`ℹ️  跳過設置: ${results.skipped.length} 個連接`);
    console.log(`❌ 設置失敗: ${results.failed.length} 個連接`);
    
    if (results.successful.length > 0) {
        console.log("\n✅ 成功設置的連接:");
        results.successful.forEach(item => console.log(`  - ${item}`));
    }
    
    if (results.skipped.length > 0) {
        console.log("\n⏭️  跳過的連接:");
        results.skipped.forEach(item => console.log(`  - ${item}`));
    }
    
    if (results.failed.length > 0) {
        console.log("\n❌ 失敗的連接:");
        results.failed.forEach(item => console.log(`  - ${item}`));
    }
    
    // 保存設置記錄
    const setupRecord = {
        timestamp: new Date().toISOString(),
        network: {
            name: network.name,
            chainId: network.chainId.toString()
        },
        signer: signer.address,
        contractAddresses,
        results,
        totalErrors: errors
    };
    
    const recordPath = `deployments/v25-interconnection-setup-${Date.now()}.json`;
    fs.writeFileSync(recordPath, JSON.stringify(setupRecord, null, 2));
    console.log("\n💾 設置記錄已保存:", recordPath);
    
    // 最終檢查建議
    console.log("\n🔧 建議的驗證步驟:");
    console.log("1. 檢查 DungeonCore 中是否正確註冊了所有合約地址");
    console.log("2. 測試 NFT 鑄造功能");
    console.log("3. 測試 VRF 隨機數生成");
    console.log("4. 測試地城探索功能");
    console.log("5. 測試升星功能");
    
    if (results.failed.length === 0) {
        console.log("\n🎉 所有互連設置完成！系統已準備就緒。");
    } else {
        console.log("\n⚠️  部分設置失敗，請檢查錯誤信息並手動修復。");
    }
    
    return setupRecord;
}

// 錯誤處理
main()
    .then((setupRecord) => {
        const failedCount = setupRecord.results.failed.length;
        
        if (failedCount > 0) {
            console.log(`\n⚠️  有 ${failedCount} 個連接設置失敗`);
            process.exit(0); // 不完全失敗，因為部分設置可能成功
        } else {
            console.log("\n🎉 所有互連設置完成!");
            process.exit(0);
        }
    })
    .catch((error) => {
        console.error("\n💥 互連設置流程失敗:");
        console.error(error);
        
        console.log("\n🔧 問題排查指引:");
        console.log("1. 檢查所有合約地址是否正確");
        console.log("2. 確認操作者帳戶有足夠的權限 (Owner)");
        console.log("3. 檢查操作者帳戶有足夠的 BNB 支付 Gas 費");
        console.log("4. 確認所有合約已正確部署");
        console.log("5. 檢查網路連接");
        
        process.exit(1);
    });