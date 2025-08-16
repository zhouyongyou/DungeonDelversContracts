#!/usr/bin/env node

/**
 * V26 部署腳本
 * 使用新的 DeploymentManager 架構
 * 
 * 使用方式：
 * npx hardhat run scripts/next-version/deploy-v26.js --network bsc
 */

const { DeploymentManager } = require('./DeploymentManager');
const path = require('path');

async function main() {
  // 使用單一配置源
  const manifestPath = path.join(__dirname, 'deployment-manifest-example.json');
  
  // 創建部署管理器
  const manager = new DeploymentManager(manifestPath, 'bsc-mainnet');
  
  // 執行完整部署流程
  await manager.run();
}

// 執行
main()
  .then(() => {
    console.log('\n✅ 部署腳本執行成功');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 部署腳本執行失敗:', error);
    process.exit(1);
  });