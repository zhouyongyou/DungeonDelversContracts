const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 調試前端 VRF 費用讀取問題...\n");
    
    const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
    
    // 模擬前端使用的 ABI - 來自實際文件
    const frontendABI = [
        {
            "inputs": [],
            "name": "vrfRequestPrice",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "getVrfRequestPrice", 
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        }
    ];
    
    console.log("📊 使用前端相同的 ABI 讀取數據:");
    
    try {
        const vrfManager = new ethers.Contract(vrfManagerAddress, frontendABI, ethers.provider);
        
        // 1. 測試 vrfRequestPrice 函數
        console.log("\n1️⃣ 測試 vrfRequestPrice 函數:");
        try {
            const vrfPrice1 = await vrfManager.vrfRequestPrice();
            console.log("- 原始返回值 (BigInt):", vrfPrice1.toString());
            console.log("- 格式化為 ETH:", ethers.formatEther(vrfPrice1));
            console.log("- 轉換為 Number:", Number(vrfPrice1));
            console.log("- Number / 1e18:", Number(vrfPrice1) / 1e18);
            
            // 檢查是否有精度問題
            const jsNumber = Number(vrfPrice1);
            const etherValue = parseFloat(ethers.formatEther(vrfPrice1));
            console.log("- JS Number 轉換:", jsNumber);
            console.log("- formatEther 結果:", etherValue);
            console.log("- 是否相等:", jsNumber / 1e18 === etherValue);
            
        } catch (error) {
            console.log("- vrfRequestPrice 調用失敗:", error.message);
        }
        
        // 2. 測試 getVrfRequestPrice 函數
        console.log("\n2️⃣ 測試 getVrfRequestPrice 函數:");
        try {
            const vrfPrice2 = await vrfManager.getVrfRequestPrice();
            console.log("- 原始返回值 (BigInt):", vrfPrice2.toString());
            console.log("- 格式化為 ETH:", ethers.formatEther(vrfPrice2));
        } catch (error) {
            console.log("- getVrfRequestPrice 調用失敗:", error.message);
        }
        
        // 3. 模擬前端的計算邏輯
        console.log("\n3️⃣ 模擬前端計算邏輯:");
        
        const vrfPrice = await vrfManager.vrfRequestPrice();
        const quantity = 1;
        
        // 模擬前端的 calculateMintFee 函數邏輯
        const contractVrfFee = vrfPrice; // 從合約讀取的
        const fallbackVrfFee = parseFloat("0.0001"); // 硬編碼備用
        
        console.log("- contractVrfFee (原始):", contractVrfFee?.toString());
        console.log("- contractVrfFee !== undefined:", contractVrfFee !== undefined);
        
        const vrfFeeInEth = contractVrfFee !== undefined
            ? Number(contractVrfFee) / 1e18 
            : fallbackVrfFee;
            
        console.log("- 計算的 VRF 費用:", vrfFeeInEth);
        
        // 檢查格式化邏輯
        const formatBnb = (value) => {
            return parseFloat(value.toFixed(6)).toString();
        };
        
        console.log("- 格式化後的 VRF 費用:", formatBnb(vrfFeeInEth));
        
        // 4. 檢查可能的數據類型問題
        console.log("\n4️⃣ 數據類型檢查:");
        console.log("- typeof contractVrfFee:", typeof contractVrfFee);
        console.log("- contractVrfFee instanceof BigInt:", typeof contractVrfFee === 'bigint');
        console.log("- contractVrfFee.toString():", contractVrfFee.toString());
        
        // 5. 檢查是否有溢出問題
        console.log("\n5️⃣ 溢出檢查:");
        const bigIntValue = contractVrfFee;
        const numberValue = Number(bigIntValue);
        
        console.log("- BigInt 值:", bigIntValue.toString());
        console.log("- Number 值:", numberValue);
        console.log("- Number.MAX_SAFE_INTEGER:", Number.MAX_SAFE_INTEGER);
        console.log("- 是否在安全範圍:", numberValue <= Number.MAX_SAFE_INTEGER);
        
        // 6. 正確的轉換方式
        console.log("\n6️⃣ 推薦的轉換方式:");
        const correctConversion = parseFloat(ethers.formatEther(bigIntValue));
        console.log("- 使用 ethers.formatEther:", correctConversion);
        console.log("- 直接除法結果:", numberValue / 1e18);
        console.log("- 兩種方法是否相等:", correctConversion === (numberValue / 1e18));
        
    } catch (error) {
        console.error("❌ 調試失敗:", error.message);
    }
    
    console.log("\n💡 建議:");
    console.log("1. 檢查前端是否使用了正確的 ABI");
    console.log("2. 確保 BigInt 到 Number 的轉換正確");
    console.log("3. 使用 ethers.formatEther 而非直接除法");
    console.log("4. 檢查前端的錯誤處理邏輯");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });