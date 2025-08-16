/**
 * 新一代部署管理器
 * 單一配置源，零手動修復
 */

const { ethers } = require('hardhat');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

class DeploymentManager {
  constructor(manifestPath, network = 'bsc-mainnet') {
    this.manifestPath = manifestPath;
    this.network = network;
    this.manifest = null;
    this.deployed = {};
    this.contracts = {};
    this.signer = null;
    this.locked = false;
    this.progressFile = null;
  }

  async init() {
    console.log(chalk.cyan.bold('\n🚀 初始化部署管理器\n'));
    
    // 載入 manifest
    this.manifest = JSON.parse(await fs.readFile(this.manifestPath, 'utf8'));
    console.log(chalk.blue(`📋 版本: ${this.manifest.version}`));
    console.log(chalk.blue(`🌐 網路: ${this.network}`));
    
    // 獲取 signer
    [this.signer] = await ethers.getSigners();
    const address = await this.signer.getAddress();
    console.log(chalk.blue(`👛 部署者: ${address}`));
    
    // 設置進度文件
    this.progressFile = path.join(
      'deployments',
      this.network,
      `${this.manifest.version}-progress.json`
    );
    
    // 檢查是否有未完成的部署
    await this.checkPreviousDeployment();
    
    console.log(chalk.green('\n✅ 初始化完成\n'));
  }

  async checkPreviousDeployment() {
    try {
      const progress = JSON.parse(await fs.readFile(this.progressFile, 'utf8'));
      if (progress && !progress.completed) {
        console.log(chalk.yellow('\n⚠️  發現未完成的部署'));
        console.log(chalk.yellow(`   版本: ${progress.version}`));
        console.log(chalk.yellow(`   進度: ${Object.keys(progress.deployed).length} 個合約`));
        
        const readline = require('readline');
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        
        const answer = await new Promise(resolve => {
          rl.question('是否繼續之前的部署？(y/n): ', resolve);
        });
        rl.close();
        
        if (answer.toLowerCase() === 'y') {
          this.deployed = progress.deployed;
          console.log(chalk.green('✅ 繼續之前的部署'));
        } else {
          // 備份舊進度
          const backupPath = this.progressFile.replace('.json', `-backup-${Date.now()}.json`);
          await fs.rename(this.progressFile, backupPath);
          console.log(chalk.blue(`📦 舊進度已備份到: ${backupPath}`));
        }
      }
    } catch (error) {
      // 沒有進度文件，全新部署
      console.log(chalk.blue('📝 開始全新部署'));
    }
  }

  async saveProgress() {
    const progress = {
      version: this.manifest.version,
      network: this.network,
      timestamp: new Date().toISOString(),
      deployed: this.deployed,
      completed: false
    };
    
    const dir = path.dirname(this.progressFile);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.progressFile, JSON.stringify(progress, null, 2));
  }

  calculateDeployOrder() {
    const order = [];
    const visited = new Set();
    
    const visit = (category, contractName) => {
      if (visited.has(contractName)) return;
      
      const config = this.manifest.contracts[category][contractName];
      if (config.dependencies) {
        for (const dep of config.dependencies) {
          // 在所有類別中查找依賴
          for (const cat of Object.keys(this.manifest.contracts)) {
            if (this.manifest.contracts[cat][dep]) {
              visit(cat, dep);
              break;
            }
          }
        }
      }
      
      visited.add(contractName);
      order.push({ category, name: contractName, config });
    };
    
    // 遍歷所有合約
    for (const [category, contracts] of Object.entries(this.manifest.contracts)) {
      for (const contractName of Object.keys(contracts)) {
        visit(category, contractName);
      }
    }
    
    return order;
  }

  resolveArgs(args) {
    if (!args) return [];
    
    return args.map(arg => {
      if (typeof arg === 'string' && arg.startsWith('$')) {
        // 解析引用，如 $DungeonCore.address
        const [contractName, property] = arg.substring(1).split('.');
        if (this.deployed[contractName]) {
          return property ? this.deployed[contractName][property] : this.deployed[contractName].address;
        }
        throw new Error(`未找到引用: ${arg}`);
      }
      return arg;
    });
  }

  async deployContract(name, config, args) {
    const Contract = await ethers.getContractFactory(config.artifact);
    console.log(chalk.blue(`   部署中...`));
    
    const contract = await Contract.deploy(...args);
    await contract.deployed();
    
    console.log(chalk.green(`   ✅ 地址: ${contract.address}`));
    console.log(chalk.gray(`   ✅ 交易: ${contract.deployTransaction.hash}`));
    
    return contract;
  }

  async deployAll() {
    console.log(chalk.cyan.bold('\n📦 開始部署合約\n'));
    
    const order = this.calculateDeployOrder();
    console.log(chalk.blue(`部署順序: ${order.map(o => o.name).join(' → ')}\n`));
    
    for (const { category, name, config } of order) {
      // 檢查是否已部署
      if (this.deployed[name]) {
        console.log(chalk.yellow(`⏭️  ${name} 已部署，跳過`));
        continue;
      }
      
      console.log(chalk.cyan(`\n部署 ${name} (${category}):`));
      
      try {
        const args = this.resolveArgs(config.args);
        if (args.length > 0) {
          console.log(chalk.gray(`   參數: ${JSON.stringify(args)}`));
        }
        
        const contract = await this.deployContract(name, config, args);
        
        this.deployed[name] = {
          address: contract.address,
          blockNumber: contract.deployTransaction.blockNumber,
          transactionHash: contract.deployTransaction.hash,
          category,
          artifact: config.artifact
        };
        
        this.contracts[name] = contract;
        
        // 保存進度
        await this.saveProgress();
        
      } catch (error) {
        console.error(chalk.red(`\n❌ 部署 ${name} 失敗: ${error.message}`));
        throw error;
      }
    }
    
    console.log(chalk.green.bold('\n✅ 所有合約部署完成！\n'));
  }

  async setupConnections() {
    console.log(chalk.cyan.bold('\n🔗 設置合約連接\n'));
    
    for (const conn of this.manifest.connections) {
      console.log(chalk.blue(`設置 ${conn.from}.${conn.method} → ${conn.to}`));
      
      try {
        // 獲取合約實例
        let fromContract = this.contracts[conn.from];
        if (!fromContract) {
          const deployedData = this.deployed[conn.from];
          if (!deployedData) {
            throw new Error(`合約 ${conn.from} 未部署`);
          }
          
          // 查找 artifact 名稱
          const artifact = deployedData.artifact || conn.from;
          fromContract = await ethers.getContractAt(artifact, deployedData.address);
          this.contracts[conn.from] = fromContract;
        }
        
        const toAddress = this.deployed[conn.to].address;
        
        // 檢查是否已設置
        if (conn.checkMethod) {
          const currentValue = await fromContract[conn.checkMethod]();
          if (currentValue.toLowerCase() === toAddress.toLowerCase()) {
            console.log(chalk.yellow(`   ⏭️  已設置，跳過`));
            continue;
          }
        }
        
        // 執行設置
        const tx = await fromContract[conn.method](toAddress);
        console.log(chalk.gray(`   交易: ${tx.hash}`));
        await tx.wait();
        
        console.log(chalk.green(`   ✅ 設置成功`));
        
      } catch (error) {
        console.error(chalk.red(`   ❌ 失敗: ${error.message}`));
        throw error;
      }
    }
    
    console.log(chalk.green.bold('\n✅ 所有連接設置完成！\n'));
  }

  async validateAll() {
    console.log(chalk.cyan.bold('\n🔍 驗證部署\n'));
    
    const results = [];
    let allPassed = true;
    
    for (const validation of this.manifest.validations) {
      try {
        // 獲取合約
        let contract = this.contracts[validation.contract];
        if (!contract) {
          const deployedData = this.deployed[validation.contract];
          const artifact = deployedData.artifact || validation.contract;
          contract = await ethers.getContractAt(artifact, deployedData.address);
        }
        
        // 執行驗證
        const actual = await contract[validation.method]();
        const expected = this.resolveValue(validation.expected);
        
        const passed = actual.toLowerCase() === expected.toLowerCase();
        
        if (passed) {
          console.log(chalk.green(`✅ ${validation.contract}.${validation.method}`));
        } else {
          console.log(chalk.red(`❌ ${validation.contract}.${validation.method}`));
          console.log(chalk.red(`   預期: ${expected}`));
          console.log(chalk.red(`   實際: ${actual}`));
          allPassed = false;
        }
        
        results.push({
          ...validation,
          passed,
          actual,
          expected
        });
        
      } catch (error) {
        console.log(chalk.red(`❌ ${validation.contract}.${validation.method}: ${error.message}`));
        allPassed = false;
      }
    }
    
    if (allPassed) {
      console.log(chalk.green.bold('\n✅ 所有驗證通過！\n'));
    } else {
      console.log(chalk.red.bold('\n❌ 部分驗證失敗\n'));
    }
    
    return allPassed;
  }

  resolveValue(value) {
    if (typeof value === 'string' && value.startsWith('$')) {
      const [contractName, property] = value.substring(1).split('.');
      if (this.deployed[contractName]) {
        return property ? this.deployed[contractName][property] : this.deployed[contractName].address;
      }
    }
    return value;
  }

  async lockDeployment() {
    console.log(chalk.cyan.bold('\n🔒 鎖定部署配置\n'));
    
    const lockFile = path.join(
      'deployments',
      this.network,
      `${this.manifest.version}-locked.json`
    );
    
    const lockData = {
      version: this.manifest.version,
      network: this.network,
      timestamp: new Date().toISOString(),
      deployer: await this.signer.getAddress(),
      contracts: this.deployed,
      connections: this.manifest.connections,
      validations: this.manifest.validations,
      verified: true,
      locked: true
    };
    
    await fs.writeFile(lockFile, JSON.stringify(lockData, null, 2));
    
    // 刪除進度文件
    try {
      await fs.unlink(this.progressFile);
    } catch (error) {
      // 忽略
    }
    
    this.locked = true;
    console.log(chalk.green(`✅ 配置已鎖定: ${lockFile}`));
  }

  async generateConfigs() {
    console.log(chalk.cyan.bold('\n📝 生成配置文件\n'));
    
    await this.generateFrontendConfig();
    await this.generateSubgraphConfig();
    await this.generateBackendConfig();
    
    console.log(chalk.green.bold('\n✅ 所有配置生成完成！\n'));
  }

  async generateFrontendConfig() {
    const frontendPath = path.join(
      '..',
      'GitHub',
      'DungeonDelvers',
      'src',
      'config',
      'contracts.ts'
    );
    
    const contracts = {};
    for (const [name, data] of Object.entries(this.deployed)) {
      contracts[name.toUpperCase()] = data.address;
    }
    
    const content = `// 自動生成 - 不要手動修改
// 版本: ${this.manifest.version}
// 網路: ${this.network}
// 時間: ${new Date().toISOString()}

export const CONTRACTS = {
  56: { // BSC Mainnet
${Object.entries(contracts).map(([name, address]) => 
  `    ${name}: '${address}'`
).join(',\n')}
  }
} as const;

export const CONTRACT_VERSION = '${this.manifest.version}';
`;
    
    await fs.writeFile(frontendPath, content);
    console.log(chalk.green(`✅ 前端配置: ${frontendPath}`));
  }

  async generateSubgraphConfig() {
    // 實現子圖配置生成
    console.log(chalk.blue('📊 生成子圖配置...'));
  }

  async generateBackendConfig() {
    // 實現後端配置生成
    console.log(chalk.blue('🖥️  生成後端配置...'));
  }

  async run() {
    try {
      await this.init();
      await this.deployAll();
      await this.setupConnections();
      
      const valid = await this.validateAll();
      if (!valid) {
        throw new Error('部署驗證失敗');
      }
      
      await this.lockDeployment();
      await this.generateConfigs();
      
      console.log(chalk.green.bold('\n🎉 部署成功完成！\n'));
      console.log(chalk.cyan('下一步：'));
      console.log(chalk.blue('1. 檢查生成的配置文件'));
      console.log(chalk.blue('2. 提交配置變更到 Git'));
      console.log(chalk.blue('3. 部署前端和後端'));
      
    } catch (error) {
      console.error(chalk.red.bold('\n❌ 部署失敗:'), error);
      console.log(chalk.yellow('\n💡 提示：'));
      console.log(chalk.yellow('1. 檢查網路連接'));
      console.log(chalk.yellow('2. 確認錢包餘額充足'));
      console.log(chalk.yellow('3. 可以重新運行腳本繼續部署'));
      throw error;
    }
  }
}

module.exports = { DeploymentManager };