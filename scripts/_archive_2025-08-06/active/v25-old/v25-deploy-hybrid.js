#!/usr/bin/env node

/**
 * V25 混合部署腳本
 * 使用原生 ethers.js 部署，但保留所有設置和配置功能
 */

require("dotenv").config();
const { ethers } = require("ethers");
const fs = require('fs');
const path = require('path');

// 從 v25-deploy-complete-sequential.js 導入所有功能
const V25Deployer = require('./v25-deploy-complete-sequential.js').V25Deployer;

// 自定義部署類，覆蓋有問題的方法
class V25HybridDeployer extends V25Deployer {
  async deploy() {
    console.log("V25 混合部署 - 使用原生 ethers.js\n");
    
    // 使用原生 ethers 創建 provider 和 wallet
    const provider = new ethers.JsonRpcProvider(
      process.env.BSC_MAINNET_RPC_URL || "https://bnb-mainnet.g.alchemy.com/v2/3lmTWjUVbFylAurhdU-rSUefTC-P4tKf"
    );
    
    this.deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    this.provider = provider;
    
    // 調用父類的部署流程，但使用我們的部署方法
    await super.deploy();
  }
  
  // 覆蓋部署合約方法，使用原生 ethers
  async deployContract(contractName) {
    const mappedName = this.constructor.CONTRACT_NAME_MAP[contractName];
    this.log(`\n部署 ${mappedName} (${contractName})...`, 'info');
    
    try {
      // 根據合約類型設置構造函數參數
      const constructorArgs = this.getConstructorArgs(contractName);
      const args = Array.isArray(constructorArgs) ? constructorArgs : [constructorArgs];
      this.log(`構造參數: ${JSON.stringify(args)}`, 'info');
      
      // 讀取合約 artifact
      const contractPath = path.join(
        __dirname, 
        "../../artifacts/contracts/current",
        this.getContractPath(contractName)
      );
      const contractJson = JSON.parse(fs.readFileSync(contractPath, "utf8"));
      
      // 使用原生 ethers ContractFactory
      const factory = new ethers.ContractFactory(
        contractJson.abi,
        contractJson.bytecode,
        this.deployer
      );
      
      // 部署
      this.log('發送部署交易...', 'info');
      const contract = await factory.deploy(...args);
      
      this.log(`交易 hash: ${contract.deploymentTransaction().hash}`, 'info');
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      this.contracts[mappedName] = { 
        address, 
        contract,
        contractName: contractName
      };
      
      this.log(`✅ ${mappedName} 部署成功: ${address}`, 'success');
      
      // 保存驗證數據
      this.verificationData.push({
        name: mappedName,
        contractName: contractName,
        address,
        constructorArgs: args
      });
      
    } catch (error) {
      this.log(`❌ ${mappedName} 部署失敗: ${error.message}`, 'error');
      throw error;
    }
  }
  
  // 合約路徑映射
  getContractPath(contractName) {
    const pathMap = {
      'Oracle': 'defi/Oracle.sol/Oracle.json',
      'Test_SoulShard': 'defi/SoulShard.sol/Test_SoulShard.json',
      'PlayerVault': 'defi/PlayerVault.sol/PlayerVault.json',
      'DungeonCore': 'core/DungeonCore.sol/DungeonCore.json',
      'DungeonStorage': 'core/DungeonStorage.sol/DungeonStorage.json',
      'DungeonMasterV2_Fixed': 'core/DungeonMaster.sol/DungeonMasterV2_Fixed.json',
      'Hero': 'nft/Hero.sol/Hero.json',
      'Relic': 'nft/Relic.sol/Relic.json',
      'Party': 'nft/Party.sol/Party.json',
      'VIPStaking': 'nft/VIPStaking.sol/VIPStaking.json',
      'PlayerProfile': 'nft/PlayerProfile.sol/PlayerProfile.json',
      'AltarOfAscensionV2Fixed': 'core/AltarOfAscension.sol/AltarOfAscensionV2Fixed.json'
    };
    
    return pathMap[contractName] || '';
  }
}

// 執行
async function main() {
  const deployer = new V25HybridDeployer();
  await deployer.deploy();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });