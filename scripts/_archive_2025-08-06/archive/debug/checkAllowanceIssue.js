const { ethers } = require("hardhat");

async function main() {
    console.log("🔍 檢查授權問題的具體原因...\n");
    
    const [signer] = await ethers.getSigners();
    
    const soulShardAddress = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
    const dungeonMasterAddress = "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0";
    
    console.log("錢包地址:", signer.address);
    console.log("SoulShard 地址:", soulShardAddress);
    console.log("DungeonMaster 地址:", dungeonMasterAddress);
    console.log("");
    
    // 創建 SoulShard 實例
    const soulShardABI = [
        "function allowance(address owner, address spender) view returns (uint256)",
        "function balanceOf(address account) view returns (uint256)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function transferFrom(address from, address to, uint256 amount) returns (bool)"
    ];
    
    const soulShard = new ethers.Contract(soulShardAddress, soulShardABI, signer);
    
    // 檢查當前授權狀態
    console.log("1. 檢查當前授權狀態:");
    const allowance = await soulShard.allowance(signer.address, dungeonMasterAddress);
    console.log(`授權額度: ${allowance.toString()}`);
    console.log(`格式化: ${ethers.formatEther(allowance)} SOUL`);
    
    // 檢查餘額
    console.log("\n2. 檢查餘額:");
    const balance = await soulShard.balanceOf(signer.address);
    console.log(`用戶餘額: ${balance.toString()}`);
    console.log(`格式化: ${ethers.formatEther(balance)} SOUL`);
    
    // 測試小額轉移
    const testAmount = ethers.parseEther("0.001");
    console.log(`\n3. 測試轉移金額: ${testAmount.toString()}`);
    console.log(`格式化: ${ethers.formatEther(testAmount)} SOUL`);
    
    // 檢查條件
    console.log("\n4. 檢查條件:");
    console.log(`餘額 >= 測試金額: ${balance >= testAmount}`);
    console.log(`授權 >= 測試金額: ${allowance >= testAmount}`);
    
    // 如果授權不足，重新授權
    if (allowance < testAmount) {
        console.log("\n5. 重新授權:");
        try {
            const approveTx = await soulShard.approve(dungeonMasterAddress, ethers.MaxUint256);
            await approveTx.wait();
            console.log("✅ 重新授權成功");
            
            const newAllowance = await soulShard.allowance(signer.address, dungeonMasterAddress);
            console.log(`新授權額度: ${ethers.formatEther(newAllowance)} SOUL`);
        } catch (e) {
            console.log("❌ 重新授權失敗:", e.message);
        }
    }
    
    // 關鍵測試：檢查 msg.sender 的影響
    console.log("\n6. 關鍵測試 - 檢查 msg.sender 影響:");
    console.log("當我們從錢包直接調用 transferFrom 時，msg.sender 是錢包地址");
    console.log("當 DungeonMaster 調用 transferFrom 時，msg.sender 是 DungeonMaster 地址");
    console.log("但 transferFrom 的授權檢查是 allowance(from, spender)，不涉及 msg.sender");
    
    // 使用模擬交易來測試
    console.log("\n7. 模擬交易測試:");
    try {
        // 直接從錢包調用
        console.log("從錢包直接調用 transferFrom:");
        const result1 = await soulShard.transferFrom.staticCall(
            signer.address,
            dungeonMasterAddress,
            testAmount
        );
        console.log("結果:", result1);
    } catch (e) {
        console.log("❌ 失敗:", e.message);
        
        // 解析錯誤
        if (e.message.includes("insufficient allowance")) {
            console.log("\n❌ 授權不足錯誤確認");
            console.log("這表明合約內部的授權檢查有問題");
            
            // 深入檢查
            console.log("\n深入檢查授權機制:");
            
            // 檢查是否有特殊的授權邏輯
            console.log("可能的問題：");
            console.log("1. SoulShard 合約可能有額外的授權限制");
            console.log("2. 可能有時間鎖或其他限制");
            console.log("3. 可能有白名單機制");
            console.log("4. 可能有特殊的 transferFrom 實現");
            
            // 測試零授權然後重新授權
            console.log("\n測試重置授權:");
            try {
                // 先設為0
                const resetTx = await soulShard.approve(dungeonMasterAddress, 0);
                await resetTx.wait();
                console.log("✅ 重置授權為0");
                
                // 檢查
                const zeroAllowance = await soulShard.allowance(signer.address, dungeonMasterAddress);
                console.log(`重置後授權: ${zeroAllowance.toString()}`);
                
                // 重新授權
                const reapproveTx = await soulShard.approve(dungeonMasterAddress, ethers.MaxUint256);
                await reapproveTx.wait();
                console.log("✅ 重新授權最大值");
                
                // 再次檢查
                const newAllowance = await soulShard.allowance(signer.address, dungeonMasterAddress);
                console.log(`新授權: ${ethers.formatEther(newAllowance)} SOUL`);
                
                // 再次嘗試 transferFrom
                console.log("再次嘗試 transferFrom:");
                const result2 = await soulShard.transferFrom.staticCall(
                    signer.address,
                    dungeonMasterAddress,
                    testAmount
                );
                console.log("✅ 成功!", result2);
                
            } catch (resetError) {
                console.log("❌ 重置授權失敗:", resetError.message);
            }
        }
    }
    
    console.log("\n=== 總結 ===");
    console.log("問題確認：即使顯示有足夠授權，transferFrom 仍然失敗");
    console.log("這表明 SoulShard 合約可能有非標準的授權實現");
    console.log("或者有其他隱藏的限制機制");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });