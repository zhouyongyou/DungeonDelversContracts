// VRFCompatibility.test.js - 向後兼容性測試
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VRF Backward Compatibility Tests", function () {
    let vrfConsumer;
    let mockDungeonMaster;
    let owner;
    let user;
    let vrfCoordinator;

    const SUBSCRIPTION_ID = 1;
    const VRF_FEE = ethers.utils.parseEther("0.001"); // 模擬舊系統的 VRF 費用

    beforeEach(async function () {
        [owner, user, vrfCoordinator] = await ethers.getSigners();

        // 部署兼容版本的 VRF Consumer
        const VRFConsumerFactory = await ethers.getContractFactory("VRFConsumerV2Plus_Compatible");
        vrfConsumer = await VRFConsumerFactory.deploy(SUBSCRIPTION_ID, vrfCoordinator.address);
        await vrfConsumer.deployed();

        // 授權 owner 調用
        await vrfConsumer.setAuthorizedContract(owner.address, true);

        // 創建模擬的 DungeonMaster 合約來測試舊調用方式
        const MockDungeonMasterFactory = await ethers.getContractFactory("MockDungeonMaster");
        mockDungeonMaster = await MockDungeonMasterFactory.deploy(vrfConsumer.address);
        await mockDungeonMaster.deployed();

        // 授權 MockDungeonMaster
        await vrfConsumer.setAuthorizedContract(mockDungeonMaster.address, true);
    });

    describe("Backward Compatibility", function () {
        it("Should accept ETH in requestRandomForUser but not use it", async function () {
            const initialBalance = await ethers.provider.getBalance(vrfConsumer.address);
            
            // 使用舊的 payable 調用方式
            const tx = await vrfConsumer.requestRandomForUser(
                user.address,
                1,
                5,
                ethers.utils.formatBytes32String("test"),
                { value: VRF_FEE }
            );

            const receipt = await tx.wait();
            
            // 檢查事件
            const unusedEthEvent = receipt.events.find(e => e.event === "UnusedEthReceived");
            expect(unusedEthEvent).to.not.be.undefined;
            expect(unusedEthEvent.args.sender).to.equal(owner.address);
            expect(unusedEthEvent.args.amount).to.equal(VRF_FEE);
            expect(unusedEthEvent.args.functionName).to.equal("requestRandomForUser");

            // 檢查 ETH 被自動退還
            const finalBalance = await ethers.provider.getBalance(vrfConsumer.address);
            expect(finalBalance).to.equal(initialBalance); // 應該沒有 ETH 留在合約中
        });

        it("Should track unused ETH statistics", async function () {
            await vrfConsumer.requestRandomForUser(
                user.address,
                1,
                5,
                ethers.utils.formatBytes32String("test"),
                { value: VRF_FEE }
            );

            const totalUnused = await vrfConsumer.totalUnusedEthReceived();
            const unusedByOwner = await vrfConsumer.unusedEthByContract(owner.address);

            expect(totalUnused).to.equal(VRF_FEE);
            expect(unusedByOwner).to.equal(VRF_FEE);
        });

        it("Should work with legacy DungeonMaster calling pattern", async function () {
            const initialBalance = await ethers.provider.getBalance(vrfConsumer.address);
            
            // 模擬 DungeonMaster 的舊調用方式（帶 value）
            await mockDungeonMaster.requestExpedition(user.address, 1, { value: VRF_FEE });

            // 檢查統計
            const totalUnused = await vrfConsumer.totalUnusedEthReceived();
            expect(totalUnused).to.equal(VRF_FEE);

            // 檢查合約沒有留存 ETH
            const finalBalance = await ethers.provider.getBalance(vrfConsumer.address);
            expect(finalBalance).to.equal(initialBalance);
        });

        it("Should handle requestRandomness with ETH", async function () {
            const tx = await vrfConsumer.requestRandomness(
                0, // requestType
                1, // numWords
                "0x", // data
                { value: VRF_FEE }
            );

            const receipt = await tx.wait();
            
            // 檢查事件
            const unusedEthEvent = receipt.events.find(e => e.event === "UnusedEthReceived");
            expect(unusedEthEvent.args.amount).to.equal(VRF_FEE);
            expect(unusedEthEvent.args.functionName).to.equal("requestRandomness");
        });

        it("Should return 0 for price functions (subscription mode)", async function () {
            expect(await vrfConsumer.getVrfRequestPrice()).to.equal(0);
            expect(await vrfConsumer.vrfRequestPrice()).to.equal(0);
            expect(await vrfConsumer.getTotalFee()).to.equal(0);
        });
    });

    describe("Emergency Functions", function () {
        it("Should allow manual refund if automatic refund fails", async function () {
            // 如果自動退還失敗，ETH 會留在合約中
            // 管理員可以手動退還
            
            // 發送一些 ETH 到合約
            await owner.sendTransaction({
                to: vrfConsumer.address,
                value: VRF_FEE
            });

            const contractBalance = await ethers.provider.getBalance(vrfConsumer.address);
            expect(contractBalance).to.equal(VRF_FEE);

            // 手動退還
            await vrfConsumer.manualRefundEth(user.address, VRF_FEE);

            const finalBalance = await ethers.provider.getBalance(vrfConsumer.address);
            expect(finalBalance).to.equal(0);
        });

        it("Should allow emergency ETH withdrawal", async function () {
            // 發送 ETH 到合約
            await owner.sendTransaction({
                to: vrfConsumer.address,
                value: VRF_FEE
            });

            await vrfConsumer.emergencyWithdraw();

            const finalBalance = await ethers.provider.getBalance(vrfConsumer.address);
            expect(finalBalance).to.equal(0);
        });
    });

    describe("Rate Limiting", function () {
        it("Should enforce cooldown period", async function () {
            // 第一次請求
            await vrfConsumer.requestRandomForUser(
                user.address,
                1,
                5,
                ethers.utils.formatBytes32String("test1")
            );

            // 立即第二次請求應該失敗
            await expect(
                vrfConsumer.requestRandomForUser(
                    user.address,
                    1,
                    5,
                    ethers.utils.formatBytes32String("test2")
                )
            ).to.be.revertedWith("Cooldown active");
        });
    });

    describe("Authorization", function () {
        it("Should require authorization for VRF requests", async function () {
            // 未授權的地址不能請求
            await expect(
                vrfConsumer.connect(user).requestRandomForUser(
                    user.address,
                    1,
                    5,
                    ethers.utils.formatBytes32String("test")
                )
            ).to.be.revertedWith("Not authorized");
        });
    });
});

// 模擬 DungeonMaster 合約
// contracts/MockDungeonMaster.sol
const MockDungeonMasterContract = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IVRFManager {
    function requestRandomForUser(
        address user,
        uint256 quantity,
        uint8 maxRarity,
        bytes32 commitment
    ) external payable returns (uint256);
}

contract MockDungeonMaster {
    IVRFManager public vrfManager;
    
    constructor(address _vrfManager) {
        vrfManager = IVRFManager(_vrfManager);
    }
    
    function requestExpedition(address user, uint256 partyId) external payable {
        // 模擬 DungeonMaster 的舊調用方式
        vrfManager.requestRandomForUser{value: msg.value}(
            user,
            1,
            1,
            keccak256(abi.encodePacked(user, partyId))
        );
    }
}
`;

module.exports = {
    MockDungeonMasterContract
};