const { ethers } = require("hardhat");

async function main() {
    const VIP_STAKING_ADDRESS = "0x067F289Ae4e76CB61b8a138bF705798a928a12FB";
    
    // VIPStaking ABI - 包含需要的函數
    const VIP_STAKING_ABI = [
        "function tokenURI(uint256 tokenId) external view returns (string memory)",
        "function totalSupply() external view returns (uint256)",
        "function tokenByIndex(uint256 index) external view returns (uint256)",
        "function balanceOf(address owner) external view returns (uint256)",
        "function ownerOf(uint256 tokenId) external view returns (address)",
        "function baseURI() external view returns (string memory)",
        "function getVipLevel(address user) external view returns (uint8)"
    ];
    
    try {
        // 連接到合約
        const vipStaking = await ethers.getContractAt(VIP_STAKING_ABI, VIP_STAKING_ADDRESS);
        
        console.log("🔍 檢查 VIPStaking 合約的 tokenURI...");
        console.log("合約地址:", VIP_STAKING_ADDRESS);
        
        // 檢查 baseURI 設定
        const baseURI = await vipStaking.baseURI();
        console.log("BaseURI:", baseURI);
        
        if (!baseURI) {
            console.log("❌ baseURI 未設定！這就是問題所在。");
            return;
        }
        
        // 先檢查總供應量
        const totalSupply = await vipStaking.totalSupply();
        console.log("Total Supply:", totalSupply.toString());
        
        if (totalSupply.toString() === "0") {
            console.log("❌ 合約中沒有任何 token，無法測試 tokenURI");
            console.log("但可以檢查 Hero 和 Relic 合約的 baseURI 作為對比");
            return;
        }
        
        // 獲取第一個 token ID
        const firstTokenId = await vipStaking.tokenByIndex(0);
        console.log("第一個 token ID:", firstTokenId.toString());
        
        // 調用 tokenURI
        const tokenURI = await vipStaking.tokenURI(firstTokenId);
        
        console.log("\n📋 TokenURI 結果:");
        console.log("tokenURI(1):", tokenURI);
        
        // 檢查是否為 data URI 或 HTTP URL
        if (tokenURI.startsWith('data:application/json')) {
            console.log("\n✅ 發現 Base64 編碼的 JSON metadata");
            // 解碼 base64 JSON
            const base64Data = tokenURI.split(',')[1];
            const decodedJson = Buffer.from(base64Data, 'base64').toString('utf-8');
            console.log("解碼後的 JSON:");
            console.log(decodedJson);
            
            try {
                const metadata = JSON.parse(decodedJson);
                console.log("\n🖼️  圖片 URL:");
                console.log("image:", metadata.image);
                
                if (metadata.image && metadata.image.startsWith('/')) {
                    console.log("\n🔴 【發現問題】");
                    console.log("image 使用相對路徑:", metadata.image);
                    console.log("這會導致外部市場（如 OpenSea）無法顯示圖片");
                } else if (metadata.image && (metadata.image.startsWith('http://') || metadata.image.startsWith('https://'))) {
                    console.log("\n✅ image 使用絕對 URL，應該可以正常顯示");
                } else {
                    console.log("\n⚠️  image 格式需要檢查:", metadata.image);
                }
            } catch (e) {
                console.log("❌ JSON 解析失敗:", e.message);
            }
        } else if (tokenURI.startsWith('http')) {
            console.log("\n🌐 發現 HTTP URL，需要獲取內容");
            console.log("URL:", tokenURI);
        } else {
            console.log("\n⚠️  未知的 tokenURI 格式");
        }
        
    } catch (error) {
        console.error("❌ 錯誤:", error.message);
        
        // 如果是 token 不存在的錯誤，嘗試其他 tokenId
        if (error.message.includes("nonexistent token") || error.message.includes("ERC721: invalid token ID")) {
            console.log("\n🔄 TokenId 1 不存在，嘗試檢查合約是否有其他 token...");
            
            // 可以嘗試調用其他函數來了解合約狀態
            try {
                const vipStaking = await ethers.getContractAt([
                    "function totalSupply() external view returns (uint256)",
                    "function tokenByIndex(uint256 index) external view returns (uint256)"
                ], VIP_STAKING_ADDRESS);
                
                const totalSupply = await vipStaking.totalSupply();
                console.log("Total Supply:", totalSupply.toString());
                
                if (totalSupply > 0) {
                    const firstTokenId = await vipStaking.tokenByIndex(0);
                    console.log("第一個 token ID:", firstTokenId.toString());
                    
                    // 再次嘗試獲取 tokenURI
                    const vipContract = await ethers.getContractAt(VIP_STAKING_ABI, VIP_STAKING_ADDRESS);
                    const firstTokenURI = await vipContract.tokenURI(firstTokenId);
                    console.log("第一個 token 的 URI:", firstTokenURI);
                }
            } catch (e) {
                console.log("無法獲取合約資訊:", e.message);
            }
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });