const fs = require('fs');
const path = require('path');

console.log("🚀 更新子圖 VRF 配置\n");

// V25 VRF 更新後的合約地址
const VRF_CONTRACTS = {
    Hero: "0xcaF37D9D8356eE18938466F4590A69Bf84C35E15",
    Relic: "0xfA0F9E7bb19761A731be73FD04d6FF38ebF0555A",
    DungeonMaster: "0x8DcE0E0b3063e84f85A419833e72D044d9Cdc816",
    AltarOfAscension: "0x21EB6D4EE01aA881539d6aeA275618EDAE9cB3E1",
    Party: "0x28A85D14e0F87d6eD04e21c30992Df8B3e9434E3",
    DungeonStorage: "0x539AC926C6daE898f2C843aF8C59Ff92B4b3B468"
};

const BLOCK_NUMBER = 56631513;

// 讀取當前 subgraph.yaml
const subgraphPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/subgraph.yaml';
let subgraphContent = fs.readFileSync(subgraphPath, 'utf8');

console.log("📝 更新合約地址和區塊高度...");

// 更新 Hero
subgraphContent = subgraphContent.replace(
    /address: "0x[a-fA-F0-9]{40}"\n(\s*)abi: Hero/g,
    `address: "${VRF_CONTRACTS.Hero}"\n$1abi: Hero`
);

// 更新 Relic
subgraphContent = subgraphContent.replace(
    /address: "0x[a-fA-F0-9]{40}"\n(\s*)abi: Relic/g,
    `address: "${VRF_CONTRACTS.Relic}"\n$1abi: Relic`
);

// 更新 Party
subgraphContent = subgraphContent.replace(
    /address: "0x[a-fA-F0-9]{40}"\n(\s*)abi: Party/g,
    `address: "${VRF_CONTRACTS.Party}"\n$1abi: Party`
);

// 更新 DungeonMaster
subgraphContent = subgraphContent.replace(
    /name: DungeonMaster[\s\S]*?address: "0x[a-fA-F0-9]{40}"/,
    `name: DungeonMaster
    network: bsc
    source:
      address: "${VRF_CONTRACTS.DungeonMaster}"`
);

// 更新 AltarOfAscension
subgraphContent = subgraphContent.replace(
    /name: AltarOfAscension[\s\S]*?address: "0x[a-fA-F0-9]{40}"/,
    `name: AltarOfAscension
    network: bsc
    source:
      address: "${VRF_CONTRACTS.AltarOfAscension}"`
);

// 更新所有 startBlock
subgraphContent = subgraphContent.replace(/startBlock: \d+/g, `startBlock: ${BLOCK_NUMBER}`);

// 檢查並添加 VRF 事件處理器
console.log("🔧 添加 VRF 事件處理器...");

// Hero VRF 事件
if (!subgraphContent.includes('VRFManagerSet')) {
    // 在 Hero 的 eventHandlers 中添加 VRF 事件
    subgraphContent = subgraphContent.replace(
        /(name: Hero[\s\S]*?eventHandlers:[\s\S]*?)(file: \.\/src\/hero\.ts)/,
        `$1        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
      $2`
    );
    
    // 同樣添加到 Relic
    subgraphContent = subgraphContent.replace(
        /(name: Relic[\s\S]*?eventHandlers:[\s\S]*?)(file: \.\/src\/relic\.ts)/,
        `$1        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
      $2`
    );
    
    // DungeonMaster VRF 事件
    subgraphContent = subgraphContent.replace(
        /(name: DungeonMaster[\s\S]*?eventHandlers:[\s\S]*?)(file: \.\/src\/dungeon-master\.ts)/,
        `$1        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
        - event: ExpeditionCommitted(indexed address,uint256,uint256,uint256)
          handler: handleExpeditionCommitted
        - event: ExpeditionRevealed(indexed address,uint256,bool)
          handler: handleExpeditionRevealed
      $2`
    );
    
    // AltarOfAscension VRF 事件
    subgraphContent = subgraphContent.replace(
        /(name: AltarOfAscension[\s\S]*?eventHandlers:[\s\S]*?)(file: \.\/src\/altar[\w-]*\.ts)/,
        `$1        - event: VRFManagerSet(indexed address)
          handler: handleVRFManagerSet
        - event: UpgradeRequested(indexed address,uint256[],uint256,uint256)
          handler: handleUpgradeRequested
        - event: UpgradeCommitted(indexed address,address,uint8,uint256,uint256[])
          handler: handleUpgradeCommitted
        - event: UpgradeRevealed(indexed address,uint8,uint8)
          handler: handleUpgradeRevealed
      $2`
    );
}

// 保存更新後的文件
fs.writeFileSync(subgraphPath, subgraphContent);
console.log("✅ subgraph.yaml 已更新\n");

// 更新 handler 文件（添加 VRF handler 函數）
console.log("📝 更新 handler 文件...");

// Hero handler
const heroHandlerPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/src/hero.ts';
if (fs.existsSync(heroHandlerPath)) {
    let heroContent = fs.readFileSync(heroHandlerPath, 'utf8');
    if (!heroContent.includes('handleVRFManagerSet')) {
        const vrfHandler = `
// VRF Manager Set Event Handler
export function handleVRFManagerSet(event: VRFManagerSet): void {
  // 記錄 VRF Manager 設置事件
  log.info('VRF Manager set for Hero contract: {}', [event.params.vrfManager.toHexString()]);
}
`;
        heroContent += vrfHandler;
        fs.writeFileSync(heroHandlerPath, heroContent);
        console.log("✅ Hero handler 已更新");
    }
}

// Relic handler
const relicHandlerPath = '/Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers/src/relic.ts';
if (fs.existsSync(relicHandlerPath)) {
    let relicContent = fs.readFileSync(relicHandlerPath, 'utf8');
    if (!relicContent.includes('handleVRFManagerSet')) {
        const vrfHandler = `
// VRF Manager Set Event Handler
export function handleVRFManagerSet(event: VRFManagerSet): void {
  // 記錄 VRF Manager 設置事件
  log.info('VRF Manager set for Relic contract: {}', [event.params.vrfManager.toHexString()]);
}
`;
        relicContent += vrfHandler;
        fs.writeFileSync(relicHandlerPath, relicContent);
        console.log("✅ Relic handler 已更新");
    }
}

console.log("\n📋 更新總結:");
console.log("================");
console.log(`Hero: ${VRF_CONTRACTS.Hero}`);
console.log(`Relic: ${VRF_CONTRACTS.Relic}`);
console.log(`DungeonMaster: ${VRF_CONTRACTS.DungeonMaster}`);
console.log(`AltarOfAscension: ${VRF_CONTRACTS.AltarOfAscension}`);
console.log(`Party: ${VRF_CONTRACTS.Party}`);
console.log(`DungeonStorage: ${VRF_CONTRACTS.DungeonStorage}`);
console.log(`起始區塊: ${BLOCK_NUMBER}`);

console.log("\n🎯 下一步:");
console.log("1. cd /Users/sotadic/Documents/GitHub/DungeonDelvers/DDgraphql/dungeon-delvers");
console.log("2. npm run codegen");
console.log("3. npm run build");
console.log("4. graph deploy --studio dungeon-delvers --version-label v3.6.5");

console.log("\n✅ VRF 子圖配置更新完成！");