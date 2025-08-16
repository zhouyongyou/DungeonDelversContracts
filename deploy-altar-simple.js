#!/usr/bin/env node

const hre = require("hardhat");
const { ethers } = require("ethers");

async function main() {
  const provider = new ethers.JsonRpcProvider(
    process.env.BSC_MAINNET_RPC_URL || "https://bsc-dataseed1.binance.org"
  );
  
  const deployer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log('🔨 部署 AltarOfAscensionVRF...');
  console.log('部署者地址:', deployer.address);
  
  const altarArtifact = await hre.artifacts.readArtifact("AltarOfAscensionVRF");
  const altarFactory = new ethers.ContractFactory(
    altarArtifact.abi,
    altarArtifact.bytecode,
    deployer
  );
  
  const altarContract = await altarFactory.deploy(
    deployer.address, // _initialOwner
    { gasLimit: 6000000 }
  );
  
  console.log('交易 hash:', altarContract.deploymentTransaction().hash);
  console.log('等待確認...');
  await altarContract.waitForDeployment();
  
  const altarAddress = await altarContract.getAddress();
  console.log('✅ AltarOfAscensionVRF 部署成功:', altarAddress);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error('❌ 部署失敗:', error.message);
  process.exit(1);
});