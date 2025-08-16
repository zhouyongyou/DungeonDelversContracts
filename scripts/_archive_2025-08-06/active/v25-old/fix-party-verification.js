/**
 * 修復 Party 合約驗證問題
 * 
 * 問題描述：
 * - Party 合約使用 dungeonCoreContract 作為變數名
 * - 其他合約使用 dungeonCore 作為變數名
 * - 驗證邏輯需要區分不同的合約類型
 * 
 * 使用方式：
 * npx hardhat run scripts/active/fix-party-verification.js --network bsc
 */

const hre = require("hardhat");

class PartyVerificationFixer {
  constructor() {
    this.contracts = {};
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    const color = colors[type] || colors.info;
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
  }

  async loadContracts() {
    this.log('載入合約配置...', 'info');
    
    try {
      const config = require('../../config/v25-config.js');
      
      // 載入 Party 合約
      if (config.contracts.PARTY) {
        const PartyFactory = await hre.ethers.getContractFactory("Party");
        this.contracts.PARTY = {
          address: config.contracts.PARTY.address,
          contract: PartyFactory.attach(config.contracts.PARTY.address)
        };
        this.log(`✅ Party 合約載入: ${config.contracts.PARTY.address}`, 'success');
      } else {
        throw new Error('Party 合約地址未找到');
      }
      
      // 載入 DungeonCore 合約地址
      if (config.contracts.DUNGEONCORE) {
        this.dungeonCoreAddress = config.contracts.DUNGEONCORE.address;
        this.log(`✅ DungeonCore 地址: ${this.dungeonCoreAddress}`, 'success');
      } else {
        throw new Error('DungeonCore 合約地址未找到');
      }
      
    } catch (error) {
      this.log(`❌ 載入合約配置失敗: ${error.message}`, 'error');
      throw error;
    }
  }

  async verifyPartyConnection() {
    this.log('\\n驗證 Party 合約連接...', 'info');
    
    const party = this.contracts.PARTY.contract;
    
    try {
      // 檢查當前設置
      const currentDungeonCore = await party.dungeonCoreContract();
      this.log(`當前 Party.dungeonCoreContract: ${currentDungeonCore}`, 'info');
      this.log(`預期 DungeonCore 地址: ${this.dungeonCoreAddress}`, 'info');
      
      const isCorrect = currentDungeonCore.toLowerCase() === this.dungeonCoreAddress.toLowerCase();
      
      if (isCorrect) {
        this.log('✅ Party 合約連接已正確設置', 'success');
        return true;
      } else {
        this.log('❌ Party 合約連接設置不正確', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ 驗證 Party 連接失敗: ${error.message}`, 'error');
      return false;
    }
  }

  async fixPartyConnection() {
    this.log('\\n修復 Party 合約連接...', 'info');
    
    const party = this.contracts.PARTY.contract;
    
    try {
      // 設置 DungeonCore
      this.log('執行 Party.setDungeonCore...', 'info');
      const tx = await party.setDungeonCore(this.dungeonCoreAddress);
      this.log(`交易哈希: ${tx.hash}`, 'info');
      
      // 等待交易確認
      const receipt = await tx.wait();
      this.log(`✅ 交易確認，區塊: ${receipt.blockNumber}`, 'success');
      
      // 驗證設置結果
      const verification = await this.verifyPartyConnection();
      
      if (verification) {
        this.log('✅ Party 合約連接修復成功', 'success');
        return true;
      } else {
        this.log('❌ Party 合約連接修復失敗', 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ 修復 Party 連接失敗: ${error.message}`, 'error');
      return false;
    }
  }

  async run() {
    this.log('🔧 Party 合約驗證修復工具', 'info');
    this.log('=====================================', 'info');
    
    try {
      // 1. 載入合約
      await this.loadContracts();
      
      // 2. 先驗證當前狀態
      const isCorrect = await this.verifyPartyConnection();
      
      if (isCorrect) {
        this.log('\\n🎉 Party 合約連接已正確，無需修復', 'success');
        return;
      }
      
      // 3. 執行修復
      const fixResult = await this.fixPartyConnection();
      
      if (fixResult) {
        this.log('\\n🎉 Party 合約連接修復完成', 'success');
      } else {
        this.log('\\n❌ Party 合約連接修復失敗', 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`\\n❌ 執行失敗: ${error.message}`, 'error');
      console.error(error);
      process.exit(1);
    }
  }
}

// 主函數
async function main() {
  const fixer = new PartyVerificationFixer();
  await fixer.run();
}

// 執行
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = PartyVerificationFixer;