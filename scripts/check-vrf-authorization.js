const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 檢查 VRF Manager 授權狀況\n");
    
    const provider = new ethers.JsonRpcProvider('https://bsc-dataseed.binance.org/');
    
    // 合約地址
    const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
    const heroAddress = "0x05Cbb0DbdA4B66c4CC6f60CdADFDb4C4995D9BFD";
    const userAddress = "0x10925A7138649C7E1794CE646182eeb5BF8ba647";
    
    // VRF Manager ABI
    const vrfManagerAbi = [
        "function authorizedContracts(address) external view returns (bool)",
        "function getRandomForUser(address user) external view returns (bool fulfilled, uint256[] memory randomWords)",
        "function requestRandomForUser(address user, uint256 quantity, uint8 maxRarity, bytes32 commitment) external payable returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    // Hero ABI (部分)
    const heroAbi = [
        "function vrfManager() external view returns (address)",
        "function userCommitments(address user) external view returns (tuple(uint256 blockNumber, uint256 quantity, uint256 payment, bytes32 commitment, bool fulfilled, uint8 maxRarity, bool fromVault))"
    ];
    
    const vrfManager = new ethers.Contract(vrfManagerAddress, vrfManagerAbi, provider);
    const hero = new ethers.Contract(heroAddress, heroAbi, provider);
    
    try {
        console.log("📊 VRF Manager 狀況:");
        console.log("VRF Manager:", vrfManagerAddress);
        console.log("Hero 合約:", heroAddress);
        
        // 檢查 Hero 合約中的 VRF Manager 地址
        const heroVrfManager = await hero.vrfManager();
        console.log("Hero 中的 VRF Manager:", heroVrfManager);
        console.log("地址匹配:", heroVrfManager.toLowerCase() === vrfManagerAddress.toLowerCase());
        
        // 檢查授權狀態
        let isAuthorized = false;
        try {
            isAuthorized = await vrfManager.authorizedContracts(heroAddress);
            console.log("Hero 合約已授權:", isAuthorized);
        } catch (error) {
            console.log("⚠️ 無法檢查授權狀態 (可能沒有 authorizedContracts 函數):", error.message);
        }
        
        // 檢查 VRF Manager 擁有者
        try {
            const vrfOwner = await vrfManager.owner();
            console.log("VRF Manager 擁有者:", vrfOwner);
        } catch (error) {
            console.log("⚠️ 無法獲取擁有者:", error.message);
        }
        
        console.log("\n🔍 檢查用戶的 VRF 請求狀態:");
        
        // 檢查用戶承諾
        try {
            const commitment = await hero.userCommitments(userAddress);
            console.log("用戶承諾狀態:");
            console.log("  區塊號:", commitment.blockNumber.toString());
            console.log("  數量:", commitment.quantity.toString());
            console.log("  已完成:", commitment.fulfilled);
            console.log("  最大稀有度:", commitment.maxRarity);
            console.log("  來自金庫:", commitment.fromVault);
            
            if (commitment.blockNumber > 0 && !commitment.fulfilled) {
                console.log("\n🎲 檢查 VRF 隨機數狀態:");
                try {
                    const [fulfilled, randomWords] = await vrfManager.getRandomForUser(userAddress);
                    console.log("VRF 已完成:", fulfilled);
                    console.log("隨機數數量:", randomWords.length);
                    if (randomWords.length > 0) {
                        console.log("第一個隨機數:", randomWords[0].toString());
                    }
                } catch (vrfError) {
                    console.log("❌ VRF 查詢失敗:", vrfError.message);
                    console.log("💡 這表示可能是授權問題或 VRF Manager 實現問題");
                }
            }
        } catch (error) {
            console.log("❌ 檢查用戶承諾失敗:", error.message);
        }
        
        console.log("\n🎯 模擬 VRF 請求調用:");
        try {
            const testCommitment = ethers.keccak256(ethers.toUtf8Bytes("test"));
            const result = await provider.call({
                to: vrfManagerAddress,
                from: heroAddress,
                data: vrfManager.interface.encodeFunctionData("requestRandomForUser", [
                    userAddress,
                    1,
                    5,
                    testCommitment
                ])
            });
            console.log("✅ VRF 請求模擬成功");
        } catch (error) {
            console.log("❌ VRF 請求模擬失敗:", error.message);
            if (error.message.includes("revert")) {
                console.log("💡 這很可能是授權問題 - Hero 合約未被 VRF Manager 授權");
            }
        }
        
        console.log("\n📋 總結:");
        if (!isAuthorized) {
            console.log("🚨 主要問題：Hero 合約未被 VRF Manager 授權");
            console.log("📝 解決方案：需要 VRF Manager 的 owner 調用 authorizeContract(heroAddress)");
        } else {
            console.log("✅ Hero 合約已正確授權");
            console.log("🔍 問題可能在其他地方，需要進一步調查");
        }
        
    } catch (error) {
        console.log("❌ 檢查失敗:", error.message);
        console.log("詳細錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("錯誤:", error);
        process.exit(1);
    });