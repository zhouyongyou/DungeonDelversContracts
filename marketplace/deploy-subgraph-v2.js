// 部署市場 V2 子圖腳本
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deploySubgraphV2() {
    const subgraphDir = path.join(__dirname, 'subgraph-v2');
    
    console.log('🚀 開始部署市場 V2 子圖...');
    
    try {
        // 切換到子圖目錄
        process.chdir(subgraphDir);
        
        // 檢查必要文件是否存在
        const requiredFiles = [
            'subgraph.yaml',
            'schema.graphql',
            'src/marketplace-v2.ts',
            'src/offer-system-v2.ts',
            'abis/DungeonMarketplaceV2.json',
            'abis/OfferSystemV2.json',
            'abis/ERC20.json'
        ];
        
        for (const file of requiredFiles) {
            if (!fs.existsSync(file)) {
                throw new Error(`缺少必要文件: ${file}`);
            }
        }
        
        console.log('✅ 文件檢查完成');
        
        // 安裝依賴（如果需要）
        if (!fs.existsSync('node_modules')) {
            console.log('📦 安裝子圖依賴...');
            execSync('npm install', { stdio: 'inherit' });
        }
        
        // 生成代碼
        console.log('🔧 生成子圖代碼...');
        execSync('npx graph codegen', { stdio: 'inherit' });
        
        // 構建子圖
        console.log('🏗️ 構建子圖...');
        execSync('npx graph build', { stdio: 'inherit' });
        
        console.log('✅ 市場 V2 子圖構建完成！');
        console.log('\n📋 部署信息:');
        console.log('- 子圖目錄:', subgraphDir);
        console.log('- 合約地址:');
        console.log('  - DungeonMarketplaceV2: 0xCd2Dc43ddB5f628f98CDAA273bd74605cBDF21F8');
        console.log('  - OfferSystemV2: 0xE072DC1Ea6243aEaD9c794aFe2585A8b6A5350EF');
        
        console.log('\n🔗 後續步驟:');
        console.log('1. 前往 The Graph Studio: https://thegraph.com/studio/');
        console.log('2. 創建新的子圖項目');
        console.log('3. 使用以下命令部署:');
        console.log('   graph deploy --studio <SUBGRAPH_SLUG>');
        console.log('4. 或使用 Hosted Service:');
        console.log('   graph deploy --product hosted-service <GITHUB_USER>/<SUBGRAPH_NAME>');
        
    } catch (error) {
        console.error('❌ 部署失敗:', error.message);
        process.exit(1);
    }
}

// 如果直接運行此腳本
if (require.main === module) {
    deploySubgraphV2();
}

module.exports = { deploySubgraphV2 };