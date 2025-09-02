// 自動生成的配置讀取器
// 總是指向最新的 vXX-config.js

const path = require('path');

// 載入最新配置
const latestConfig = require('./v25-config.js');

// 提供向後相容的介面
module.exports = {
  // 原始配置
  raw: latestConfig,
  
  // 版本資訊
  version: 'V25',
  
  // 快速存取
  contracts: latestConfig.contracts,
  deployer: latestConfig.deployer,
  network: latestConfig.network,
  startBlock: latestConfig.startBlock,
  
  // 取得合約地址
  getAddress(contractName) {
    return latestConfig.contracts[contractName]?.address;
  },
  
  // 取得所有地址（扁平化）
  getAllAddresses() {
    const addresses = {};
    for (const [key, data] of Object.entries(latestConfig.contracts)) {
      addresses[`${key}_ADDRESS`] = data.address;
    }
    return addresses;
  }
};
