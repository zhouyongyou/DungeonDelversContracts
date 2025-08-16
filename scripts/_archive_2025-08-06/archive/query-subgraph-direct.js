// 直接查詢子圖數據
const axios = require('axios');

async function querySubgraph() {
  console.log('\n🔍 直接查詢子圖數據...\n');
  
  // 嘗試兩個版本
  const SUBGRAPH_V304 = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.4';
  const SUBGRAPH_V305 = 'https://api.studio.thegraph.com/query/115633/dungeon-delvers/v3.0.5';
  
  // 簡單查詢，看看有什麼數據
  const simpleQuery = `
    {
      _meta {
        block {
          number
        }
      }
      heros(first: 1) {
        id
        tokenId
      }
      parties(first: 1) {
        id
        tokenId
      }
      players(first: 1) {
        id
      }
    }
  `;
  
  // 測試 v3.0.4
  console.log('測試 v3.0.4...');
  try {
    const response304 = await axios.post(SUBGRAPH_V304, {
      query: simpleQuery
    });
    
    console.log('v3.0.4 響應:', JSON.stringify(response304.data, null, 2));
  } catch (error) {
    console.error('v3.0.4 查詢錯誤:', error.message);
  }
  
  console.log('\n測試 v3.0.5...');
  try {
    const response305 = await axios.post(SUBGRAPH_V305, {
      query: simpleQuery
    });
    
    console.log('v3.0.5 響應:', JSON.stringify(response305.data, null, 2));
  } catch (error) {
    console.error('v3.0.5 查詢錯誤:', error.message);
  }
}

querySubgraph();