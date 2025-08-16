const { ethers } = require("hardhat");

async function main() {
    console.log("🔬 追蹤 buyProvisions 交易失敗原因...\n");
    
    const [signer] = await ethers.getSigners();
    
    // 先檢查 DungeonStorage 合約
    const dungeonMaster = await ethers.getContractAt("DungeonMaster", "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0");
    const dungeonStorageAddress = await dungeonMaster.dungeonStorage();
    
    console.log("檢查 DungeonStorage 合約:");
    console.log("地址:", dungeonStorageAddress);
    
    try {
        const dungeonStorage = await ethers.getContractAt("DungeonStorage", dungeonStorageAddress);
        
        // 檢查 DungeonStorage 的設定
        console.log("\n檢查 DungeonStorage 設定:");
        const owner = await dungeonStorage.owner();
        console.log("Owner:", owner);
        
        // 檢查是否有寫入權限
        console.log("\n檢查權限:");
        console.log("DungeonMaster 是否有權限:", await dungeonStorage.hasRole(
            ethers.keccak256(ethers.toUtf8Bytes("WRITER_ROLE")), 
            "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0"
        ));
        
        // 嘗試讀取一個隊伍的數據
        console.log("\n嘗試讀取隊伍 #1 的數據:");
        try {
            const partyData = await dungeonStorage.getPartyData(1);
            console.log("隊伍數據:", partyData);
        } catch (e) {
            console.log("讀取失敗:", e.message);
        }
        
        // 檢查 updatePartyProvisions 函數
        console.log("\n測試 updatePartyProvisions 函數:");
        try {
            // 先獲取當前儲備
            const currentProvisions = await dungeonStorage.getPartyProvisions(1);
            console.log("當前儲備:", currentProvisions.toString());
            
            // 使用 staticCall 測試
            await dungeonStorage.updatePartyProvisions.staticCall(1, currentProvisions + 1n);
            console.log("✅ staticCall 成功");
        } catch (e) {
            console.log("❌ updatePartyProvisions 失敗:", e.message);
        }
        
    } catch (error) {
        console.error("DungeonStorage 檢查失敗:", error.message);
    }
    
    // 檢查 DungeonMaster 的具體錯誤
    console.log("\n\n使用較低層級的方式執行 buyProvisions:");
    try {
        // 構建交易數據
        const iface = dungeonMaster.interface;
        const data = iface.encodeFunctionData("buyProvisions", [1, 1]);
        
        // 執行 eth_call 來獲取更詳細的錯誤
        const provider = ethers.provider;
        const result = await provider.call({
            to: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
            from: signer.address,
            data: data
        });
        
        console.log("調用結果:", result);
        
    } catch (error) {
        console.log("❌ 交易失敗");
        console.log("錯誤:", error);
        
        // 嘗試解析錯誤
        if (error.data) {
            console.log("\n嘗試解析錯誤數據:");
            console.log("原始數據:", error.data);
            
            // 檢查是否是 require 錯誤
            if (error.data.startsWith('0x08c379a0')) {
                // Error(string) selector
                try {
                    const reason = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + error.data.slice(10));
                    console.log("錯誤原因:", reason[0]);
                } catch (e) {
                    console.log("無法解碼錯誤訊息");
                }
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