const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
    console.log("🔍 檢查 VRF Manager 合約函數...\n");
    
    const vrfManagerAddress = "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1";
    
    // 嘗試不同的 ABI 函數名稱
    const possibleABIs = [
        // 嘗試 1: 基本的 VRF 函數
        [
            "function vrfRequestPrice() external view returns (uint256)",
            "function getVrfRequestPrice() external view returns (uint256)",
            "function getTotalFee() external view returns (uint256)",
            "function owner() external view returns (address)"
        ],
        // 嘗試 2: Direct Funding 模式函數  
        [
            "function setVrfRequestPrice(uint256 _price) external",
            "function setPlatformFee(uint256 _fee) external",
            "function vrfRequestPrice() external view returns (uint256)",
            "function platformFee() external view returns (uint256)",
            "function owner() external view returns (address)"
        ],
        // 嘗試 3: Subscription 模式函數
        [
            "function setRequestPrice(uint256 _price) external", 
            "function setFee(uint256 _fee) external",
            "function requestPrice() external view returns (uint256)",
            "function fee() external view returns (uint256)",
            "function owner() external view returns (address)"
        ]
    ];
    
    for (let i = 0; i < possibleABIs.length; i++) {
        console.log(`\n🧪 嘗試 ABI 組合 ${i + 1}:`);
        
        try {
            const vrfManager = new ethers.Contract(vrfManagerAddress, possibleABIs[i], ethers.provider);
            
            // 檢查擁有者
            try {
                const owner = await vrfManager.owner();
                console.log("- 擁有者:", owner);
            } catch (error) {
                console.log("- 擁有者: 無法讀取");
            }
            
            // 嘗試讀取不同的費用函數
            const viewFunctions = [
                'vrfRequestPrice',
                'getVrfRequestPrice', 
                'getTotalFee',
                'requestPrice',
                'fee',
                'platformFee'
            ];
            
            for (const funcName of viewFunctions) {
                if (possibleABIs[i].some(sig => sig.includes(funcName) && sig.includes('view'))) {
                    try {
                        const value = await vrfManager[funcName]();
                        console.log(`- ${funcName}:`, ethers.formatEther(value), "BNB");
                    } catch (error) {
                        console.log(`- ${funcName}: 調用失敗`);
                    }
                }
            }
            
        } catch (error) {
            console.log(`- ABI ${i + 1} 初始化失敗:`, error.message.split('\n')[0]);
        }
    }
    
    // 檢查是否為 Chainlink VRF Coordinator
    console.log("\n🔗 檢查是否為標準 Chainlink VRF 合約:");
    
    const chainlinkABI = [
        "function calculateRequestPrice(uint32 callbackGasLimit, uint32 numWords) external view returns (uint256)",
        "function calculateRequestPriceNative(uint32 callbackGasLimit, uint32 numWords) external view returns (uint256)",
        "function s_config() external view returns (tuple(uint16 minimumRequestConfirmations, uint32 maxGasLimit, uint32 stalenessSeconds, uint32 gasAfterPaymentCalculation, int256 fallbackWeiPerUnitLink, uint256 fulfillmentFlatFeeNativePPM, uint256 fulfillmentFlatFeeLinkDiscountPPM, uint8 nativePremiumPercentage, uint8 linkPremiumPercentage))"
    ];
    
    try {
        const chainlinkContract = new ethers.Contract(vrfManagerAddress, chainlinkABI, ethers.provider);
        
        // 嘗試計算標準請求價格
        const price = await chainlinkContract.calculateRequestPriceNative(100000, 1);
        console.log("- 標準 VRF 請求價格:", ethers.formatEther(price), "BNB");
        
        const config = await chainlinkContract.s_config();
        console.log("- VRF 配置:", {
            minimumConfirmations: config[0].toString(),
            maxGasLimit: config[1].toString(),
            fulfillmentFlatFee: ethers.formatEther(config[5] * BigInt(1e12)), // PPM to BNB
        });
        
    } catch (error) {
        console.log("- 不是標準 Chainlink VRF 合約");
    }
    
    console.log("\n💡 建議:");
    console.log("1. 如果是自定義 VRF Manager，需要找到正確的函數名稱");
    console.log("2. 如果是標準 Chainlink VRF，可能需要通過 Chainlink 管理頁面調整");
    console.log("3. 或者在前端使用固定的合理費用 (0.0005 BNB)");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 腳本執行失敗:", error);
        process.exit(1);
    });