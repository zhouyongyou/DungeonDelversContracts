#!/usr/bin/env node

/**
 * V25 完整部署腳本 - 包含未揭示 URI 設置
 * 
 * 基於 v25-deploy-complete-sequential.js 修改
 * 新增未揭示 URI 的設置功能
 */

const hre = require('hardhat');
const { ethers } = hre;
const fs = require('fs');
const path = require('path');

// 匯入原始腳本的配置
const originalScript = require('./v25-deploy-complete-sequential.js');

// === 新增：未揭示 URI 配置 ===
const UNREVEALED_URIS = {
  HERO: process.env.HERO_UNREVEALED_URI || 'https://dungeon-delvers-metadata-server.onrender.com/metadata/hero/unrevealed',
  RELIC: process.env.RELIC_UNREVEALED_URI || 'https://dungeon-delvers-metadata-server.onrender.com/metadata/relic/unrevealed',
  PARTY: process.env.PARTY_UNREVEALED_URI || 'https://dungeon-delvers-metadata-server.onrender.com/metadata/party/unrevealed',
  VIPSTAKING: process.env.VIP_UNREVEALED_URI || 'https://dungeon-delvers-metadata-server.onrender.com/metadata/vip/unrevealed',
  PLAYERPROFILE: process.env.PROFILE_UNREVEALED_URI || 'https://dungeon-delvers-metadata-server.onrender.com/metadata/profile/unrevealed'
};

// 繼承原始的 Deployer 類別
class DeployerWithUnrevealed extends originalScript.SequentialV25Deployer {
  constructor() {
    super();
    this.unrevealedURIs = UNREVEALED_URIS;
  }

  // 覆寫 setBaseURIs 方法，增加未揭示 URI 設置
  async setBaseURIs() {
    // 先執行原始的 BaseURI 設置
    await super.setBaseURIs();
    
    // 新增：設置未揭示 URI
    this.log('\n設置 Unrevealed URI...', 'info');
    
    for (const [contractName, uri] of Object.entries(this.unrevealedURIs)) {
      try {
        const contract = this.contracts[contractName]?.contract;
        
        // 檢查合約是否有 setUnrevealedURI 方法
        if (contract && contract.setUnrevealedURI) {
          this.log(`設置 ${contractName} Unrevealed URI...`, 'info');
          
          const tx = await contract.setUnrevealedURI(uri);
          await tx.wait();
          
          // 驗證設置
          if (contract.unrevealedURI) {
            const verifyURI = await contract.unrevealedURI();
            if (verifyURI === uri) {
              this.log(`✅ ${contractName} Unrevealed URI 設置成功: ${uri}`, 'success');
            } else {
              this.log(`❌ ${contractName} Unrevealed URI 驗證失敗`, 'error');
              this.errors.push({ 
                type: 'UnrevealedURI驗證', 
                contractName, 
                expected: uri, 
                actual: verifyURI 
              });
            }
          } else {
            this.log(`✅ ${contractName} Unrevealed URI 設置成功（無法驗證）`, 'success');
          }
        } else {
          this.log(`⚠️ ${contractName} 不支援 setUnrevealedURI`, 'warning');
        }
      } catch (error) {
        this.log(`❌ ${contractName} Unrevealed URI 設置失敗: ${error.message}`, 'error');
        this.errors.push({ type: 'UnrevealedURI設置', contractName, error });
      }
    }
  }

  // 新增：生成部署報告時包含未揭示 URI
  generateDetailedReport() {
    const report = super.generateDetailedReport();
    
    // 添加未揭示 URI 部分
    report += '\n\n### 未揭示 URI 配置\n';
    report += '```javascript\n';
    report += '// Unrevealed URI Configuration\n';
    report += 'const UNREVEALED_URIS = {\n';
    
    for (const [contractName, uri] of Object.entries(this.unrevealedURIs)) {
      if (this.contracts[contractName]) {
        report += `  ${contractName}: '${uri}',\n`;
      }
    }
    
    report += '};\n';
    report += '```\n';
    
    return report;
  }

  // 新增：創建前端和後端所需的文件
  async createUnrevealedFiles() {
    this.log('\n創建未揭示相關文件...', 'info');
    
    // 1. 創建圖片佔位符說明文件
    const imageGuide = `# 未揭示圖片指南

請在以下位置放置未揭示圖片：

## 前端圖片位置
- Hero: /public/images/hero/hero-unrevealed.png
- Relic: /public/images/relic/relic-unrevealed.png
- Party: /public/images/party/party-unrevealed.png
- VIP: /public/images/vip/vip-unrevealed.png
- Profile: /public/images/profile/profile-unrevealed.png

## 圖片規格
- 尺寸: 1000x1000px
- 格式: PNG
- 檔案大小: < 500KB

## 設計建議
- Hero: 戰士剪影 + "REVEALING HERO..." 文字
- Relic: 神秘寶箱 + "REVEALING RELIC..." 文字
- 包含 3 分鐘時限警告
`;

    fs.writeFileSync(
      path.join(process.cwd(), 'UNREVEALED_IMAGES_GUIDE.md'),
      imageGuide
    );
    this.log('✅ 創建圖片指南: UNREVEALED_IMAGES_GUIDE.md', 'success');

    // 2. 創建後端 JSON 模板
    const jsonTemplates = {
      hero: {
        name: "Unrevealed Hero",
        description: "This hero is being revealed. Complete the reveal process within 3 minutes to discover its rarity and power! If you don't reveal in time, you'll need to request a refund.",
        image: "https://dungeondelvers.xyz/images/hero/hero-unrevealed.png",
        attributes: [
          { trait_type: "Status", value: "Unrevealed" },
          { trait_type: "Reveal Required", value: "Yes" },
          { trait_type: "Time Limit", value: "3 minutes" }
        ],
        external_url: "https://dungeondelvers.xyz/reveal-guide"
      },
      relic: {
        name: "Unrevealed Relic",
        description: "This relic's true nature is hidden. Reveal it within 3 minutes to discover its capacity!",
        image: "https://dungeondelvers.xyz/images/relic/relic-unrevealed.png",
        attributes: [
          { trait_type: "Status", value: "Unrevealed" },
          { trait_type: "Reveal Required", value: "Yes" },
          { trait_type: "Time Limit", value: "3 minutes" }
        ],
        external_url: "https://dungeondelvers.xyz/reveal-guide"
      }
    };

    // 保存 JSON 模板
    const jsonGuide = `# 未揭示 Metadata JSON 模板

請將以下 JSON 文件放置到後端 API 目錄：

## Hero unrevealed.json
位置: /api/hero/unrevealed.json
\`\`\`json
${JSON.stringify(jsonTemplates.hero, null, 2)}
\`\`\`

## Relic unrevealed.json
位置: /api/relic/unrevealed.json
\`\`\`json
${JSON.stringify(jsonTemplates.relic, null, 2)}
\`\`\`

## 其他 NFT 類型
請參考上述格式創建對應的 unrevealed.json 文件。
`;

    fs.writeFileSync(
      path.join(process.cwd(), 'UNREVEALED_JSON_TEMPLATES.md'),
      jsonGuide
    );
    this.log('✅ 創建 JSON 模板: UNREVEALED_JSON_TEMPLATES.md', 'success');

    // 3. 創建後端更新指南
    const backendGuide = `# 後端 Metadata Server 更新指南

## ⚠️ 重要說明
根據您的設置，後端已經準備好未揭示的 metadata 文件：
- /api/hero/unrevealed.json
- /api/relic/unrevealed.json

這些文件會通過現有的 metadata 路由自動提供服務。

## 當前實現（無需 IPFS）
合約會將 unrevealedURI 設置為：
- Hero: https://dungeon-delvers-metadata-server.onrender.com/metadata/hero/unrevealed
- Relic: https://dungeon-delvers-metadata-server.onrender.com/metadata/relic/unrevealed

後端會自動返回對應的 unrevealed.json 內容。

## 未來優化建議

### 1. 動態檢查揭示狀態（可選）
如果需要動態檢查 NFT 是否已揭示：

\`\`\`javascript
// 在 metadata 路由中添加檢查
app.get('/metadata/:type/:id', async (req, res) => {
  const { type, id } = req.params;
  
  // 特殊處理 unrevealed 請求
  if (id === 'unrevealed') {
    const unrevealedPath = path.join(__dirname, 'api', type, 'unrevealed.json');
    if (fs.existsSync(unrevealedPath)) {
      const data = fs.readFileSync(unrevealedPath, 'utf8');
      return res.json(JSON.parse(data));
    }
  }
  
  // 現有邏輯...
});
\`\`\`

### 2. 揭示狀態 API（未來功能）
\`\`\`javascript
app.get('/api/:type/:tokenId/reveal-status', async (req, res) => {
  // 查詢區塊鏈獲取揭示狀態
  // 返回倒計時等信息
});
\`\`\`
`;

    fs.writeFileSync(
      path.join(process.cwd(), 'BACKEND_UPDATE_GUIDE.md'),
      backendGuide
    );
    this.log('✅ 創建後端更新指南: BACKEND_UPDATE_GUIDE.md', 'success');
  }

  // 覆寫主要執行方法
  async execute() {
    await super.execute();
    
    // 創建額外的指南文件
    if (!this.isRollback && this.success) {
      await this.createUnrevealedFiles();
    }
  }
}

// 主函數
async function main() {
  const deployer = new DeployerWithUnrevealed();
  await deployer.run();
}

// 執行部署
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

// 導出類別供其他腳本使用
module.exports = { DeployerWithUnrevealed };