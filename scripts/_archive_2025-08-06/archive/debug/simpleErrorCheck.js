const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 簡單錯誤檢查...\n");
    
    const [signer] = await ethers.getSigners();
    
    try {
        // 獲取 DungeonMaster 合約
        const dungeonMaster = await ethers.getContractAt(
            "DungeonMaster", 
            "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0"
        );
        
        // 嘗試購買儲備
        console.log("執行 buyProvisions(1, 1)...");
        console.log("錢包地址:", signer.address);
        
        // 使用 try-catch 捕獲完整錯誤
        try {
            const tx = await dungeonMaster.buyProvisions(1, 1, {
                gasLimit: 500000 // 提供足夠的 gas
            });
            console.log("交易已發送:", tx.hash);
            const receipt = await tx.wait();
            console.log("✅ 成功! Gas used:", receipt.gasUsed.toString());
        } catch (error) {
            console.log("\n❌ 交易失敗!");
            console.log("錯誤類型:", error.code);
            console.log("錯誤訊息:", error.message);
            
            // 檢查是否有 reason
            if (error.reason) {
                console.log("錯誤原因:", error.reason);
            }
            
            // 檢查是否有 error data
            if (error.data) {
                console.log("錯誤數據:", error.data);
            }
            
            // 檢查 transaction
            if (error.transaction) {
                console.log("\n交易詳情:");
                console.log("To:", error.transaction.to);
                console.log("Data:", error.transaction.data);
            }
            
            // 檢查 receipt
            if (error.receipt) {
                console.log("\n交易收據:");
                console.log("Status:", error.receipt.status);
                console.log("Gas Used:", error.receipt.gasUsed?.toString());
            }
        }
        
    } catch (error) {
        console.error("外層錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });