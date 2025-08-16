const hre = require("hardhat");
const { ethers } = hre;
const chalk = require('chalk');

// V25 合約地址
const ADDRESSES = {
  PARTY: "0x382024850E08AB37E290315fc5f3692b8D6646EB",
  VIPSTAKING: "0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C",
  ALTAROFASCENSION: "0xB102a57eD4697f7A721541fd7B0bba8D6bdF63a5"
};

async function main() {
  console.log(chalk.cyan('\n=================================================='));
  console.log(chalk.cyan('🔍 V25 部署狀態檢查'));
  console.log(chalk.cyan('==================================================\n'));

  const [signer] = await ethers.getSigners();
  console.log(`檢查錢包: ${await signer.getAddress()}`);
  
  // 檢查錢包餘額
  const balance = await ethers.provider.getBalance(signer.address);
  console.log(`錢包餘額: ${ethers.formatEther(balance)} BNB\n`);

  // 檢查 Party 合約狀態
  console.log(chalk.yellow('\n檢查 Party 合約...'));
  try {
    const party = await ethers.getContractAt("PartyV3", ADDRESSES.PARTY);
    
    // 檢查 platformFee
    try {
      const platformFee = await party.platformFee();
      console.log(`✅ Party platformFee: ${ethers.formatEther(platformFee)} BNB`);
    } catch (error) {
      console.log(`❌ 無法讀取 Party platformFee: ${error.message}`);
    }
    
    // 檢查 owner
    try {
      const owner = await party.owner();
      console.log(`✅ Party owner: ${owner}`);
    } catch (error) {
      console.log(`❌ 無法讀取 Party owner: ${error.message}`);
    }
  } catch (error) {
    console.log(`❌ 無法連接 Party 合約: ${error.message}`);
  }

  // 檢查 VIPStaking 合約狀態
  console.log(chalk.yellow('\n檢查 VIPStaking 合約...'));
  try {
    const vipStaking = await ethers.getContractAt("VIPStaking", ADDRESSES.VIPSTAKING);
    
    // 檢查 unstakeCooldown
    try {
      const cooldown = await vipStaking.unstakeCooldown();
      const days = Number(cooldown) / 86400;
      console.log(`✅ VIP unstakeCooldown: ${cooldown} 秒 (${days} 天)`);
    } catch (error) {
      console.log(`❌ 無法讀取 VIP unstakeCooldown: ${error.message}`);
    }
    
    // 檢查 owner
    try {
      const owner = await vipStaking.owner();
      console.log(`✅ VIPStaking owner: ${owner}`);
    } catch (error) {
      console.log(`❌ 無法讀取 VIPStaking owner: ${error.message}`);
    }
  } catch (error) {
    console.log(`❌ 無法連接 VIPStaking 合約: ${error.message}`);
  }

  // 檢查 AltarOfAscension 合約狀態
  console.log(chalk.yellow('\n檢查 AltarOfAscension 合約...'));
  try {
    const altar = await ethers.getContractAt("AltarOfAscensionV2Fixed", ADDRESSES.ALTAROFASCENSION);
    
    // 檢查連接狀態
    try {
      const heroContract = await altar.heroContract();
      console.log(`✅ Altar heroContract: ${heroContract}`);
      
      const relicContract = await altar.relicContract();
      console.log(`✅ Altar relicContract: ${relicContract}`);
    } catch (error) {
      console.log(`❌ 無法讀取 Altar 合約連接: ${error.message}`);
    }
  } catch (error) {
    console.log(`❌ 無法連接 AltarOfAscension 合約: ${error.message}`);
  }

  // 檢查最新區塊
  console.log(chalk.yellow('\n網路狀態...'));
  const blockNumber = await ethers.provider.getBlockNumber();
  console.log(`當前區塊: ${blockNumber}`);
  
  // 檢查 pending 交易
  const pendingTxCount = await ethers.provider.getTransactionCount(signer.address, 'pending');
  const confirmedTxCount = await ethers.provider.getTransactionCount(signer.address, 'latest');
  console.log(`已確認交易數: ${confirmedTxCount}`);
  console.log(`Pending 交易數: ${pendingTxCount - confirmedTxCount}`);
  
  if (pendingTxCount > confirmedTxCount) {
    console.log(chalk.red('\n⚠️ 發現 pending 交易！這可能是部署卡住的原因。'));
    console.log('建議：');
    console.log('1. 等待交易確認');
    console.log('2. 或在 BSCScan 檢查交易狀態');
    console.log('3. 如果交易卡住，可能需要發送一個更高 gas price 的交易來替換');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });