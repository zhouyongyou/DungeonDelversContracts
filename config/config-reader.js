/**
 * DungeonDelvers 配置讀取器
 * 自動生成於: 2025-08-03T15:55:40.251Z
 * 從 v25-config.js 生成
 */

const v25Config = require('./v25-config.js');

module.exports = {
  version: v25Config.version,
  contracts: v25Config.contracts,
  deployer: v25Config.deployer,
  startBlock: v25Config.startBlock,
  network: v25Config.network,
  
  // 輔助方法
  getAddress(contractName) {
    const contract = this.contracts[contractName];
    return contract ? contract.address : null;
  },
  
  getAllAddresses() {
    const addresses = {};
    for (const [name, data] of Object.entries(this.contracts)) {
      addresses[`${name}_ADDRESS`] = data.address;
    }
    return addresses;
  },
  
  // 原始配置
  raw: v25Config
};
