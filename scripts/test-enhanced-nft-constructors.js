// scripts/test-enhanced-nft-constructors.js - 測試增強的 NFT 構造器
const hre = require("hardhat");

async function main() {
    console.log("🧪 測試增強的 NFT 構造器...");
    
    const [deployer] = await hre.ethers.getSigners();
    console.log("測試者地址:", deployer.address);
    
    // 預期的元數據端點（修正版）
    const EXPECTED_URIS = {
        HERO: {
            baseURI: "https://dungeon-delvers-metadata-server.onrender.com/api/hero/",
            contractURI: "https://www.dungeondelvers.xyz/metadata/hero-collection.json"
        },
        RELIC: {
            baseURI: "https://dungeon-delvers-metadata-server.onrender.com/api/relic/",
            contractURI: "https://www.dungeondelvers.xyz/metadata/relic-collection.json"
        },
        PARTY: {
            baseURI: "https://dungeon-delvers-metadata-server.onrender.com/api/party/",
            contractURI: "https://www.dungeondelvers.xyz/metadata/party-collection.json"
        },
        PROFILE: {
            baseURI: "https://dungeon-delvers-metadata-server.onrender.com/api/profile/",
            contractURI: "https://www.dungeondelvers.xyz/metadata/player-profile-collection.json"
        },
        VIP: {
            baseURI: "https://dungeon-delvers-metadata-server.onrender.com/api/vip/",
            contractURI: "https://www.dungeondelvers.xyz/metadata/vip-staking-collection.json"
        }
    };
    
    const nftContracts = [
        { name: "Hero", expectedURIs: EXPECTED_URIS.HERO },
        { name: "Relic", expectedURIs: EXPECTED_URIS.RELIC },
        { name: "Party", expectedURIs: EXPECTED_URIS.PARTY },
        { name: "PlayerProfile", expectedURIs: EXPECTED_URIS.PROFILE },
        { name: "VIPStaking", expectedURIs: EXPECTED_URIS.VIP }
    ];
    
    let allTestsPassed = true;
    
    for (const contractInfo of nftContracts) {
        console.log(`\n🔍 測試 ${contractInfo.name} 合約...`);
        
        try {
            // 部署合約
            const ContractFactory = await hre.ethers.getContractFactory(contractInfo.name);
            const contract = await ContractFactory.deploy();
            await contract.waitForDeployment();
            
            const contractAddress = await contract.getAddress();
            console.log(`✅ ${contractInfo.name} 部署成功: ${contractAddress}`);
            
            // 測試 baseURI
            const actualBaseURI = await contract.baseURI();
            if (actualBaseURI === contractInfo.expectedURIs.baseURI) {
                console.log(`✅ baseURI 正確: ${actualBaseURI}`);
            } else {
                console.log(`❌ baseURI 錯誤:`);
                console.log(`   預期: ${contractInfo.expectedURIs.baseURI}`);
                console.log(`   實際: ${actualBaseURI}`);
                allTestsPassed = false;
            }
            
            // 測試 contractURI (公開變數)
            const actualContractURI = await contract.contractURI();
            if (actualContractURI === contractInfo.expectedURIs.contractURI) {
                console.log(`✅ contractURI 正確: ${actualContractURI}`);
            } else {
                console.log(`❌ contractURI 錯誤:`);
                console.log(`   預期: ${contractInfo.expectedURIs.contractURI}`);
                console.log(`   實際: ${actualContractURI}`);
                allTestsPassed = false;
            }
            
            // 測試管理員可以修改 URI
            const newBaseURI = "https://test-server.com/api/test/";
            const newContractURI = "https://test-server.com/api/contract/test";
            
            await contract.setBaseURI(newBaseURI);
            const updatedBaseURI = await contract.baseURI();
            
            await contract.setContractURI(newContractURI);
            const updatedContractURI = await contract.contractURI();
            
            if (updatedBaseURI === newBaseURI && updatedContractURI === newContractURI) {
                console.log(`✅ URI 修改功能正常`);
            } else {
                console.log(`❌ URI 修改功能異常`);
                allTestsPassed = false;
            }
            
        } catch (error) {
            console.log(`❌ ${contractInfo.name} 測試失敗:`, error.message);
            allTestsPassed = false;
        }
    }
    
    console.log(`\n📊 測試結果摘要:`);
    if (allTestsPassed) {
        console.log(`🎉 所有測試通過！NFT 合約架構改進成功！`);
        console.log(`\n✅ 改進效果：`);
        console.log(`• 部署後立即可用 - NFT 市場將立即顯示名稱和圖片`);
        console.log(`• contractURI 公開化 - 支援集合級別元數據`);
        console.log(`• 保持管理彈性 - 管理員仍可修改 URI`);
        console.log(`• 減少部署步驟 - 無需後配置腳本`);
        
        console.log(`\n🔗 預設元數據端點：`);
        Object.entries(EXPECTED_URIS).forEach(([name, uris]) => {
            console.log(`• ${name}: ${uris.baseURI}`);
        });
    } else {
        console.log(`❌ 部分測試失敗，請檢查上述錯誤`);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("測試失敗:", error);
        process.exit(1);
    });