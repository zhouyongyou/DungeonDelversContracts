const { ethers } = require("hardhat");

async function main() {
    console.log("🎯 尋找儲備購買失敗的根本原因...\n");
    
    const [signer] = await ethers.getSigners();
    
    console.log("分析思路：");
    console.log("1. NFT 鑄造（Hero）成功 - 使用直接儲存的 soulShardToken");
    console.log("2. 儲備購買（DungeonMaster）失敗 - 使用 dungeonCore.soulShardTokenAddress()");
    console.log("3. 兩者都使用相同的 SoulShard 地址和授權");
    console.log("4. 問題可能出在：動態獲取地址 vs 靜態儲存地址\n");
    
    // 測試1: 驗證 SoulShard 代幣的基本功能
    console.log("=== 測試1: SoulShard 代幣基本功能 ===");
    const soulShardAddress = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
    
    const soulShardABI = [
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function allowance(address,address) view returns (uint256)",
        "function transferFrom(address,address,uint256) returns (bool)"
    ];
    
    const soulShard = new ethers.Contract(soulShardAddress, soulShardABI, signer);
    
    try {
        const name = await soulShard.name();
        const symbol = await soulShard.symbol();
        const totalSupply = await soulShard.totalSupply();
        
        console.log(`代幣名稱: ${name}`);
        console.log(`代幣符號: ${symbol}`);
        console.log(`總供應量: ${ethers.formatEther(totalSupply)}`);
        
        // 檢查是否是標準 ERC20
        const userBalance = await soulShard.balanceOf(signer.address);
        console.log(`用戶餘額: ${ethers.formatEther(userBalance)}`);
        
        console.log("✅ SoulShard 代幣基本功能正常");
    } catch (e) {
        console.log("❌ SoulShard 代幣問題:", e.message);
        return;
    }
    
    // 測試2: 比較 Hero 和 DungeonMaster 的 soulShardToken 獲取方式
    console.log("\n=== 測試2: 比較 soulShardToken 獲取方式 ===");
    
    try {
        const hero = await ethers.getContractAt("Hero", "0x929a4187A462314fCC480ff547019fA122A283f0");
        const dungeonCore = await ethers.getContractAt("DungeonCore", "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6");
        
        // Hero 的直接獲取
        const heroSoulShard = await hero.soulShardToken();
        console.log("Hero 儲存的地址:", heroSoulShard);
        
        // DungeonMaster 通過 DungeonCore 獲取
        const coreSoulShard = await dungeonCore.soulShardTokenAddress();
        console.log("DungeonCore 儲存的地址:", coreSoulShard);
        
        // 檢查類型
        console.log("Hero 地址類型:", typeof heroSoulShard);
        console.log("Core 地址類型:", typeof coreSoulShard);
        
        // 檢查字節比較
        const heroBytes = ethers.getBytes(heroSoulShard);
        const coreBytes = ethers.getBytes(coreSoulShard);
        
        console.log("Hero 地址字節長度:", heroBytes.length);
        console.log("Core 地址字節長度:", coreBytes.length);
        
        console.log("✅ 兩種獲取方式都正常");
        
    } catch (e) {
        console.log("❌ 地址獲取失敗:", e.message);
        return;
    }
    
    // 測試3: 模擬 DungeonMaster 的內部邏輯
    console.log("\n=== 測試3: 模擬 DungeonMaster 內部邏輯 ===");
    
    try {
        const dungeonMaster = await ethers.getContractAt("DungeonMaster", "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0");
        const dungeonCore = await ethers.getContractAt("DungeonCore", "0x3dCcbcbf81911A635E2b21e2e49925F6441B08B6");
        
        // 步驟1: 計算所需金額
        const provisionPrice = await dungeonMaster.provisionPriceUSD();
        console.log(`儲備單價: ${ethers.formatEther(provisionPrice)} USD`);
        
        // 步驟2: 獲取 SoulShard 需求
        const requiredSoulShard = await dungeonCore.getSoulShardAmountForUSD(provisionPrice);
        console.log(`需要 SoulShard: ${ethers.formatEther(requiredSoulShard)}`);
        
        // 步驟3: 獲取 SoulShard 地址
        const soulShardFromCore = await dungeonCore.soulShardTokenAddress();
        console.log(`從 Core 獲取的地址: ${soulShardFromCore}`);
        
        // 步驟4: 檢查這個地址是否與實際合約一致
        const actualSoulShard = "0xc88dAD283Ac209D77Bfe452807d378615AB8B94a";
        console.log(`實際 SoulShard 地址: ${actualSoulShard}`);
        console.log(`地址匹配: ${soulShardFromCore.toLowerCase() === actualSoulShard.toLowerCase() ? '✅' : '❌'}`);
        
        // 步驟5: 檢查授權
        const allowance = await soulShard.allowance(signer.address, "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0");
        console.log(`授權額度: ${ethers.formatEther(allowance)}`);
        console.log(`授權充足: ${allowance >= requiredSoulShard ? '✅' : '❌'}`);
        
        console.log("✅ 所有前置條件都滿足");
        
    } catch (e) {
        console.log("❌ 模擬失敗:", e.message);
        return;
    }
    
    // 測試4: 關鍵差異分析
    console.log("\n=== 測試4: 關鍵差異分析 ===");
    
    console.log("分析結果：");
    console.log("1. SoulShard 代幣功能正常");
    console.log("2. 兩種地址獲取方式都返回相同地址");
    console.log("3. 授權和餘額都充足");
    console.log("4. 所有前置條件都滿足");
    
    console.log("\n可能的問題：");
    console.log("1. SafeERC20 版本兼容性問題");
    console.log("2. 合約編譯版本差異");
    console.log("3. SoulShard 代幣本身的特殊限制");
    console.log("4. Gas 估算問題");
    
    // 測試5: 直接測試 transferFrom 調用
    console.log("\n=== 測試5: 直接測試 transferFrom ===");
    
    try {
        // 小額測試
        const testAmount = ethers.parseEther("0.001");
        
        console.log(`測試轉移 ${ethers.formatEther(testAmount)} SOUL`);
        
        // 使用 staticCall 測試
        const result = await soulShard.transferFrom.staticCall(
            signer.address,
            "0x4424BAE8E132DC83A2F39c76Bc2d9dD44E4A47B0",
            testAmount
        );
        
        console.log("transferFrom 返回值:", result);
        
        if (result === true) {
            console.log("✅ transferFrom 應該成功");
        } else {
            console.log("❌ transferFrom 會失敗");
        }
        
    } catch (e) {
        console.log("❌ transferFrom 測試失敗:", e.message);
        
        // 檢查是否是餘額不足
        if (e.message.includes("insufficient")) {
            console.log("問題：餘額不足");
        } else if (e.message.includes("allowance")) {
            console.log("問題：授權不足");
        } else {
            console.log("問題：其他原因");
        }
    }
    
    console.log("\n=== 結論 ===");
    console.log("如果 transferFrom 測試成功，但 buyProvisions 失敗，");
    console.log("那麼問題可能在於：");
    console.log("1. SafeERC20 的額外檢查");
    console.log("2. 合約上下文（msg.sender）的差異");
    console.log("3. Gas 限制或其他執行環境問題");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });