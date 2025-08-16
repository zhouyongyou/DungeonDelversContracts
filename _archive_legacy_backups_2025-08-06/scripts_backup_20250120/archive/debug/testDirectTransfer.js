const { ethers } = require("hardhat");

async function main() {
    console.log("🧪 測試直接 SoulShard 轉移...\n");
    
    const [signer] = await ethers.getSigners();
    
    const addresses = {
        soulShard: "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a",
        dungeonMaster: "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
    };
    
    try {
        // 使用完整的 ERC20 ABI
        const ERC20_ABI = [
            "function name() view returns (string)",
            "function symbol() view returns (string)",
            "function decimals() view returns (uint8)",
            "function balanceOf(address) view returns (uint256)",
            "function allowance(address,address) view returns (uint256)",
            "function approve(address,uint256) returns (bool)",
            "function transfer(address,uint256) returns (bool)",
            "function transferFrom(address,address,uint256) returns (bool)"
        ];
        
        const soulShard = new ethers.Contract(addresses.soulShard, ERC20_ABI, signer);
        
        // 基本信息
        const name = await soulShard.name();
        const symbol = await soulShard.symbol();
        const decimals = await soulShard.decimals();
        console.log(`代幣: ${name} (${symbol}), ${decimals} decimals`);
        
        // 測試金額
        const testAmount = ethers.parseEther("1"); // 1 SOUL
        
        // 檢查餘額
        const balance = await soulShard.balanceOf(signer.address);
        console.log(`\n餘額: ${ethers.formatEther(balance)} ${symbol}`);
        console.log(`測試金額: ${ethers.formatEther(testAmount)} ${symbol}`);
        console.log(`餘額充足: ${balance >= testAmount ? '✅' : '❌'}`);
        
        // 測試1: 直接轉移給自己
        console.log("\n測試 1: transfer 給自己");
        try {
            const tx1 = await soulShard.transfer(signer.address, testAmount);
            await tx1.wait();
            console.log("✅ 成功");
        } catch (e) {
            console.log("❌ 失敗:", e.message);
        }
        
        // 測試2: 授權並使用 transferFrom
        console.log("\n測試 2: 授權給 DungeonMaster 並測試 transferFrom");
        
        // 先檢查當前授權
        const currentAllowance = await soulShard.allowance(signer.address, addresses.dungeonMaster);
        console.log(`當前授權: ${ethers.formatEther(currentAllowance)} ${symbol}`);
        
        if (currentAllowance < testAmount) {
            console.log("進行授權...");
            const approveTx = await soulShard.approve(addresses.dungeonMaster, ethers.MaxUint256);
            await approveTx.wait();
            console.log("✅ 授權成功");
        }
        
        // 測試3: 從 DungeonMaster 合約調用 transferFrom
        console.log("\n測試 3: 通過 DungeonMaster 執行 transferFrom");
        try {
            // 獲取 DungeonMaster 合約
            const dungeonMaster = await ethers.getContractAt("DungeonMaster", addresses.dungeonMaster);
            
            // 檢查 DungeonMaster 的餘額（接收方）
            const dmBalance = await soulShard.balanceOf(addresses.dungeonMaster);
            console.log(`DungeonMaster 當前餘額: ${ethers.formatEther(dmBalance)} ${symbol}`);
            
            // 構建一個測試交易來看具體錯誤
            const iface = new ethers.Interface([
                "function transfer(address to, uint256 amount) returns (bool)",
                "function transferFrom(address from, address to, uint256 amount) returns (bool)"
            ]);
            
            // 編碼 transferFrom 調用
            const data = iface.encodeFunctionData("transferFrom", [
                signer.address,
                addresses.dungeonMaster,
                testAmount
            ]);
            
            // 直接調用看看會發生什麼
            console.log("\n直接調用 transferFrom...");
            const result = await signer.call({
                to: addresses.soulShard,
                data: data
            });
            console.log("調用結果:", result);
            
            // 解碼結果
            const decoded = iface.decodeFunctionResult("transferFrom", result);
            console.log("解碼結果:", decoded[0]); // true or false
            
        } catch (e) {
            console.log("❌ 測試失敗:", e.message);
        }
        
        // 測試4: 檢查是否是 SafeERC20 的問題
        console.log("\n測試 4: 檢查合約代碼");
        const code = await ethers.provider.getCode(addresses.soulShard);
        console.log(`SoulShard 合約代碼長度: ${code.length} bytes`);
        console.log(`是合約: ${code.length > 2 ? '✅' : '❌'}`);
        
    } catch (error) {
        console.error("測試過程中發生錯誤:", error);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });