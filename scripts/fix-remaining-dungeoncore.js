#!/usr/bin/env node

/**
 * 修復剩餘的 DungeonCore 設置
 * V25.0.4 版本
 */

const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 修復剩餘合約的 DungeonCore 設置\n");
  
  const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org");
  const adminPrivateKey = process.env.ADMIN_PRIVATE_KEY || process.env.PRIVATE_KEY;
  
  if (!adminPrivateKey) {
    console.error("❌ 請設置 ADMIN_PRIVATE_KEY 環境變數");
    process.exit(1);
  }
  
  const deployer = new ethers.Wallet(adminPrivateKey, provider);
  console.log("執行者地址:", deployer.address);
  
  // 檢查餘額
  const balance = await provider.getBalance(deployer.address);
  console.log("錢包餘額:", ethers.formatEther(balance), "BNB");
  
  if (balance === 0n) {
    throw new Error("錢包餘額不足，無法支付 gas 費用");
  }
  
  // V25.0.4 合約地址
  const dungeonCoreAddress = '0x5B64A5939735Ff762493D9B9666b3e13118c5722';
  
  // 需要修復的合約
  const contractsToFix = [
    {
      name: 'DungeonStorage',
      address: '0xCE75345A01dB5c40E443624F86BDC45BabF7B6ec',
      setterFunction: 'setDungeonCore'
    },
    {
      name: 'AltarOfAscension', 
      address: '0x56B62168734827b9b3D750ac1aB9F249e0a0EEd3',
      setterFunction: 'setDungeonCore'
    }
  ];
  
  console.log(`\n🎯 將設置 DungeonCore 地址為: ${dungeonCoreAddress}\n`);
  
  for (const contractInfo of contractsToFix) {
    try {
      console.log(`🔧 修復 ${contractInfo.name}...`);
      console.log(`   合約地址: ${contractInfo.address}`);
      
      // 創建合約實例
      const abi = [
        `function ${contractInfo.setterFunction}(address) external`,
        "function dungeonCore() view returns (address)",
        "function owner() view returns (address)"
      ];
      
      const contract = new ethers.Contract(contractInfo.address, abi, deployer);
      
      // 檢查 owner
      try {
        const owner = await contract.owner();
        console.log(`   合約 Owner: ${owner}`);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
          console.log(`   ⚠️ 警告: 你不是合約 owner，交易可能失敗`);
        }
      } catch (e) {
        console.log(`   ⚠️ 無法檢查 owner: ${e.message}`);
      }
      
      // 執行設置
      console.log(`   📡 調用 ${contractInfo.setterFunction}(${dungeonCoreAddress})...`);
      
      const tx = await contract[contractInfo.setterFunction](dungeonCoreAddress, {
        gasLimit: 100000
      });
      
      console.log(`   ⏳ 交易已發送: ${tx.hash}`);
      await tx.wait();
      console.log(`   ✅ 交易確認成功`);
      
      // 驗證設置
      try {
        const currentCore = await contract.dungeonCore();
        console.log(`   🔍 驗證結果: ${currentCore}`);
        
        if (currentCore.toLowerCase() === dungeonCoreAddress.toLowerCase()) {
          console.log(`   ✅ ${contractInfo.name} 設置成功！`);
        } else {
          console.log(`   ❌ ${contractInfo.name} 設置失敗，地址不符`);
        }
      } catch (e) {
        console.log(`   ⚠️ 無法驗證設置: ${e.message}`);
      }
      
    } catch (error) {
      console.error(`❌ ${contractInfo.name} 設置失敗:`, error.message);
      console.error("詳細錯誤:", error);
    }
    
    console.log();
  }
  
  // 檢查 Oracle 合約（可能沒有 setDungeonCore 函數）
  console.log("🔍 檢查 Oracle 合約...");
  try {
    const oracleAddress = '0xEE322Eff70320759487f67875113C062AC1F4cfB';
    const oracleAbi = [
      "function dungeonCore() view returns (address)",
      "function setDungeonCore(address) external"
    ];
    
    const oracleContract = new ethers.Contract(oracleAddress, oracleAbi, provider);
    
    try {
      const currentCore = await oracleContract.dungeonCore();
      console.log(`Oracle 當前 DungeonCore: ${currentCore}`);
      
      if (currentCore === ethers.ZeroAddress) {
        console.log("⚠️ Oracle 也需要設置 DungeonCore");
        // 這裡可以嘗試設置，但可能需要不同的函數名
      }
    } catch (e) {
      console.log("ℹ️ Oracle 可能不支援 dungeonCore getter 或使用不同的架構");
    }
  } catch (error) {
    console.log("⚠️ Oracle 檢查失敗:", error.message);
  }
  
  console.log("\n🎉 修復程序完成！");
  console.log("建議執行檢查腳本確認結果:");
  console.log("node scripts/check-all-contracts-core.js");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });