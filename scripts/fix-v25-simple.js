#!/usr/bin/env node

const { ethers } = require("hardhat");

async function main() {
  console.log("🔧 簡單修復 V25 設置");
  
  const [deployer] = await ethers.getSigners();
  
  // 使用直接的交易調用
  try {
    // 1. Relic 已完成 ✅
    
    // 2. 初始化地城（通過 DungeonMaster）
    console.log("\n初始化地城...");
    const dungeonMaster = await ethers.getContractAt(
      'DungeonMaster', 
      '0xA2e6a50190412693fBD2B3c6A95eF9A95c17f1B9'
    );
    
    // 初始化地城 1
    try {
      const tx = await dungeonMaster.initializeDungeon(
        1, 300, ethers.parseEther("6"), 89,
        { gasLimit: 500000 }
      );
      await tx.wait();
      console.log("✅ 地城 1 初始化完成");
    } catch (e) {
      console.log("地城 1:", e.message);
    }
    
    // 3. Party 費用（直接調用）
    console.log("\n設置 Party 費用...");
    const partyAddress = '0x5196631AB636a0C951c56943f84029a909540B9E';
    const setFeeData = '0x69fe0e2d' + // setFee(uint256)
      '0000000000000000000000000000000000000000000000000000038d7ea4c68000'; // 0.001 ether
    
    try {
      const tx = await deployer.sendTransaction({
        to: partyAddress,
        data: setFeeData,
        gasLimit: 100000
      });
      await tx.wait();
      console.log("✅ Party 費用設置完成");
    } catch (e) {
      console.log("Party 費用:", e.message);
    }
    
    // 4. Altar 平台費（直接調用）
    console.log("\n設置 Altar 平台費...");
    const altarAddress = '0xe75dd1b6aDE42d7bbDB287da571b5A35E12d744B';
    const setPlatformFeeData = '0x12e8e2c3' + // setPlatformFee(uint256)
      '00000000000000000000000000000000000000000000000000000000005c174c'; // 0.0000001011 ether
    
    try {
      const tx = await deployer.sendTransaction({
        to: altarAddress,
        data: setPlatformFeeData,
        gasLimit: 100000
      });
      await tx.wait();
      console.log("✅ Altar 平台費設置完成");
    } catch (e) {
      console.log("Altar 平台費:", e.message);
    }
    
  } catch (error) {
    console.error("錯誤:", error.message);
  }
  
  console.log("\n✅ 設置嘗試完成");
}

main()
  .then(() => process.exit(0))
  .catch(console.error);