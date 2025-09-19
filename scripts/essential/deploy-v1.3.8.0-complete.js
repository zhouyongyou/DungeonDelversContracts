// deploy-v1.3.8.0-complete.js - 完整的10個合約重新部署腳本
// 🎯 核心修復：DungeonStorage 獎勵金額使用18位小數格式
// 🚨 強制執行 0.11 gwei Gas Price - 絕對不可修改

const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

// 🚨 強制 Gas Price 0.11 gwei - 絕對不可修改  
const GAS_PRICE = ethers.parseUnits("0.11", "gwei");
const GAS_LIMIT = 8000000;

// 現有 DungeonCore 地址 (從環境變量讀取)
const EXISTING_DUNGEONCORE_ADDRESS = process.env.VITE_DUNGEONCORE_ADDRESS || process.env.DUNGEONCORE_ADDRESS || "0xa94b609310f8fe9a6db5cd66faaf64cd0189581f";

// BSC VRF v2.5 配置
const VRF_CONFIG = {
    coordinator: "0xd691f04bc0C9a24Edb78af9E005Cf85768F694C9",
    subscriptionId: "88422796721004450630713121079263696788635490871993157345476848872165866246915",
    keyHash: "0x130dba50ad435d4ecc214aad0d5820474137bd68e7e77724144f27c3c377d3d4"
};

// 部署配置
const DEPLOYMENT_CONFIG = {
    version: "v1.3.8.0",
    description: "修復DungeonStorage獎勵金額18位小數格式 + 10合約重新部署",
    network: "BSC Mainnet",
    gasPrice: "0.11 gwei",
    timestamp: new Date().toISOString()
};

// 合約部署順序和配置
const CONTRACT_CONFIGS = [
    // Phase 1: 基礎設施層
    {
        name: "DungeonStorage",
        path: "contracts/current/core/DungeonStorage.sol",
        constructorArgs: [], // 無參數構造函數
        phase: 1,
        description: "🗄️ 遊戲數據存儲合約 - 已修復獎勵金額18位小數"
    },
    {
        name: "VRFConsumerV2Plus", 
        path: "contracts/current/core/VRFConsumerV2Plus.sol",
        constructorArgs: [],
        phase: 1,
        description: "🎲 Chainlink VRF v2.5 隨機數服務"
    },
    
    // Phase 2: DeFi層
    {
        name: "PlayerVault",
        path: "contracts/current/defi/PlayerVault.sol", 
        constructorArgs: [],
        phase: 2,
        description: "🏦 玩家金庫和推薦系統"
    },
    
    // Phase 3: NFT資產層
    {
        name: "Hero",
        path: "contracts/current/nft/Hero.sol",
        constructorArgs: [],
        phase: 3, 
        description: "🦸 英雄NFT (ERC-721)"
    },
    {
        name: "Relic",
        path: "contracts/current/nft/Relic.sol",
        constructorArgs: [],
        phase: 3,
        description: "🏺 聖物NFT (ERC-721)"
    },
    {
        name: "Party", 
        path: "contracts/current/nft/Party.sol",
        constructorArgs: [],
        phase: 3,
        description: "👥 隊伍NFT (ERC-721)"
    },
    {
        name: "PlayerProfile",
        path: "contracts/current/nft/PlayerProfile.sol", 
        constructorArgs: [],
        phase: 3,
        description: "👤 玩家檔案SBT (Soul Bound Token)"
    },
    {
        name: "VIPStaking",
        path: "contracts/current/nft/VIPStaking.sol",
        constructorArgs: [],
        phase: 3,
        description: "💎 VIP質押SBT"
    },
    
    // Phase 4: 遊戲邏輯層
    {
        name: "AltarOfAscension",
        path: "contracts/current/core/AltarOfAscension.sol",
        constructorArgs: [],
        phase: 4,
        description: "⚡ NFT升級祭壇"
    },
    {
        name: "DungeonMaster",
        path: "contracts/current/core/DungeonMaster.sol", 
        constructorArgs: [],
        phase: 4,
        description: "🎮 地牢探險核心系統"
    }
];

// 部署結果存儲
let deploymentResults = {
    config: DEPLOYMENT_CONFIG,
    existingCore: EXISTING_DUNGEONCORE_ADDRESS,
    newContracts: {},
    verificationData: [],
    configurationSteps: []
};

async function executeTransaction(description, contractName, contract, methodName, args) {
    console.log(`\\n🔗 ${description}`);
    console.log(`合約: ${contractName} | 方法: ${methodName}`);
    
    try {
        const tx = await contract[methodName](...args, {
            gasPrice: GAS_PRICE,
            gasLimit: GAS_LIMIT
        });
        
        console.log(`📤 交易發送: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`✅ 交易確認於區塊: ${receipt.blockNumber}`);
        console.log(`⛽ Gas 使用: ${receipt.gasUsed.toString()}`);
        
        return { success: true, receipt, txHash: tx.hash };
    } catch (error) {
        console.error(`❌ 交易失敗: ${error.message}`);
        throw error;
    }
}

async function deployContract(config) {
    console.log(`\\n🚀 部署 ${config.name}`);
    console.log(`📍 ${config.description}`);
    console.log(`📁 路徑: ${config.path}`);
    
    try {
        // 獲取合約工廠
        const ContractFactory = await ethers.getContractFactory(config.name);
        
        // 部署合約
        const contract = await ContractFactory.deploy(...config.constructorArgs, {
            gasPrice: GAS_PRICE,
            gasLimit: GAS_LIMIT
        });
        
        console.log(`📤 部署交易: ${contract.deploymentTransaction().hash}`);
        console.log(`⏳ 等待確認...`);
        
        // 等待部署確認
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        
        console.log(`✅ ${config.name} 部署成功！`);
        console.log(`📍 地址: ${address}`);
        
        // 驗證合約大小
        const code = await ethers.provider.getCode(address);
        const sizeInBytes = (code.length - 2) / 2; // 減去 0x 前綴
        console.log(`📏 合約大小: ${sizeInBytes} bytes`);
        
        if (sizeInBytes > 24576) {
            console.log(`⚠️ 警告: 合約大小接近24KB限制`);
        }
        
        // 記錄部署結果
        deploymentResults.newContracts[config.name] = {
            address: address,
            deploymentHash: contract.deploymentTransaction().hash,
            constructorArgs: config.constructorArgs,
            size: sizeInBytes,
            phase: config.phase
        };
        
        // 準備驗證數據
        deploymentResults.verificationData.push({
            contractName: config.name,
            address: address,
            constructorArgs: config.constructorArgs,
            contractPath: config.path
        });
        
        return { contract, address };
        
    } catch (error) {
        console.error(`💥 ${config.name} 部署失敗:`, error.message);
        throw error;
    }
}

async function configureContracts() {
    console.log("\\n" + "=".repeat(60));
    console.log("🔧 第五階段：配置合約連接");
    console.log("=".repeat(60));
    
    const dungeonCore = await ethers.getContractAt("DungeonCore", EXISTING_DUNGEONCORE_ADDRESS);
    
    console.log(`\\n📋 配置現有 DungeonCore: ${EXISTING_DUNGEONCORE_ADDRESS}`);
    
    // 配置步驟列表
    const configSteps = [
        {
            method: "setDungeonStorage",
            args: [deploymentResults.newContracts.DungeonStorage.address],
            description: "設置 DungeonStorage 地址"
        },
        {
            method: "setVRFManager", 
            args: [deploymentResults.newContracts.VRFConsumerV2Plus.address],
            description: "設置 VRF Manager 地址"
        },
        {
            method: "setPlayerVault",
            args: [deploymentResults.newContracts.PlayerVault.address], 
            description: "設置 PlayerVault 地址"
        },
        {
            method: "setHeroContract",
            args: [deploymentResults.newContracts.Hero.address],
            description: "設置 Hero 合約地址"
        },
        {
            method: "setRelicContract", 
            args: [deploymentResults.newContracts.Relic.address],
            description: "設置 Relic 合約地址"
        },
        {
            method: "setPartyContract",
            args: [deploymentResults.newContracts.Party.address],
            description: "設置 Party 合約地址"
        },
        {
            method: "setPlayerProfile",
            args: [deploymentResults.newContracts.PlayerProfile.address], 
            description: "設置 PlayerProfile 地址"
        },
        {
            method: "setVipStaking",
            args: [deploymentResults.newContracts.VIPStaking.address],
            description: "設置 VIPStaking 地址"
        },
        {
            method: "setDungeonMaster", 
            args: [deploymentResults.newContracts.DungeonMaster.address],
            description: "設置 DungeonMaster 地址"
        },
        {
            method: "setAltarOfAscension",
            args: [deploymentResults.newContracts.AltarOfAscension.address],
            description: "設置 AltarOfAscension 地址"
        }
    ];
    
    // 執行 DungeonCore 配置
    for (const step of configSteps) {
        const result = await executeTransaction(
            step.description,
            "DungeonCore", 
            dungeonCore,
            step.method,
            step.args
        );
        
        deploymentResults.configurationSteps.push({
            step: step.description,
            txHash: result.txHash,
            status: "success"
        });
        
        // 等待1秒避免nonce衝突
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log("\\n🔄 配置所有新合約連接 DungeonCore...");
    
    // 反向配置：所有新合約連接到 DungeonCore
    const reverseConfigs = [
        { name: "DungeonStorage", method: "setDungeonCore" },
        { name: "PlayerVault", method: "setDungeonCore" },
        { name: "Hero", method: "setDungeonCore" },
        { name: "Relic", method: "setDungeonCore" },
        { name: "Party", method: "setDungeonCore" },
        { name: "PlayerProfile", method: "setDungeonCore" },
        { name: "VIPStaking", method: "setDungeonCore" },
        { name: "AltarOfAscension", method: "setDungeonCore" },
        { name: "DungeonMaster", method: "setDungeonCore" }
    ];
    
    for (const config of reverseConfigs) {
        const contractAddress = deploymentResults.newContracts[config.name].address;
        const contract = await ethers.getContractAt(config.name, contractAddress);
        
        const result = await executeTransaction(
            `${config.name} 連接到 DungeonCore`,
            config.name,
            contract, 
            config.method,
            [EXISTING_DUNGEONCORE_ADDRESS]
        );
        
        deploymentResults.configurationSteps.push({
            step: `${config.name}.${config.method}`,
            txHash: result.txHash, 
            status: "success"
        });
        
        // 等待1秒避免nonce衝突
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
}

async function verifyContracts() {
    console.log("\\n" + "=".repeat(60));
    console.log("📋 第六階段：準備合約驗證");
    console.log("=".repeat(60));
    
    console.log("\\n🔍 生成批量驗證腳本...");
    
    let verifyScript = `// verify-v1.3.8.0-contracts.js - 批量驗證腳本\\n`;
    verifyScript += `const { run } = require("hardhat");\\n\\n`;
    verifyScript += `async function verifyAll() {\\n`;
    
    for (const data of deploymentResults.verificationData) {
        verifyScript += `  // 驗證 ${data.contractName}\\n`;
        verifyScript += `  try {\\n`;
        verifyScript += `    await run("verify:verify", {\\n`;
        verifyScript += `      address: "${data.address}",\\n`;
        
        if (data.constructorArgs.length > 0) {
            verifyScript += `      constructorArguments: ${JSON.stringify(data.constructorArgs)},\\n`;
        }
        
        verifyScript += `    });\\n`;
        verifyScript += `    console.log("✅ ${data.contractName} 驗證成功");\\n`;
        verifyScript += `  } catch (error) {\\n`;
        verifyScript += `    console.error("❌ ${data.contractName} 驗證失敗:", error.message);\\n`;
        verifyScript += `  }\\n\\n`;
    }
    
    verifyScript += `}\\n\\nverifyAll().catch(console.error);`;
    
    // 儲存驗證腳本
    const verifyScriptPath = path.join(__dirname, `../verify-v1.3.8.0-contracts.js`);
    fs.writeFileSync(verifyScriptPath, verifyScript);
    
    console.log(`📁 驗證腳本已生成: ${verifyScriptPath}`);
}

async function main() {
    console.log("🚀 DungeonDelvers v1.3.8.0 完整部署開始");
    console.log("=".repeat(60)); 
    console.log(`📅 時間: ${DEPLOYMENT_CONFIG.timestamp}`);
    console.log(`🌐 網絡: ${DEPLOYMENT_CONFIG.network}`);
    console.log(`⛽ Gas Price: ${DEPLOYMENT_CONFIG.gasPrice}`);
    console.log(`📝 版本: ${DEPLOYMENT_CONFIG.version}`);
    console.log(`🎯 核心修復: ${DEPLOYMENT_CONFIG.description}`);
    
    const [deployer] = await ethers.getSigners();
    console.log(`\\n👤 部署者: ${deployer.address}`);
    
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log(`💰 餘額: ${ethers.formatEther(balance)} BNB`);
    
    // 檢查現有 DungeonCore
    console.log(`\\n🔍 現有 DungeonCore: ${EXISTING_DUNGEONCORE_ADDRESS}`);
    const coreCode = await ethers.provider.getCode(EXISTING_DUNGEONCORE_ADDRESS);
    if (coreCode === "0x") {
        throw new Error("❌ 現有 DungeonCore 地址無效！");
    }
    console.log("✅ 現有 DungeonCore 確認可用");
    
    try {
        // 按階段部署合約
        const phases = [1, 2, 3, 4];
        
        for (const phase of phases) {
            console.log(`\\n${"=".repeat(60)}`);
            console.log(`🔧 第${phase}階段部署`);
            console.log(`${"=".repeat(60)}`);
            
            const phaseContracts = CONTRACT_CONFIGS.filter(c => c.phase === phase);
            
            for (const config of phaseContracts) {
                await deployContract(config);
                
                // 階段內等待2秒
                if (phaseContracts.indexOf(config) < phaseContracts.length - 1) {
                    console.log("⏳ 等待 2 秒後繼續...");
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            // 階段間等待5秒
            if (phases.indexOf(phase) < phases.length - 1) {
                console.log("\\n⏳ 階段完成，等待 5 秒後繼續下一階段...");
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        
        // 配置合約連接
        await configureContracts();
        
        // 準備合約驗證
        await verifyContracts();
        
        // 保存部署結果
        const resultPath = path.join(__dirname, `../deployments/v1.3.8.0_deployment.json`);
        fs.writeFileSync(resultPath, JSON.stringify(deploymentResults, null, 2));
        
        console.log("\\n" + "=".repeat(60));
        console.log("🎉 部署完成摘要"); 
        console.log("=".repeat(60));
        
        console.log(`\\n📊 部署統計:`);
        console.log(`✅ 成功部署: ${Object.keys(deploymentResults.newContracts).length}/10 個合約`);
        console.log(`✅ 配置步驟: ${deploymentResults.configurationSteps.length} 個`);
        console.log(`✅ 繼續使用: DungeonCore ${EXISTING_DUNGEONCORE_ADDRESS}`);
        
        console.log(`\\n📋 新部署的合約地址:`);
        Object.entries(deploymentResults.newContracts).forEach(([name, data]) => {
            console.log(`${name.padEnd(20)}: ${data.address}`);
        });
        
        console.log(`\\n📁 結果文件:`);
        console.log(`- 部署結果: ${resultPath}`);
        console.log(`- 驗證腳本: scripts/verify-v1.3.8.0-contracts.js`);
        
        console.log(`\\n🔄 後續步驟:`);
        console.log(`1. 執行合約驗證: node scripts/verify-v1.3.8.0-contracts.js`);
        console.log(`2. 更新前端合約地址配置`);
        console.log(`3. 更新子圖合約地址和起始區塊`);
        console.log(`4. 更新後端合約地址配置`);
        console.log(`5. 測試探險功能確認獎勵正確`);
        
        console.log(`\\n🎯 預期效果:`);
        console.log(`- 地牢獎勵從 ~225,599 wei 增加到 ~225,599 * 1e18 wei`);
        console.log(`- $12 USD 獎勵將正確轉換為數百萬 SOUL`);
        console.log(`- Oracle 價格計算使用正確的18位小數格式`);
        
        console.log("\\n🚀 DungeonDelvers v1.3.8.0 部署成功完成！");
        
    } catch (error) {
        console.error("💥 部署過程發生錯誤:", error);
        
        // 儲存錯誤狀態
        deploymentResults.error = {
            message: error.message,
            timestamp: new Date().toISOString()
        };
        
        const errorPath = path.join(__dirname, `../deployments/v1.3.8.0_deployment_error.json`);
        fs.writeFileSync(errorPath, JSON.stringify(deploymentResults, null, 2));
        
        process.exit(1);
    }
}

// 錯誤處理
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
    });