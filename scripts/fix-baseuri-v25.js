// fix-baseuri-v25.js - 修復 NFT 合約的 baseURI 設定
// 執行: PRIVATE_KEY=xxx npx hardhat run scripts/fix-baseuri-v25.js --network bsc

const { ethers } = require("hardhat");

async function main() {
    console.log("🔧 修復 NFT 合約的 BaseURI 設定");
    console.log("=".repeat(60));
    
    const [deployer] = await ethers.getSigners();
    console.log("執行者地址:", deployer.address);
    
    // 合約地址
    const contracts = {
        HERO: "0x428486A4860E54e5ACAFEfdD07FF8E23E18877Cc",
        RELIC: "0xbA7e324c92F81C42E9F639602B1766765E93002d",
        PARTY: "0xE2609F06E4937816A64Ee8ba53FEC41D1Fa2C468"
    };
    
    // 正確的 baseURI (使用 /metadata/ 而不是 /api/)
    const correctBaseURIs = {
        HERO: "https://dungeon-delvers-metadata-server.onrender.com/metadata/hero/",
        RELIC: "https://dungeon-delvers-metadata-server.onrender.com/metadata/relic/",
        PARTY: "https://dungeon-delvers-metadata-server.onrender.com/metadata/party/"
    };
    
    const abi = [
        "function owner() view returns (address)",
        "function baseURI() view returns (string)",
        "function setBaseURI(string memory _newBaseURI)",
        "event BaseURISet(string newBaseURI)"
    ];
    
    for (const [name, address] of Object.entries(contracts)) {
        console.log(`\n📋 處理 ${name} 合約...`);
        
        const contract = new ethers.Contract(address, abi, deployer);
        
        // 檢查 owner
        const owner = await contract.owner();
        console.log(`  Owner: ${owner}`);
        
        if (owner.toLowerCase() !== deployer.address.toLowerCase()) {
            console.log(`  ❌ 你不是合約的 owner，跳過`);
            continue;
        }
        
        // 檢查當前 baseURI
        const currentBaseURI = await contract.baseURI();
        console.log(`  當前 BaseURI: ${currentBaseURI}`);
        
        // 檢查是否需要更新
        if (currentBaseURI === correctBaseURIs[name]) {
            console.log(`  ✅ BaseURI 已經正確，無需更新`);
            continue;
        }
        
        // 更新 baseURI
        console.log(`  📝 更新 BaseURI 到: ${correctBaseURIs[name]}`);
        const tx = await contract.setBaseURI(correctBaseURIs[name]);
        console.log(`  交易已發送: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`  ✅ BaseURI 更新成功！`);
        console.log(`  Gas 使用: ${receipt.gasUsed.toString()}`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 BaseURI 修復完成！");
    console.log("\n⏭️ 下一步:");
    console.log("1. 驗證合約在 BSCScan");
    console.log("2. 等待 OKX 重新索引 (通常需要 1-24 小時)");
    console.log("3. 清除瀏覽器緩存後檢查");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ 錯誤:", error);
        process.exit(1);
    });