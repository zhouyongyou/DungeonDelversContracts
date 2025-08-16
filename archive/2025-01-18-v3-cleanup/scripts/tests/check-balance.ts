import { ethers } from "hardhat";

async function main() {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    
    console.log("部署錢包地址:", deployer.address);
    console.log("BNB 餘額:", ethers.formatEther(balance), "BNB");
    console.log("建議最少需要 0.5 BNB 來完成部署");
    
    if (parseFloat(ethers.formatEther(balance)) < 0.5) {
        console.log("⚠️  警告：餘額可能不足！");
    } else {
        console.log("✅ 餘額充足");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});