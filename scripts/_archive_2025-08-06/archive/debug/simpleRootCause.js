const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 簡單的根本原因分析...\n");
    
    const [signer] = await ethers.getSigners();
    
    // 核心問題：為什麼 NFT 鑄造成功，儲備購買失敗？
    console.log("核心問題分析：");
    console.log("✅ NFT 鑄造（Hero）- 使用 soulShardToken.safeTransferFrom()");
    console.log("❌ 儲備購買（DungeonMaster）- 使用 IERC20(dungeonCore.soulShardTokenAddress()).safeTransferFrom()");
    console.log("");
    
    // 獲取關鍵地址
    const soulShardAddress = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
    const dungeonMasterAddress = "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0";
    const dungeonCoreAddress = "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6";
    
    console.log("測試直接 transferFrom 調用：");
    
    // 創建 SoulShard 實例
    const soulShardABI = [
        "function transferFrom(address from, address to, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)"
    ];
    
    const soulShard = new ethers.Contract(soulShardAddress, soulShardABI, signer);
    
    // 檢查基本條件
    const balance = await soulShard.balanceOf(signer.address);
    const allowance = await soulShard.allowance(signer.address, dungeonMasterAddress);
    const testAmount = ethers.parseEther("1");
    
    console.log(`用戶餘額: ${ethers.formatEther(balance)} SOUL`);
    console.log(`授權額度: ${ethers.formatEther(allowance)} SOUL`);
    console.log(`測試金額: ${ethers.formatEther(testAmount)} SOUL`);
    
    // 直接測試 transferFrom
    console.log("\n直接測試 transferFrom:");
    try {
        const result = await soulShard.transferFrom.staticCall(
            signer.address,
            dungeonMasterAddress,
            testAmount
        );
        console.log("✅ transferFrom 靜態調用成功:", result);
    } catch (e) {
        console.log("❌ transferFrom 靜態調用失敗:", e.message);
    }
    
    // 關鍵測試：模擬 DungeonMaster 的 SafeERC20 調用
    console.log("\n模擬 SafeERC20 調用:");
    
    // 獲取 DungeonCore 來確認地址
    const dungeonCore = await ethers.getContractAt("DungeonCore", dungeonCoreAddress);
    const soulShardFromCore = await dungeonCore.soulShardTokenAddress();
    
    console.log("DungeonCore 返回的地址:", soulShardFromCore);
    console.log("實際 SoulShard 地址:", soulShardAddress);
    console.log("地址匹配:", soulShardFromCore.toLowerCase() === soulShardAddress.toLowerCase() ? "✅" : "❌");
    
    // 使用從 DungeonCore 獲取的地址創建實例
    const soulShardFromCoreInstance = new ethers.Contract(soulShardFromCore, soulShardABI, signer);
    
    console.log("\n使用 DungeonCore 地址的 transferFrom 測試:");
    try {
        const result = await soulShardFromCoreInstance.transferFrom.staticCall(
            signer.address,
            dungeonMasterAddress,
            testAmount
        );
        console.log("✅ 從 Core 地址的 transferFrom 成功:", result);
    } catch (e) {
        console.log("❌ 從 Core 地址的 transferFrom 失敗:", e.message);
    }
    
    // 關鍵發現：檢查 SafeERC20 的特殊行為
    console.log("\n=== 關鍵發現 ===");
    console.log("如果上述測試都成功，問題可能在於：");
    console.log("");
    
    // 測試 SafeERC20 的返回值檢查
    console.log("SafeERC20 的特殊檢查：");
    console.log("1. 檢查函數是否存在");
    console.log("2. 檢查返回值是否為 true");
    console.log("3. 檢查是否有 revert");
    console.log("4. 檢查返回數據長度");
    
    // 檢查 SoulShard 的返回值特性
    console.log("\n檢查 SoulShard 的返回值特性:");
    
    // 使用低層級調用
    const iface = new ethers.Interface([
        "function transferFrom(address from, address to, uint256 amount) returns (bool)"
    ]);
    
    const calldata = iface.encodeFunctionData("transferFrom", [
        signer.address,
        dungeonMasterAddress,
        testAmount
    ]);
    
    try {
        const result = await signer.call({
            to: soulShardAddress,
            data: calldata
        });
        
        console.log("原始返回數據:", result);
        console.log("返回數據長度:", result.length);
        
        if (result === "0x") {
            console.log("❌ 關鍵問題：transferFrom 沒有返回值！");
            console.log("這會導致 SafeERC20 失敗，因為它期望返回 true");
        } else {
            try {
                const decoded = iface.decodeFunctionResult("transferFrom", result);
                console.log("解碼結果:", decoded[0]);
            } catch (e) {
                console.log("❌ 無法解碼返回值:", e.message);
            }
        }
        
    } catch (e) {
        console.log("❌ 低層級調用失敗:", e.message);
    }
    
    console.log("\n=== 最終結論 ===");
    console.log("如果 transferFrom 沒有返回值或返回值不是 bool，");
    console.log("那麼 SafeERC20 會失敗，這就是問題所在！");
    console.log("");
    console.log("解決方案：");
    console.log("1. 檢查 SoulShard 合約是否正確實現了 ERC20 標準");
    console.log("2. 或者在 DungeonMaster 中使用普通的 transfer 而不是 safeTransferFrom");
    console.log("3. 或者升級 SoulShard 合約以符合標準");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });