// scripts/fix-party-baseuri.ts
// 修復 Party 合約的 baseURI 設定

import { ethers } from "hardhat";
import "dotenv/config";

async function main() {
    console.log("🔧 修復 Party 合約的 BaseURI...");

    const [signer] = await ethers.getSigners();
    console.log("執行者:", signer.address);

    // Party 合約地址（從你的檢查結果）
    const PARTY_ADDRESS = "0xe4A55375f7Aba70785f958E2661E08F9FD5f7ab1";
    const METADATA_SERVER_URL = process.env.METADATA_SERVER_BASE_URL || 
                               "https://dungeon-delvers-metadata-server.onrender.com";
    
    try {
        // 使用 Party_V3 作為合約名稱（注意底線）
        const party = await ethers.getContractAt("Party", PARTY_ADDRESS);
        
        // 檢查當前 baseURI
        try {
            const currentBaseURI = await party.baseURI();
            console.log("當前 BaseURI:", currentBaseURI || "(空)");
        } catch (e) {
            console.log("無法讀取當前 BaseURI");
        }
        
        // 設定新的 baseURI
        const newBaseURI = `${METADATA_SERVER_URL}/api/party/`;
        console.log("設定新的 BaseURI:", newBaseURI);
        
        const tx = await party.setBaseURI(newBaseURI);
        console.log("交易發送:", tx.hash);
        await tx.wait();
        
        console.log("✅ BaseURI 設定成功！");
        
        // 驗證設定
        const updatedBaseURI = await party.baseURI();
        console.log("更新後的 BaseURI:", updatedBaseURI);
        
        // 測試 tokenURI
        try {
            const testTokenURI = await party.tokenURI(1);
            console.log("測試 tokenURI(1):", testTokenURI);
        } catch (e) {
            console.log("Token #1 可能不存在");
        }
        
    } catch (error: any) {
        console.error("❌ 錯誤:", error.message);
        
        // 如果是合約不存在的錯誤，提供解決方案
        if (error.message.includes("Artifact")) {
            console.log("\n💡 請嘗試以下步驟:");
            console.log("1. 確保已編譯合約: npx hardhat compile");
            console.log("2. 檢查合約名稱是否正確（可能是 Party_V3 而非 Party）");
            console.log("3. 確認合約地址是否正確");
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});