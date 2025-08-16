#!/usr/bin/env node

/**
 * V25 VIPStaking 連接修復腳本
 * 專門修復 DungeonCore.vipStakingAddress 錯誤設定的問題
 */

const hre = require("hardhat");
const { ethers } = hre;
const chalk = require('chalk');

async function main() {
  console.log(chalk.cyan.bold('\n🔧 V25 VIPStaking 連接修復\n'));
  
  const [signer] = await ethers.getSigners();
  console.log(chalk.gray(`使用錢包: ${await signer.getAddress()}\n`));
  
  // 正確的地址
  const DUNGEONCORE_ADDRESS = '0x1a959ACcb898AdD61C959f2C93Abe502D0e1D34a';
  const VIPSTAKING_ADDRESS = '0xC0D8C84e28E5BcfC9cBD109551De53BA04e7328C';
  const PARTY_ADDRESS = '0x18bF1eE489CD0D8bfb006b4110bfe0Bb7459bE69';
  
  try {
    // 載入 DungeonCore 合約
    const dungeonCore = await ethers.getContractAt('DungeonCore', DUNGEONCORE_ADDRESS);
    console.log(chalk.blue('✅ 載入 DungeonCore 合約'));
    
    // 檢查當前 VIPStaking 地址
    const currentVIPStaking = await dungeonCore.vipStakingAddress();
    console.log(chalk.yellow(`當前 VIPStaking 地址: ${currentVIPStaking}`));
    
    if (currentVIPStaking.toLowerCase() === PARTY_ADDRESS.toLowerCase()) {
      console.log(chalk.red('❌ 確認錯誤：VIPStaking 地址被設為 Party 地址'));
      console.log(chalk.yellow(`   錯誤地址: ${currentVIPStaking}`));
      console.log(chalk.green(`   正確地址: ${VIPSTAKING_ADDRESS}`));
      
      // 執行修復
      console.log(chalk.cyan('\n開始修復...'));
      const tx = await dungeonCore.setVipStaking(VIPSTAKING_ADDRESS);
      console.log(chalk.blue(`交易發送: ${tx.hash}`));
      
      const receipt = await tx.wait();
      console.log(chalk.green(`✅ 交易確認，區塊: ${receipt.blockNumber}`));
      
      // 驗證修復
      const newVIPStaking = await dungeonCore.vipStakingAddress();
      if (newVIPStaking.toLowerCase() === VIPSTAKING_ADDRESS.toLowerCase()) {
        console.log(chalk.green.bold('✅ 修復成功！VIPStaking 地址已正確設定'));
        console.log(chalk.green(`   新地址: ${newVIPStaking}`));
      } else {
        console.log(chalk.red('❌ 修復失敗，地址仍然不正確'));
      }
      
    } else if (currentVIPStaking.toLowerCase() === VIPSTAKING_ADDRESS.toLowerCase()) {
      console.log(chalk.green('✅ VIPStaking 地址已經正確，無需修復'));
    } else {
      console.log(chalk.yellow('⚠️  VIPStaking 地址不是預期的值，但也不是 Party 地址'));
      console.log(chalk.yellow(`   當前: ${currentVIPStaking}`));
      console.log(chalk.yellow(`   預期: ${VIPSTAKING_ADDRESS}`));
      
      console.log(chalk.cyan('\n嘗試設定正確地址...'));
      const tx = await dungeonCore.setVipStaking(VIPSTAKING_ADDRESS);
      console.log(chalk.blue(`交易發送: ${tx.hash}`));
      
      const receipt = await tx.wait();
      console.log(chalk.green(`✅ 交易確認，區塊: ${receipt.blockNumber}`));
    }
    
    // 額外檢查：確保 Party 地址正確
    console.log(chalk.cyan('\n檢查 Party 地址設定...'));
    const partyAddress = await dungeonCore.partyContractAddress();
    if (partyAddress.toLowerCase() === PARTY_ADDRESS.toLowerCase()) {
      console.log(chalk.green(`✅ Party 地址正確: ${partyAddress}`));
    } else {
      console.log(chalk.red(`❌ Party 地址錯誤: ${partyAddress}`));
      console.log(chalk.yellow(`   預期: ${PARTY_ADDRESS}`));
    }
    
  } catch (error) {
    console.error(chalk.red('\n❌ 修復失敗:'), error.message);
    process.exit(1);
  }
}

// 執行
main()
  .then(() => {
    console.log(chalk.green.bold('\n✅ 腳本執行完成'));
    process.exit(0);
  })
  .catch((error) => {
    console.error(chalk.red('錯誤:'), error);
    process.exit(1);
  });