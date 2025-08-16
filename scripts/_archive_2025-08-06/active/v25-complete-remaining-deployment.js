const hre = require("hardhat");
const { ethers } = hre;
const chalk = require('chalk');
const fs = require('fs').promises;
const path = require('path');

// V25 合約地址
const ADDRESSES = {
  ORACLE: "0xdbf49cd5708C56b8b0848233b754b418806D7018",
  PLAYERVAULT: "0x7085b353f553225B6001Ba23ECCb39611fBa31Bf",
  DUNGEONCORE: "0x2953ed03825b40e9c1EBa1cAe5FBD47f20A4823d",
  DUNGEONSTORAGE: "0x22bbcF5411c991A5DE7774Ace435DcBF69EF0a8a",
  DUNGEONMASTER: "0x9e17c01A610618223d49D64E322DC1b6360E4E8D",
  HERO: "0x001b7462B0f1Ab832c017a6f09133932Be140b18",
  RELIC: "0xdd8E52cD1d248D04C306c038780315a03866B402",
  PARTY: "0x382024850E08AB37E290315fc5f3692b8D6646EB",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  PLAYERPROFILE: "0x481ABDF19E41Bf2cE84075174675626aa027fE82",
  ALTAROFASCENSION: "0xB102a57eD4697f7A721541fd7B0bba8D6bdF63a5",
  SOULSHARD: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF",
  UNISWAP_POOL: "0x1e5Cd5F386Fb6F39cD8788675dd3A5ceB6521C82"
};

async function main() {
  console.log(chalk.cyan('\n=================================================='));
  console.log(chalk.cyan('🚀 V25 完成剩餘部署步驟'));
  console.log(chalk.cyan('==================================================\n'));

  const [signer] = await ethers.getSigners();
  console.log(`部署錢包: ${await signer.getAddress()}`);
  
  // 1. 保存部署結果
  console.log(chalk.yellow('\n📝 保存部署結果...'));
  await saveDeploymentAddresses();
  
  // 2. 驗證合約（可選）
  console.log(chalk.yellow('\n🔍 準備驗證合約...'));
  console.log('您可以稍後運行:');
  console.log(chalk.gray('npx hardhat run scripts/active/v25-verify-contracts.js --network bsc'));
  
  // 3. 部署子圖（可選）
  console.log(chalk.yellow('\n📊 準備部署子圖...'));
  console.log('您可以稍後運行:');
  console.log(chalk.gray('cd subgraph && ./deploy.sh v3.5.6'));
  
  console.log(chalk.green('\n✅ V25 部署完成！'));
  console.log(chalk.green('\n所有合約已成功部署並配置。'));
}

async function saveDeploymentAddresses() {
  // 保存到 deployment-v25.json
  const deploymentData = {
    version: "V25",
    network: "BSC Mainnet",
    timestamp: new Date().toISOString(),
    addresses: ADDRESSES,
    notes: [
      "使用 Commit-Reveal 機制",
      "統一機率系統",
      "強制揭示固定分布"
    ]
  };
  
  const deploymentPath = path.join(__dirname, '../../deployments/deployment-v25.json');
  await fs.writeFile(deploymentPath, JSON.stringify(deploymentData, null, 2));
  console.log(`✅ 部署地址已保存到: ${deploymentPath}`);
  
  // 保存到 .env.v25
  const envContent = Object.entries(ADDRESSES)
    .map(([key, value]) => `${key}_ADDRESS=${value}`)
    .join('\n');
  
  const envPath = path.join(__dirname, '../../.env.v25');
  await fs.writeFile(envPath, envContent);
  console.log(`✅ 環境變數已保存到: ${envPath}`);
  
  // 更新 CONTRACT_ADDRESSES.md
  const addressesMd = `# V25 合約地址

## 部署時間
${new Date().toISOString()}

## BSC 主網地址

### 核心合約
- **SOULSHARD**: \`${ADDRESSES.SOULSHARD}\`
- **ORACLE**: \`${ADDRESSES.ORACLE}\`
- **DUNGEONCORE**: \`${ADDRESSES.DUNGEONCORE}\`

### 遊戲機制合約
- **PLAYERVAULT**: \`${ADDRESSES.PLAYERVAULT}\`
- **PLAYERPROFILE**: \`${ADDRESSES.PLAYERPROFILE}\`
- **VIPSTAKING**: \`${ADDRESSES.VIPSTAKING}\`
- **DUNGEONSTORAGE**: \`${ADDRESSES.DUNGEONSTORAGE}\`
- **DUNGEONMASTER**: \`${ADDRESSES.DUNGEONMASTER}\`
- **ALTAROFASCENSION**: \`${ADDRESSES.ALTAROFASCENSION}\`

### NFT 合約
- **HERO**: \`${ADDRESSES.HERO}\`
- **RELIC**: \`${ADDRESSES.RELIC}\`
- **PARTY**: \`${ADDRESSES.PARTY}\`

### 其他
- **UNISWAP_POOL**: \`${ADDRESSES.UNISWAP_POOL}\`
`;
  
  const addressesMdPath = path.join(__dirname, '../../CONTRACT_ADDRESSES_V25.md');
  await fs.writeFile(addressesMdPath, addressesMd);
  console.log(`✅ 地址文檔已保存到: ${addressesMdPath}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });