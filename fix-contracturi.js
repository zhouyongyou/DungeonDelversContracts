// 修復 NFT 合約中缺失的 contractURI() 函數
const fs = require('fs');
const path = require('path');

const contractsToFix = [
  'contracts/current/nft/Party.sol',
  'contracts/current/nft/VIPStaking.sol', 
  'contracts/current/nft/PlayerProfile.sol'
];

contractsToFix.forEach(contractPath => {
  const fullPath = path.join(__dirname, contractPath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ 文件不存在: ${contractPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // 檢查是否已有 contractURI() 函數
  if (content.includes('function contractURI()')) {
    console.log(`✅ ${contractPath} 已有 contractURI() 函數`);
    return;
  }
  
  // 替換 string public contractURI; 為 string private _contractURI;
  content = content.replace(/string public contractURI;/g, 'string private _contractURI;');
  
  // 替換所有對 contractURI 變數的賦值
  content = content.replace(/contractURI = "/g, '_contractURI = "');
  
  // 在 setContractURI 函數後添加 contractURI() 函數
  const setContractURIPattern = /(function setContractURI\([^}]*}\s*\n)/;
  if (setContractURIPattern.test(content)) {
    content = content.replace(setContractURIPattern, 
      '$1    \n    /// @notice Returns the contract URI for collection-level metadata (OpenSea/OKX compatibility)\n    /// @dev This enables NFT marketplaces to read collection logo, description, and other metadata\n    function contractURI() public view returns (string memory) {\n        return _contractURI;\n    }\n'
    );
  }
  
  fs.writeFileSync(fullPath, content);
  console.log(`✅ 已修復 ${contractPath}`);
});

console.log('\n🎉 所有 NFT 合約的 contractURI() 函數修復完成！');