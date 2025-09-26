// VIPStaking Cap Test - 測試 VIP 等級上限機制
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VIPStaking VIP Level Cap Test", function () {
    let vipStaking;
    let soulToken;
    let mockDungeonCore;
    let owner;
    let user1;
    let user2;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // 部署模擬的 SOUL 代幣
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        soulToken = await MockERC20.deploy("SOUL", "SOUL", 18);

        // 部署模擬的 DungeonCore
        const MockDungeonCore = await ethers.getContractFactory("MockDungeonCore");
        mockDungeonCore = await MockDungeonCore.deploy();
        await mockDungeonCore.setSoulShardToken(soulToken.address);

        // 部署 VIPStaking 合約
        const VIPStaking = await ethers.getContractFactory("VIPStaking");
        vipStaking = await VIPStaking.deploy();
        await vipStaking.setDungeonCore(mockDungeonCore.address);

        // 給測試用戶一些代幣
        await soulToken.mint(user1.address, ethers.utils.parseEther("1000000"));
        await soulToken.mint(user2.address, ethers.utils.parseEther("1000000"));

        // 批准 VIPStaking 合約
        await soulToken.connect(user1).approve(vipStaking.address, ethers.constants.MaxUint256);
        await soulToken.connect(user2).approve(vipStaking.address, ethers.constants.MaxUint256);
    });

    describe("VIP 等級計算測試", function () {
        it("應該正確計算 VIP 等級 1-20", async function () {
            // 測試各個等級的質押金額
            const testCases = [
                { usdValue: 0, expectedLevel: 0 },       // 低於 100 USD
                { usdValue: 50, expectedLevel: 0 },      // 低於 100 USD
                { usdValue: 100, expectedLevel: 1 },     // VIP 1 = sqrt(100/100) = 1
                { usdValue: 400, expectedLevel: 2 },     // VIP 2 = sqrt(400/100) = 2
                { usdValue: 900, expectedLevel: 3 },     // VIP 3 = sqrt(900/100) = 3
                { usdValue: 1600, expectedLevel: 4 },    // VIP 4 = sqrt(1600/100) = 4
                { usdValue: 10000, expectedLevel: 10 },  // VIP 10 = sqrt(10000/100) = 10
                { usdValue: 22500, expectedLevel: 15 },  // VIP 15 = sqrt(22500/100) = 15
                { usdValue: 40000, expectedLevel: 20 },  // VIP 20 = sqrt(40000/100) = 20
            ];

            for (const testCase of testCases) {
                // 設置模擬的 USD 價值
                const soulAmount = ethers.utils.parseEther(testCase.usdValue.toString());
                await mockDungeonCore.setMockUSDValue(
                    soulAmount,
                    ethers.utils.parseEther(testCase.usdValue.toString())
                );

                // 質押
                if (testCase.usdValue > 0) {
                    await vipStaking.connect(user1).stake(soulAmount);
                }

                // 驗證等級
                const level = await vipStaking.getVipLevel(user1.address);
                expect(level).to.equal(testCase.expectedLevel,
                    `USD value ${testCase.usdValue} should give VIP level ${testCase.expectedLevel}`);

                // 清理（解質押）
                if (testCase.usdValue > 0) {
                    await vipStaking.connect(user1).requestUnstake(soulAmount);
                    await ethers.provider.send("evm_increaseTime", [86401]); // 24小時+1秒
                    await ethers.provider.send("evm_mine");
                    await vipStaking.connect(user1).claimUnstaked();
                }
            }
        });

        it("應該限制 VIP 等級上限為 20", async function () {
            // 測試超過 VIP 20 所需金額的情況
            const testCases = [
                { usdValue: 40000, expectedLevel: 20 },   // 正好 VIP 20
                { usdValue: 50000, expectedLevel: 20 },   // 超過但仍是 20
                { usdValue: 100000, expectedLevel: 20 },  // 大幅超過但仍是 20
                { usdValue: 1000000, expectedLevel: 20 }, // 極大值但仍是 20
            ];

            for (const testCase of testCases) {
                const soulAmount = ethers.utils.parseEther(testCase.usdValue.toString());
                await mockDungeonCore.setMockUSDValue(
                    soulAmount,
                    ethers.utils.parseEther(testCase.usdValue.toString())
                );

                await vipStaking.connect(user2).stake(soulAmount);

                const level = await vipStaking.getVipLevel(user2.address);
                expect(level).to.equal(20,
                    `USD value ${testCase.usdValue} should be capped at VIP level 20`);

                // 清理
                await vipStaking.connect(user2).requestUnstake(soulAmount);
                await ethers.provider.send("evm_increaseTime", [86401]);
                await ethers.provider.send("evm_mine");
                await vipStaking.connect(user2).claimUnstaked();
            }
        });

        it("應該正確計算稅率減免（上限 10%）", async function () {
            const testCases = [
                { vipLevel: 0, expectedReduction: 0 },      // 0 * 0.5% = 0%
                { vipLevel: 1, expectedReduction: 50 },     // 1 * 0.5% = 0.5%
                { vipLevel: 5, expectedReduction: 250 },    // 5 * 0.5% = 2.5%
                { vipLevel: 10, expectedReduction: 500 },   // 10 * 0.5% = 5%
                { vipLevel: 15, expectedReduction: 750 },   // 15 * 0.5% = 7.5%
                { vipLevel: 20, expectedReduction: 1000 },  // 20 * 0.5% = 10%
            ];

            for (const testCase of testCases) {
                // 計算需要的 USD 值來達到特定 VIP 等級
                const requiredUSD = testCase.vipLevel * testCase.vipLevel * 100;
                const soulAmount = ethers.utils.parseEther(requiredUSD.toString());

                if (requiredUSD > 0) {
                    await mockDungeonCore.setMockUSDValue(
                        soulAmount,
                        ethers.utils.parseEther(requiredUSD.toString())
                    );
                    await vipStaking.connect(user1).stake(soulAmount);
                }

                const reduction = await vipStaking.getVipTaxReduction(user1.address);
                expect(reduction).to.equal(testCase.expectedReduction,
                    `VIP level ${testCase.vipLevel} should give ${testCase.expectedReduction} basis points reduction`);

                // 清理
                if (requiredUSD > 0) {
                    await vipStaking.connect(user1).requestUnstake(soulAmount);
                    await ethers.provider.send("evm_increaseTime", [86401]);
                    await ethers.provider.send("evm_mine");
                    await vipStaking.connect(user1).claimUnstaked();
                }
            }
        });

        it("應該正確顯示 VIP 資訊", async function () {
            // VIP 19 的情況
            const vip19USD = 19 * 19 * 100; // 36,100 USD
            const soulAmount = ethers.utils.parseEther(vip19USD.toString());
            await mockDungeonCore.setMockUSDValue(
                soulAmount,
                ethers.utils.parseEther(vip19USD.toString())
            );
            await vipStaking.connect(user1).stake(soulAmount);

            let vipInfo = await vipStaking.getVipInfo(user1.address);
            expect(vipInfo.currentLevel).to.equal(19);
            expect(vipInfo.isMaxLevel).to.equal(false);
            expect(vipInfo.nextLevelRequirement).to.equal(
                ethers.utils.parseEther("40000") // VIP 20 需要 40,000 USD
            );

            // 升級到 VIP 20
            const additionalUSD = 40000 - vip19USD;
            const additionalSoul = ethers.utils.parseEther(additionalUSD.toString());
            const newTotal = soulAmount.add(additionalSoul);
            await mockDungeonCore.setMockUSDValue(
                newTotal,
                ethers.utils.parseEther("40000")
            );
            await vipStaking.connect(user1).stake(additionalSoul);

            vipInfo = await vipStaking.getVipInfo(user1.address);
            expect(vipInfo.currentLevel).to.equal(20);
            expect(vipInfo.isMaxLevel).to.equal(true);
            expect(vipInfo.nextLevelRequirement).to.equal(0); // 已達上限
        });
    });

    describe("事件測試", function () {
        it("應該在達到上限時正確觸發 VipLevelChanged 事件", async function () {
            // 直接質押大量以達到上限
            const hugeUSD = 100000; // 遠超 VIP 20 所需
            const soulAmount = ethers.utils.parseEther(hugeUSD.toString());
            await mockDungeonCore.setMockUSDValue(
                soulAmount,
                ethers.utils.parseEther(hugeUSD.toString())
            );

            // 應該觸發等級變更事件，但等級應該是 20 而不是更高
            await expect(vipStaking.connect(user1).stake(soulAmount))
                .to.emit(vipStaking, "VipLevelChanged")
                .withArgs(user1.address, 0, 20); // 從 0 到 20（上限）

            // 驗證等級確實是 20
            const level = await vipStaking.getVipLevel(user1.address);
            expect(level).to.equal(20);
        });
    });
});

// 模擬合約
contract MockDungeonCore {
    address public soulShardTokenAddress;
    mapping(uint256 => uint256) private mockUSDValues;

    function setSoulShardToken(address token) external {
        soulShardTokenAddress = token;
    }

    function setMockUSDValue(uint256 soulAmount, uint256 usdValue) external {
        mockUSDValues[soulAmount] = usdValue;
    }

    function getUSDValueForSoulShard(uint256 soulAmount) external view returns (uint256) {
        return mockUSDValues[soulAmount];
    }
}

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;

    constructor(string memory _name, string memory _symbol, uint8 _decimals) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transfer(address to, uint256 amount) external returns (bool) {
        require(balanceOf[msg.sender] >= amount);
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount);
        require(allowance[from][msg.sender] >= amount);
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        allowance[from][msg.sender] -= amount;
        return true;
    }
}