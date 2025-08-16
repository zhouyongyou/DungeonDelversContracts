const { ethers } = require("hardhat");

async function main() {
    const addresses = {
        VIP_STAKING: "0x067F289Ae4e76CB61b8a138bF705798a928a12FB",
        HERO: "0x4EFc389f5DE5DfBd0c8B158a2ea41B611aA30CDb",
        RELIC: "0x235d53Efd9cc5aB66F2C3B1E496Ab25767D673e0"
    };
    
    // 通用 NFT ABI
    const NFT_ABI = [
        "function tokenURI(uint256 tokenId) external view returns (string memory)",
        "function totalSupply() external view returns (uint256)",
        "function tokenByIndex(uint256 index) external view returns (uint256)",
        "function owner() external view returns (address)"
    ];
    
    console.log("🔍 檢查所有 NFT 合約的 tokenURI 狀況...\n");
    
    for (const [name, address] of Object.entries(addresses)) {
        console.log(`=== ${name} 合約 ===`);
        console.log(`地址: ${address}`);
        
        try {
            const contract = await ethers.getContractAt(NFT_ABI, address);
            
            // 檢查總供應量
            const totalSupply = await contract.totalSupply();
            console.log(`Total Supply: ${totalSupply.toString()}`);
            
            if (totalSupply.toString() === "0") {
                console.log(`❌ ${name} 合約中沒有任何 token，無法測試 tokenURI\n`);
                continue;
            }
            
            // 獲取第一個 token ID
            const firstTokenId = await contract.tokenByIndex(0);
            console.log(`第一個 token ID: ${firstTokenId.toString()}`);
            
            // 嘗試獲取 tokenURI
            try {
                const tokenURI = await contract.tokenURI(firstTokenId);
                console.log(`✅ TokenURI: ${tokenURI}`);
                
                // 如果是 HTTP URL，嘗試獲取內容
                if (tokenURI.startsWith('http')) {
                    console.log(`🌐 這是一個 HTTP URL，讓我們獲取內容...`);
                    // 這裡可以使用 fetch 或其他方式獲取內容
                } else if (tokenURI.startsWith('data:application/json')) {
                    console.log(`📄 這是 Base64 編碼的 JSON`);
                    // 解碼並檢查內容
                    const base64Data = tokenURI.split(',')[1];
                    const decodedJson = Buffer.from(base64Data, 'base64').toString('utf-8');
                    console.log(`解碼後的 JSON: ${decodedJson}`);
                }
                
            } catch (tokenError) {
                console.log(`❌ 獲取 tokenURI 失敗: ${tokenError.message}`);
                
                // 特別檢查是否是 baseURI 未設定的問題
                if (tokenError.message.includes("baseURI not set")) {
                    console.log(`🔴 【發現問題】baseURI 未設定！`);
                }
            }
            
        } catch (error) {
            console.log(`❌ 連接 ${name} 合約失敗: ${error.message}`);
        }
        
        console.log(''); // 空行分隔
    }
    
    // 額外檢查：比較 Hero 和 VIP 的部署腳本差異
    console.log("🔍 分析可能的問題原因:");
    console.log("1. VIPStaking 合約的 baseURI 可能未在部署後設定");
    console.log("2. Hero 和 Relic 能正常顯示說明 metadata server 本身沒問題");
    console.log("3. 需要檢查部署腳本是否遺漏了 setBaseURI 調用");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });