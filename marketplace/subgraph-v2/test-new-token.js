// 測試子圖是否檢測到新添加的 TUSD1 代幣
const axios = require('axios');

const SUBGRAPH_URL = 'https://api.studio.thegraph.com/query/115633/dungeondelvers-p2p-marketplace/v0.0.1';
const TUSD1_ADDRESS = '0x7c67af4ebc6651c95df78de11cfe325660d935fe';

async function testNewToken() {
    console.log('🔍 測試子圖是否檢測到新的 TUSD1 代幣...');
    console.log('TUSD1 地址:', TUSD1_ADDRESS);
    
    try {
        // 查詢所有支援的代幣
        const allTokensQuery = `
            {
                tokenSupports(orderBy: addedAt, orderDirection: desc) {
                    id
                    tokenAddress
                    isSupported
                    addedAt
                    updatedAt
                }
            }
        `;
        
        console.log('\n📊 查詢所有支援的代幣...');
        const response = await axios.post(SUBGRAPH_URL, { query: allTokensQuery });
        
        if (response.data.errors) {
            console.error('查詢失敗:', response.data.errors);
            return;
        }
        
        const tokens = response.data.data.tokenSupports;
        console.log(`找到 ${tokens.length} 個代幣:`);
        
        tokens.forEach((token, index) => {
            const isNew = token.tokenAddress.toLowerCase() === TUSD1_ADDRESS.toLowerCase();
            console.log(`${index + 1}. ${token.tokenAddress} ${isNew ? '🆕 (TUSD1)' : ''}`);
            console.log(`   支援狀態: ${token.isSupported}`);
            console.log(`   添加時間: ${new Date(token.addedAt * 1000).toLocaleString()}`);
            console.log('');
        });
        
        // 檢查 TUSD1 是否存在
        const tusd1Token = tokens.find(t => 
            t.tokenAddress.toLowerCase() === TUSD1_ADDRESS.toLowerCase()
        );
        
        if (tusd1Token) {
            console.log('✅ TUSD1 已被子圖檢測到！');
            console.log('詳細資訊:');
            console.log('   地址:', tusd1Token.tokenAddress);
            console.log('   支援狀態:', tusd1Token.isSupported);
            console.log('   添加時間:', new Date(tusd1Token.addedAt * 1000).toLocaleString());
            console.log('   更新時間:', new Date(tusd1Token.updatedAt * 1000).toLocaleString());
        } else {
            console.log('❌ TUSD1 尚未被子圖檢測到');
            console.log('可能原因:');
            console.log('1. 子圖還在同步中');
            console.log('2. 需要等待幾分鐘讓 The Graph 處理');
            console.log('3. 檢查合約地址是否正確');
        }
        
        // 查詢最新的 _meta 信息
        console.log('\n📈 子圖同步狀態:');
        const metaQuery = `
            {
                _meta {
                    block {
                        number
                        hash
                    }
                    hasIndexingErrors
                }
            }
        `;
        
        const metaResponse = await axios.post(SUBGRAPH_URL, { query: metaQuery });
        const meta = metaResponse.data.data._meta;
        
        console.log('當前同步區塊:', meta.block.number);
        console.log('索引錯誤:', meta.hasIndexingErrors);
        console.log('區塊哈希:', meta.block.hash.substring(0, 10) + '...');
        
        // 提供測試建議
        console.log('\n🎯 接下來可以測試:');
        console.log('1. 使用 TUSD1 創建 NFT 列表');
        console.log('2. 使用 TUSD1 購買 NFT');
        console.log('3. 檢查交易是否被正確記錄');
        
        console.log('\n💡 測試命令範例:');
        console.log('npx hardhat run scripts/test-marketplace-txn.js --network bsc');
        
    } catch (error) {
        console.error('測試失敗:', error.message);
        if (error.response && error.response.data) {
            console.error('響應:', error.response.data);
        }
    }
}

testNewToken().catch(console.error);