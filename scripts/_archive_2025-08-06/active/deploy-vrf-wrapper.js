// deploy-vrf-wrapper.js - 部署使用 VRF Wrapper 的新 VRFManager
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    console.log("🚀 部署 VRFManagerWrapper (使用 Direct Funding)...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("部署者地址:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("BNB 餘額:", ethers.formatEther(balance), "BNB\n");

    // BSC Mainnet VRF Wrapper 地址
    const VRF_WRAPPER = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
    
    try {
        // 編譯合約
        console.log("📄 編譯合約...");
        const { execSync } = require('child_process');
        execSync('npx hardhat compile', { stdio: 'inherit' });
        
        // 讀取編譯後的合約
        const artifactPath = path.join(__dirname, '../../artifacts/contracts/current/core/VRFManagerWrapper.sol/VRFManagerWrapper.json');
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // 部署合約
        console.log("\n🔧 部署 VRFManagerWrapper...");
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        
        const contract = await factory.deploy(VRF_WRAPPER);
        console.log("交易哈希:", contract.deploymentTransaction().hash);
        console.log("等待確認...");
        
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        
        console.log("✅ VRFManagerWrapper 已部署到:", address);
        
        // 初始化配置
        console.log("\n🔧 初始化合約配置...");
        
        const vrfManager = new ethers.Contract(address, artifact.abi, wallet);
        
        // 授權需要使用 VRF 的合約
        const contractsToAuthorize = {
            HERO: '0xD48867dbac5f1c1351421726B6544f847D9486af',
            RELIC: '0x86f15792Ecfc4b5F2451d841A3fBaBEb651138ce',
            ALTAROFASCENSION: '0x095559778C0BAA2d8FA040Ab0f8752cF07779D33',
            DUNGEONMASTER: '0xE391261741Fad5FCC2D298d00e8c684767021253'
        };
        
        for (const [name, contractAddress] of Object.entries(contractsToAuthorize)) {
            console.log(`授權 ${name}: ${contractAddress}`);
            const tx = await vrfManager.setAuthorizedContract(contractAddress);
            await tx.wait();
            console.log(`✅ ${name} 已授權`);
        }
        
        // 設定平台費用
        console.log("\n設定平台費用: 0.0003 BNB");
        let tx = await vrfManager.setPlatformFee(ethers.parseEther("0.0003"));
        await tx.wait();
        console.log("✅ 平台費用已設定");
        
        // 獲取 VRF 價格
        console.log("\n📊 查詢 VRF 請求價格...");
        const vrfPrice = await vrfManager.getRequestPrice();
        console.log("VRF 請求價格:", ethers.formatEther(vrfPrice), "BNB");
        
        const platformFee = await vrfManager.platformFee();
        console.log("平台費用:", ethers.formatEther(platformFee), "BNB");
        
        const totalFee = BigInt(vrfPrice) + BigInt(platformFee);
        console.log("總費用:", ethers.formatEther(totalFee), "BNB");
        
        // 保存部署信息
        const deploymentInfo = {
            network: "BSC Mainnet",
            deployedAt: new Date().toISOString(),
            vrfManagerWrapper: address,
            vrfWrapper: VRF_WRAPPER,
            authorizedContracts: contractsToAuthorize,
            vrfPrice: ethers.formatEther(vrfPrice),
            platformFee: ethers.formatEther(platformFee),
            totalFee: ethers.formatEther(totalFee)
        };
        
        const deploymentPath = path.join(__dirname, 'vrf-wrapper-deployment.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\n📝 部署信息已保存到:", deploymentPath);
        
        console.log("\n🎉 部署完成！");
        console.log("\n⚠️ 下一步：");
        console.log("1. 更新所有使用 VRF 的合約，將 vrfManager 地址改為:", address);
        console.log("2. 測試鑄造功能");
        
        return address;
        
    } catch (error) {
        console.error("❌ 部署失敗:", error.message);
        throw error;
    }
}

main()
    .then((address) => {
        console.log("\n✅ 新的 VRFManagerWrapper 地址:", address);
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });