// VRF 鑄造調試腳本
const hre = require("hardhat");
const { ethers } = require("hardhat");

// 合約地址
const ADDRESSES = {
    VRFConsumer: "0xE1D1c53e2e467BFF3d6e4EffB7b89C0C10711ad1", // VRFConsumerV2Plus
    Hero: "0x5eded2670a6e7eb4a9c581bc397edc3b48cafd6d",
    Relic: "0x7a9469587ffd28a69d4420d8893e7a0e92ef6316",
    DungeonMaster: "0xE391261741Fad5FCC2D298d00e8c684767021253",
    AltarOfAscension: "0x3de7c97e6b65be8a1d726f5261cda1dd7d1e0cf1",
    SoulShard: "0x97B2C2a9A11C7b6A020b4bAEaAd349865eaD0bcF"
};

async function main() {
    console.log("=== VRF 鑄造調試開始 ===\n");
    
    const [signer] = await ethers.getSigners();
    console.log("執行地址:", signer.address);
    
    // 載入合約
    const vrfConsumer = await ethers.getContractAt(
        "VRFConsumerV2Plus",
        ADDRESSES.VRFConsumer
    );
    
    const hero = await ethers.getContractAt(
        "Hero",
        ADDRESSES.Hero
    );
    
    const soulShard = await ethers.getContractAt(
        "IERC20",
        ADDRESSES.SoulShard
    );
    
    console.log("\n=== 步驟 1: 檢查 VRF 設置 ===");
    
    // 1. 檢查訂閱 ID
    const subscriptionId = await vrfConsumer.s_subscriptionId();
    console.log("✅ 訂閱 ID:", subscriptionId.toString());
    
    // 2. 檢查 VRF 參數
    const keyHash = await vrfConsumer.keyHash();
    const callbackGasLimit = await vrfConsumer.callbackGasLimit();
    console.log("✅ Key Hash:", keyHash);
    console.log("✅ Callback Gas Limit:", callbackGasLimit.toString());
    
    console.log("\n=== 步驟 2: 檢查授權狀態 ===");
    
    // 3. 檢查 Hero 是否被授權
    const heroAuthorized = await vrfConsumer.authorized(ADDRESSES.Hero);
    console.log(`Hero 授權狀態: ${heroAuthorized ? "✅ 已授權" : "❌ 未授權"}`);
    
    if (!heroAuthorized) {
        console.log("🔧 需要執行: vrfConsumer.setAuthorizedContract(Hero地址, true)");
    }
    
    // 4. 檢查 Hero 的 VRF Manager 設置
    const vrfManager = await hero.vrfManager();
    const isVRFSet = vrfManager.toLowerCase() === ADDRESSES.VRFConsumer.toLowerCase();
    console.log(`Hero VRF Manager: ${isVRFSet ? "✅ 已設置" : "❌ 未設置"}`);
    console.log(`  當前值: ${vrfManager}`);
    console.log(`  應該是: ${ADDRESSES.VRFConsumer}`);
    
    if (!isVRFSet) {
        console.log("🔧 需要執行: hero.setVRFManager(VRFConsumer地址)");
    }
    
    console.log("\n=== 步驟 3: 檢查鑄造前置條件 ===");
    
    // 5. 檢查 SoulShard 餘額
    const balance = await soulShard.balanceOf(signer.address);
    const requiredAmount = await hero.getRequiredSoulShardAmount(1);
    console.log(`SoulShard 餘額: ${ethers.formatEther(balance)} SOUL`);
    console.log(`鑄造 1 個需要: ${ethers.formatEther(requiredAmount)} SOUL`);
    console.log(`餘額檢查: ${balance >= requiredAmount ? "✅ 足夠" : "❌ 不足"}`);
    
    // 6. 檢查授權額度
    const allowance = await soulShard.allowance(signer.address, ADDRESSES.Hero);
    console.log(`授權額度: ${ethers.formatEther(allowance)} SOUL`);
    console.log(`授權檢查: ${allowance >= requiredAmount ? "✅ 足夠" : "❌ 不足"}`);
    
    if (allowance < requiredAmount) {
        console.log("🔧 需要執行: soulShard.approve(Hero地址, amount)");
    }
    
    // 7. 檢查平台費
    const platformFee = await hero.platformFee();
    console.log(`平台費: ${ethers.formatEther(platformFee)} BNB`);
    
    // 8. 檢查是否有未完成的鑄造
    const commitment = await hero.userCommitments(signer.address);
    if (commitment.blockNumber > 0 && !commitment.fulfilled) {
        console.log("\n⚠️  有未完成的鑄造！");
        console.log(`  區塊高度: ${commitment.blockNumber}`);
        console.log(`  數量: ${commitment.quantity}`);
        console.log("  需要先調用 revealMint() 完成之前的鑄造");
    } else {
        console.log("✅ 沒有未完成的鑄造");
    }
    
    console.log("\n=== 步驟 4: 測試簡單 VRF 請求 ===");
    
    try {
        console.log("測試直接調用 VRF...");
        const testTx = await vrfConsumer.requestRandomWords(true, {
            gasLimit: 500000
        });
        console.log("✅ VRF 請求成功！交易哈希:", testTx.hash);
        
        const receipt = await testTx.wait();
        const requestEvent = receipt.logs.find(log => {
            try {
                const parsed = vrfConsumer.interface.parseLog(log);
                return parsed.name === "RequestSent";
            } catch {
                return false;
            }
        });
        
        if (requestEvent) {
            const parsed = vrfConsumer.interface.parseLog(requestEvent);
            console.log("✅ Request ID:", parsed.args.requestId.toString());
        }
    } catch (error) {
        console.log("❌ VRF 請求失敗:", error.message);
    }
    
    console.log("\n=== 診斷總結 ===");
    
    const allChecks = [
        heroAuthorized,
        isVRFSet,
        balance >= requiredAmount,
        allowance >= requiredAmount,
        !commitment.blockNumber || commitment.fulfilled
    ];
    
    if (allChecks.every(check => check)) {
        console.log("✅ 所有檢查通過！可以嘗試鑄造");
        console.log("\n下一步：");
        console.log("1. 調用 hero.mintFromWallet(1, {value: platformFee})");
        console.log("2. 等待交易確認");
        console.log("3. 調用 hero.revealMint() 揭示 NFT");
    } else {
        console.log("❌ 有些設置需要修正，請按照上面的提示操作");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });