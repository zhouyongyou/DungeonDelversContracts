// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../contracts/current/core/DungeonCore.sol";
import "../contracts/current/nft/Hero.sol";
import "../contracts/current/nft/Relic.sol";
import "../contracts/current/nft/Party.sol";
import "../contracts/current/nft/PlayerProfile.sol";
import "../contracts/current/nft/VIPStaking.sol";
import "../contracts/current/defi/PlayerVault.sol";
import "../contracts/current/core/DungeonMaster.sol";
import "../contracts/current/core/AltarOfAscension.sol";
import "../contracts/current/core/VRFConsumerV2Plus.sol";

/**
 * 🔍 DungeonDelvers 連接驗證腳本
 *
 * 執行方式：
 * forge script script/VerifyConnections.s.sol:VerifyConnections --rpc-url $BSC_RPC_URL -vvvv
 */
contract VerifyConnections is Script {

    // 合約地址
    address constant DUNGEONCORE = 0x6c900a1cf182aa5960493bf4646c9efc8eaed16b;
    address constant DUNGEONMASTER = 0xa573ccf8332a5b1e830ea04a87856a28c99d9b53;
    address constant DUNGEONSTORAGE = 0x8878a235d36f8a44f53d87654fdfb0e3c5b2c791;
    address constant ALTAROFASCENSION = 0x1357c546ce8cd529a1914e53f98405e1ebfbfc53;
    address constant VRF_MANAGER_V2PLUS = 0xcd6bad326c68ba4f4c07b2d3f9c945364e56840c;

    address constant HERO = 0x52a0ba2a7efb9519b73e671d924f03575fa64269;
    address constant RELIC = 0x04c6bc2548b9f5c38be2be0902259d428f1fec2b;
    address constant PARTY = 0x73953a4dac5339b28e13c38294e758655e62dfde;

    address constant PLAYERPROFILE = 0xea827e472937abd1117f0d4104a76e173724a061;
    address constant VIPSTAKING = 0xd82ef4be9e6d037140bd54afa04be983673637fb;
    address constant PLAYERVAULT = 0x81dad3af7edcf1026fe18977172fb6e24f3cf7d0;

    function run() external view {
        console.log("Starting DungeonDelvers contract connections verification...");
        console.log("===============================================");

        uint256 passedChecks = 0;
        uint256 totalChecks = 20;

        passedChecks += verifyDungeonCoreConnections();
        passedChecks += verifySatelliteConnections();
        passedChecks += verifyVRFAuthorizations();

        console.log("\n📊 驗證結果摘要：");
        console.log("===============================================");
        if (passedChecks == totalChecks) {
            console.log("🎉 所有連接驗證通過！(%d/%d)", passedChecks, totalChecks);
            console.log("✅ 系統已準備就緒，可以開始測試功能");
        } else {
            console.log("⚠️  部分連接驗證失敗！(%d/%d)", passedChecks, totalChecks);
            console.log("❌ 請檢查失敗的連接並重新設置");
        }
    }

    function verifyDungeonCoreConnections() internal view returns (uint256) {
        console.log("\n🔄 驗證 DungeonCore 中的衛星合約設置...");

        DungeonCore dungeonCore = DungeonCore(DUNGEONCORE);
        uint256 passed = 0;

        // 驗證 NFT 系統
        if (dungeonCore.heroContractAddress() == HERO) {
            console.log("✅ Hero 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ Hero 合約地址設置錯誤");
        }

        if (dungeonCore.relicContractAddress() == RELIC) {
            console.log("✅ Relic 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ Relic 合約地址設置錯誤");
        }

        if (dungeonCore.partyContractAddress() == PARTY) {
            console.log("✅ Party 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ Party 合約地址設置錯誤");
        }

        // 驗證玩家系統
        if (dungeonCore.playerProfileAddress() == PLAYERPROFILE) {
            console.log("✅ PlayerProfile 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ PlayerProfile 合約地址設置錯誤");
        }

        if (dungeonCore.vipStakingAddress() == VIPSTAKING) {
            console.log("✅ VIPStaking 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ VIPStaking 合約地址設置錯誤");
        }

        if (dungeonCore.playerVaultAddress() == PLAYERVAULT) {
            console.log("✅ PlayerVault 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ PlayerVault 合約地址設置錯誤");
        }

        // 驗證遊戲系統
        if (dungeonCore.dungeonMasterAddress() == DUNGEONMASTER) {
            console.log("✅ DungeonMaster 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ DungeonMaster 合約地址設置錯誤");
        }

        if (dungeonCore.altarOfAscensionAddress() == ALTAROFASCENSION) {
            console.log("✅ AltarOfAscension 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ AltarOfAscension 合約地址設置錯誤");
        }

        if (dungeonCore.vrfManager() == VRF_MANAGER_V2PLUS) {
            console.log("✅ VRFManager 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ VRFManager 合約地址設置錯誤");
        }

        if (dungeonCore.dungeonStorageAddress() == DUNGEONSTORAGE) {
            console.log("✅ DungeonStorage 合約地址設置正確");
            passed++;
        } else {
            console.log("❌ DungeonStorage 合約地址設置錯誤");
        }

        return passed;
    }

    function verifySatelliteConnections() internal view returns (uint256) {
        console.log("\n🔄 驗證衛星合約中的 DungeonCore 設置...");
        uint256 passed = 0;

        // NFT 系統
        if (Hero(HERO).dungeonCore() == DUNGEONCORE) {
            console.log("✅ Hero → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ Hero → DungeonCore 連接錯誤");
        }

        if (Relic(RELIC).dungeonCore() == DUNGEONCORE) {
            console.log("✅ Relic → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ Relic → DungeonCore 連接錯誤");
        }

        if (Party(PARTY).dungeonCore() == DUNGEONCORE) {
            console.log("✅ Party → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ Party → DungeonCore 連接錯誤");
        }

        // 玩家系統
        if (PlayerProfile(PLAYERPROFILE).dungeonCore() == DUNGEONCORE) {
            console.log("✅ PlayerProfile → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ PlayerProfile → DungeonCore 連接錯誤");
        }

        if (VIPStaking(VIPSTAKING).dungeonCore() == DUNGEONCORE) {
            console.log("✅ VIPStaking → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ VIPStaking → DungeonCore 連接錯誤");
        }

        if (PlayerVault(PLAYERVAULT).dungeonCore() == DUNGEONCORE) {
            console.log("✅ PlayerVault → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ PlayerVault → DungeonCore 連接錯誤");
        }

        // 遊戲系統
        if (DungeonMaster(DUNGEONMASTER).dungeonCore() == DUNGEONCORE) {
            console.log("✅ DungeonMaster → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ DungeonMaster → DungeonCore 連接錯誤");
        }

        if (AltarOfAscension(ALTAROFASCENSION).dungeonCore() == DUNGEONCORE) {
            console.log("✅ AltarOfAscension → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ AltarOfAscension → DungeonCore 連接錯誤");
        }

        if (VRFConsumerV2Plus(VRF_MANAGER_V2PLUS).dungeonCore() == DUNGEONCORE) {
            console.log("✅ VRFManager → DungeonCore 連接正確");
            passed++;
        } else {
            console.log("❌ VRFManager → DungeonCore 連接錯誤");
        }

        return passed;
    }

    function verifyVRFAuthorizations() internal view returns (uint256) {
        console.log("\n🔄 驗證 VRF 授權設置...");
        uint256 passed = 0;

        VRFConsumerV2Plus vrfManager = VRFConsumerV2Plus(VRF_MANAGER_V2PLUS);

        if (vrfManager.authorizedContracts(DUNGEONMASTER)) {
            console.log("✅ DungeonMaster VRF 授權正確");
            passed++;
        } else {
            console.log("❌ DungeonMaster VRF 授權錯誤");
        }

        if (vrfManager.authorizedContracts(ALTAROFASCENSION)) {
            console.log("✅ AltarOfAscension VRF 授權正確");
            passed++;
        } else {
            console.log("❌ AltarOfAscension VRF 授權錯誤");
        }

        return passed;
    }
}