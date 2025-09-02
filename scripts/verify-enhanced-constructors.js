// scripts/verify-enhanced-constructors.js - 驗證增強的構造器（無需網路）
const fs = require('fs');
const path = require('path');

async function main() {
    console.log("🔍 驗證 NFT 合約構造器增強...");
    
    const contractsDir = path.join(__dirname, '../contracts/current/nft');
    const contractFiles = [
        'Hero.sol',
        'Relic.sol', 
        'Party.sol',
        'PlayerProfile.sol',
        'VIPStaking.sol'
    ];
    
    // 預期的設定
    const expectedSettings = {
        'Hero.sol': {
            baseURI: 'https://dungeon-delvers-metadata-server.onrender.com/api/hero/',
            contractURI: 'https://www.dungeondelvers.xyz/metadata/hero-collection.json'
        },
        'Relic.sol': {
            baseURI: 'https://dungeon-delvers-metadata-server.onrender.com/api/relic/',
            contractURI: 'https://www.dungeondelvers.xyz/metadata/relic-collection.json'
        },
        'Party.sol': {
            baseURI: 'https://dungeon-delvers-metadata-server.onrender.com/api/party/',
            contractURI: 'https://www.dungeondelvers.xyz/metadata/party-collection.json'
        },
        'PlayerProfile.sol': {
            baseURI: 'https://dungeon-delvers-metadata-server.onrender.com/api/profile/',
            contractURI: 'https://www.dungeondelvers.xyz/metadata/player-profile-collection.json'
        },
        'VIPStaking.sol': {
            baseURI: 'https://dungeon-delvers-metadata-server.onrender.com/api/vip/',
            contractURI: 'https://www.dungeondelvers.xyz/metadata/vip-staking-collection.json'
        }
    };
    
    let allCorrect = true;
    
    for (const contractFile of contractFiles) {
        console.log(`\n📄 檢查 ${contractFile}...`);
        
        const contractPath = path.join(contractsDir, contractFile);
        const contractContent = fs.readFileSync(contractPath, 'utf8');
        const expected = expectedSettings[contractFile];
        
        // 檢查是否有公開的 contractURI 變數
        const hasPublicContractURI = contractContent.includes('string public contractURI;');
        console.log(`  ${hasPublicContractURI ? '✅' : '❌'} 公開 contractURI 變數`);
        if (!hasPublicContractURI) allCorrect = false;
        
        // 檢查構造器中的 baseURI 設定
        const baseURISet = contractContent.includes(`baseURI = "${expected.baseURI}";`);
        console.log(`  ${baseURISet ? '✅' : '❌'} 預設 baseURI: ${expected.baseURI}`);
        if (!baseURISet) allCorrect = false;
        
        // 檢查構造器中的 contractURI 設定
        const contractURISet = contractContent.includes(`contractURI = "${expected.contractURI}";`);
        console.log(`  ${contractURISet ? '✅' : '❌'} 預設 contractURI: ${expected.contractURI}`);
        if (!contractURISet) allCorrect = false;
        
        // 檢查是否有 setContractURI 函數
        const hasSetContractURI = contractContent.includes('function setContractURI(string memory newContractURI) external onlyOwner');
        console.log(`  ${hasSetContractURI ? '✅' : '❌'} setContractURI 函數`);
        if (!hasSetContractURI) allCorrect = false;
        
        // 檢查沒有私有的 _contractURI
        const hasPrivateContractURI = contractContent.includes('string private _contractURI;');
        console.log(`  ${!hasPrivateContractURI ? '✅' : '❌'} 已移除私有 _contractURI`);
        if (hasPrivateContractURI) allCorrect = false;
    }
    
    console.log(`\n📊 驗證結果:`);
    if (allCorrect) {
        console.log(`🎉 所有 NFT 合約構造器增強完成！`);
        console.log(`\n✨ 改進總結:`);
        console.log(`• ✅ 所有合約都有公開的 contractURI 變數`);
        console.log(`• ✅ 構造器預設設定 baseURI（後端動態 API）`);
        console.log(`• ✅ 構造器預設設定 contractURI（前端靜態元數據）`);
        console.log(`• ✅ 保留 setContractURI 管理功能`);
        console.log(`• ✅ 移除了過時的私有 _contractURI`);
        
        console.log(`\n🚀 部署優勢:`);
        console.log(`• 部署後立即可用 - 無需額外配置步驟`);
        console.log(`• NFT 市場立即支援 - 名稱和圖片正確顯示`);
        console.log(`• 保持管理彈性 - 可後續修改 URI`);
        console.log(`• 雙重元數據支援 - 個別 NFT（後端）+ 集合資訊（前端）`);
        
        return true;
    } else {
        console.log(`❌ 部分驗證失敗，請檢查上述問題`);
        return false;
    }
}

// 額外檢查前端集合元數據的圖片路徑
function checkFrontendMetadata() {
    console.log(`\n🖼️ 檢查前端集合元數據圖片路徑...`);
    
    const metadataDir = '/Users/sotadic/Documents/GitHub/SoulboundSaga/public/metadata';
    const metadataFiles = [
        'hero-collection.json',
        'relic-collection.json',
        'party-collection.json',
        'player-profile-collection.json',
        'vip-staking-collection.json'
    ];
    
    let frontendCorrect = true;
    
    for (const file of metadataFiles) {
        const filePath = path.join(metadataDir, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasCorrectPath = content.includes('/images/collections/');
            const hasWrongPath = content.includes('/assets/images/collections/');
            
            console.log(`  ${file}: ${hasCorrectPath && !hasWrongPath ? '✅' : '❌'} 圖片路徑`);
            if (!hasCorrectPath || hasWrongPath) frontendCorrect = false;
        } else {
            console.log(`  ${file}: ❌ 文件不存在`);
            frontendCorrect = false;
        }
    }
    
    return frontendCorrect;
}

main().then((contractsOK) => {
    const frontendOK = checkFrontendMetadata();
    
    console.log(`\n🏁 總體狀態:`);
    console.log(`• 合約構造器: ${contractsOK ? '✅ 完成' : '❌ 需修正'}`);
    console.log(`• 前端元數據: ${frontendOK ? '✅ 完成' : '❌ 需修正'}`);
    
    if (contractsOK && frontendOK) {
        console.log(`\n🎯 準備就緒！可以開始部署新版本合約。`);
        process.exit(0);
    } else {
        process.exit(1);
    }
}).catch((error) => {
    console.error('驗證失敗:', error);
    process.exit(1);
});