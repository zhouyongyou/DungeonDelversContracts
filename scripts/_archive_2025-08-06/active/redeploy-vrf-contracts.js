const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const BSC_RPC_URL = "https://bsc-dataseed1.binance.org/";

// 創建 provider 和 wallet
const provider = new ethers.JsonRpcProvider(BSC_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// VRFManager 地址
const VRF_MANAGER_ADDRESS = "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD";

// 合約部署函數
async function deployContract(wallet, contractName, ...args) {
    console.log(`\n部署 ${contractName}...`);
    
    const artifactPath = path.join(__dirname, "..", "..", "artifacts", "contracts", "current");
    let contractJson;
    
    // 根據合約名稱找到對應的 artifact
    if (contractName === "Hero") {
        contractJson = require(path.join(artifactPath, "nft", "Hero.sol", "Hero.json"));
    } else if (contractName === "Relic") {
        contractJson = require(path.join(artifactPath, "nft", "Relic.sol", "Relic.json"));
    } else if (contractName === "DungeonMaster") {
        contractJson = require(path.join(artifactPath, "core", "DungeonMaster.sol", "DungeonMaster.json"));
    } else if (contractName === "AltarOfAscension") {
        contractJson = require(path.join(artifactPath, "core", "AltarOfAscension.sol", "AltarOfAscension.json"));
    }
    
    const factory = new ethers.ContractFactory(
        contractJson.abi,
        contractJson.bytecode,
        wallet
    );
    
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    
    const address = await contract.getAddress();
    console.log(`${contractName} 部署成功: ${address}`);
    
    return address;
}

async function main() {
    console.log("🚀 開始重新部署 VRF 合約（修正版）");
    console.log("錢包地址:", wallet.address);
    
    const balance = await provider.getBalance(wallet.address);
    console.log("錢包餘額:", ethers.formatEther(balance), "BNB");
    
    const deployedContracts = {};
    
    try {
        // 1. 部署 Hero
        console.log("\n========== 部署 Hero ==========");
        deployedContracts.Hero = await deployContract(
            wallet,
            "Hero",
            wallet.address
        );
        
        // 2. 部署 Relic
        console.log("\n========== 部署 Relic ==========");
        deployedContracts.Relic = await deployContract(
            wallet,
            "Relic",
            wallet.address
        );
        
        // 3. 部署 DungeonMaster
        console.log("\n========== 部署 DungeonMaster ==========");
        deployedContracts.DungeonMaster = await deployContract(
            wallet,
            "DungeonMaster",
            wallet.address
        );
        
        // 4. 部署 AltarOfAscension
        console.log("\n========== 部署 AltarOfAscension ==========");
        deployedContracts.AltarOfAscension = await deployContract(
            wallet,
            "AltarOfAscension",
            wallet.address
        );
        
        // 保存部署結果
        const timestamp = new Date().toISOString();
        const deploymentRecord = {
            timestamp,
            network: "BSC Mainnet",
            contracts: deployedContracts,
            vrfManager: VRF_MANAGER_ADDRESS,
            deployedBy: wallet.address
        };
        
        fs.writeFileSync(
            `deployment-vrf-fixed-${Date.now()}.json`,
            JSON.stringify(deploymentRecord, null, 2)
        );
        
        console.log("\n✅ 所有 VRF 合約部署成功！");
        console.log("\n📝 部署總結:");
        console.log(`Hero: ${deployedContracts.Hero}`);
        console.log(`Relic: ${deployedContracts.Relic}`);
        console.log(`DungeonMaster: ${deployedContracts.DungeonMaster}`);
        console.log(`AltarOfAscension: ${deployedContracts.AltarOfAscension}`);
        console.log(`VRFManager: ${VRF_MANAGER_ADDRESS}`);
        
        console.log("\n⚠️ 下一步:");
        console.log("1. 在 VRFManager 授權這些合約");
        console.log("2. 在各合約設置 VRFManager 地址");
        console.log("3. 設置 DungeonCore 連接");
        console.log("4. 初始化地城數據");
        
        // 創建設置腳本
        const setupScript = `
// 設置 VRF 連接
const vrfManagerAddress = "${VRF_MANAGER_ADDRESS}";
const heroAddress = "${deployedContracts.Hero}";
const relicAddress = "${deployedContracts.Relic}";
const dungeonMasterAddress = "${deployedContracts.DungeonMaster}";
const altarAddress = "${deployedContracts.AltarOfAscension}";

// 在 VRFManager 授權合約
await vrfManager.authorizeContract(heroAddress);
await vrfManager.authorizeContract(relicAddress);
await vrfManager.authorizeContract(dungeonMasterAddress);
await vrfManager.authorizeContract(altarAddress);

// 在各合約設置 VRFManager
await hero.setVRFManager(vrfManagerAddress);
await relic.setVRFManager(vrfManagerAddress);
await dungeonMaster.setVRFManager(vrfManagerAddress);
await altar.setVRFManager(vrfManagerAddress);
`;
        
        fs.writeFileSync("setup-vrf-connections-fixed.js", setupScript);
        console.log("\n📝 設置腳本已生成: setup-vrf-connections-fixed.js");
        
    } catch (error) {
        console.error("\n❌ 部署失敗:", error);
        throw error;
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });