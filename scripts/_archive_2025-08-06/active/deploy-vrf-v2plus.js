// deploy-vrf-v2plus.js - 部署完整版 VRFManagerV2Plus
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
    console.log("🚀 部署 VRFManagerV2Plus (完整版 Chainlink VRF V2.5 Direct Funding)...\n");

    const provider = new ethers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    console.log("部署者地址:", wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log("BNB 餘額:", ethers.formatEther(balance), "BNB\n");

    // BSC Mainnet 配置
    const LINK_TOKEN = '0x404460C6A5EdE2D891e8297795264fDe62ADBB75';
    const VRF_WRAPPER = '0x471506e6ADED0b9811D05B8cAc8Db25eE839Ac94';
    
    try {
        // 讀取編譯後的合約
        const artifactPath = path.join(__dirname, '../../artifacts/contracts/current/core/VRFManagerV2Plus.sol/VRFManagerV2Plus.json');
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        
        // 部署合約
        console.log("🔧 部署 VRFManagerV2Plus...");
        console.log("  LINK Token:", LINK_TOKEN);
        console.log("  VRF Wrapper:", VRF_WRAPPER);
        
        const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
        
        const contract = await factory.deploy(LINK_TOKEN, VRF_WRAPPER);
        console.log("交易哈希:", contract.deploymentTransaction().hash);
        console.log("等待確認...");
        
        await contract.waitForDeployment();
        const address = await contract.getAddress();
        
        console.log("✅ VRFManagerV2Plus 已部署到:", address);
        
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
        
        console.log("\n📝 授權合約...");
        for (const [name, contractAddress] of Object.entries(contractsToAuthorize)) {
            console.log(`  授權 ${name}: ${contractAddress}`);
            const tx = await vrfManager.setAuthorizedContract(contractAddress, true);
            await tx.wait();
            console.log(`  ✅ ${name} 已授權`);
        }
        
        // 設定費用
        console.log("\n💰 設定費用...");
        
        // 設定平台費用
        console.log("  設定平台費用: 0.0003 BNB");
        let tx = await vrfManager.setPlatformFee(ethers.parseEther("0.0003"));
        await tx.wait();
        console.log("  ✅ 平台費用已設定");
        
        // 設定 VRF 請求價格（如果需要調整）
        console.log("  設定 VRF 請求價格: 0.005 BNB");
        tx = await vrfManager.setVrfRequestPrice(ethers.parseEther("0.005"));
        await tx.wait();
        console.log("  ✅ VRF 請求價格已設定");
        
        // 獲取並顯示費用信息
        console.log("\n📊 費用信息：");
        const vrfPrice = await vrfManager.getVrfRequestPrice();
        console.log("  VRF 請求價格:", ethers.formatEther(vrfPrice), "BNB");
        
        const platformFee = await vrfManager.platformFee();
        console.log("  平台費用:", ethers.formatEther(platformFee), "BNB");
        
        const totalFee = await vrfManager.getTotalFee();
        console.log("  總費用:", ethers.formatEther(totalFee), "BNB");
        
        // 驗證授權狀態
        console.log("\n✅ 驗證授權狀態：");
        for (const [name, contractAddress] of Object.entries(contractsToAuthorize)) {
            const isAuthorized = await vrfManager.isAuthorized(contractAddress);
            console.log(`  ${name}: ${isAuthorized ? '✅ 已授權' : '❌ 未授權'}`);
        }
        
        // 保存部署信息
        const deploymentInfo = {
            network: "BSC Mainnet",
            deployedAt: new Date().toISOString(),
            contractName: "VRFManagerV2Plus",
            contractAddress: address,
            linkToken: LINK_TOKEN,
            vrfWrapper: VRF_WRAPPER,
            authorizedContracts: contractsToAuthorize,
            fees: {
                vrfPrice: ethers.formatEther(vrfPrice),
                platformFee: ethers.formatEther(platformFee),
                totalFee: ethers.formatEther(totalFee)
            },
            configuration: {
                callbackGasLimit: (await vrfManager.callbackGasLimit()).toString(),
                requestConfirmations: (await vrfManager.requestConfirmations()).toString()
            },
            transactionHash: contract.deploymentTransaction().hash,
            previousDeployments: [
                {
                    name: "VRFManager (original)",
                    address: "0xD062785C376560A392e1a5F1b25ffb35dB5b67bD",
                    status: "deprecated - incorrect implementation"
                },
                {
                    name: "VRFManagerWrapperV2",
                    address: "0x113e986F80D3C5f63f321F1dbaDd6cAC6c9DCF90",
                    status: "working but incomplete interface"
                }
            ]
        };
        
        const deploymentPath = path.join(__dirname, 'vrf-v2plus-deployment.json');
        fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
        console.log("\n📝 部署信息已保存到:", deploymentPath);
        
        console.log("\n🎉 部署完成！");
        console.log("\n" + "=".repeat(60));
        console.log("📋 部署總結");
        console.log("=".repeat(60));
        console.log("合約名稱: VRFManagerV2Plus");
        console.log("合約地址:", address);
        console.log("部署者: ", wallet.address);
        console.log("網路: BSC Mainnet");
        console.log("=".repeat(60));
        
        console.log("\n⚠️ 下一步驟：");
        console.log("1. 執行更新腳本：");
        console.log(`   node scripts/active/update-vrf-to-v2plus.js ${address}`);
        console.log("\n2. 測試鑄造功能");
        console.log("\n3. 在 BSCScan 驗證合約：");
        console.log(`   https://bscscan.com/address/${address}#code`);
        
        return address;
        
    } catch (error) {
        console.error("❌ 部署失敗:", error.message);
        if (error.data) {
            console.error("錯誤數據:", error.data);
        }
        throw error;
    }
}

main()
    .then((address) => {
        console.log("\n✅ VRFManagerV2Plus 成功部署到:", address);
        process.exit(0);
    })
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });