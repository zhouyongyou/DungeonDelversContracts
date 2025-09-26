const { expect } = require("chai");
const { ethers } = require("hardhat");

async function deployFixture() {
  const [owner, dungeonMaster, user, extraAccount] = await ethers.getSigners();

  const MockSoulShard = await ethers.getContractFactory("MockSoulShard");
  const soulShard = await MockSoulShard.deploy();

  const MockVipStaking = await ethers.getContractFactory("MockVipStaking");
  const vipStaking = await MockVipStaking.deploy();

  const MockPlayerProfile = await ethers.getContractFactory("MockPlayerProfile");
  const playerProfile = await MockPlayerProfile.deploy();

  const MockDungeonCore = await ethers.getContractFactory("MockDungeonCore");
  const dungeonCore = await MockDungeonCore.deploy(await soulShard.getAddress());
  await dungeonCore.setDungeonMaster(dungeonMaster.address);
  await dungeonCore.setVipStaking(await vipStaking.getAddress());
  await dungeonCore.setPlayerProfile(await playerProfile.getAddress());

  const PlayerVault = await ethers.getContractFactory("PlayerVault");
  const playerVault = await PlayerVault.deploy();
  await playerVault.setDungeonCore(await dungeonCore.getAddress());

  return {
    owner,
    dungeonMaster,
    user,
    extraAccount,
    soulShard,
    vipStaking,
    playerProfile,
    dungeonCore,
    playerVault,
  };
}

describe("PlayerVault", function () {
  it("refunds any excess value on username registration and update", async function () {
    const { user, playerVault } = await deployFixture();
    const fee = await playerVault.usernameRegistrationFee();
    const extra = ethers.parseEther("0.01");
    const total = fee + extra;

    await expect(playerVault.connect(user).registerUsername("alice", { value: total }))
      .to.emit(playerVault, "UsernameUpdated")
      .withArgs(user.address, "", "alice");

    const contractAddress = await playerVault.getAddress();
    const balanceAfterRegister = await ethers.provider.getBalance(contractAddress);
    expect(balanceAfterRegister).to.equal(fee);

    await expect(playerVault.connect(user).updateUsername("queenAlice", { value: total }))
      .to.emit(playerVault, "UsernameUpdated")
      .withArgs(user.address, "alice", "queenAlice");

    const balanceAfterUpdate = await ethers.provider.getBalance(contractAddress);
    expect(balanceAfterUpdate).to.equal(fee * 2n);
  });

  it("only allows owner to withdraw excess revenue", async function () {
    const { playerVault, soulShard, dungeonMaster, user } = await deployFixture();
    const vaultAddress = await playerVault.getAddress();
    const amount = ethers.parseEther("100");

    await soulShard.mint(vaultAddress, amount);
    await playerVault.connect(dungeonMaster).deposit(user.address, amount);

    await expect(playerVault.withdrawGameRevenue(0)).to.be.revertedWith("Vault: No excess funds");

    const extra = ethers.parseEther("10");
    await soulShard.mint(vaultAddress, extra);

    await expect(playerVault.withdrawGameRevenue(0))
      .to.emit(playerVault, "RevenueWithdrawn")
      .withArgs(extra);

    const balanceLeft = await soulShard.balanceOf(vaultAddress);
    expect(balanceLeft).to.equal(amount);
  });

  it("withdraws accumulated tax after user withdrawal", async function () {
    const { playerVault, soulShard, dungeonMaster, user, vipStaking, playerProfile } = await deployFixture();

    await vipStaking.setLevel(0);
    await playerProfile.setLevel(0);
    await playerVault.setWithdrawThresholds(0, 0);

    const vaultAddress = await playerVault.getAddress();
    const amount = ethers.parseEther("100");
    await soulShard.mint(vaultAddress, amount);
    await playerVault.connect(dungeonMaster).deposit(user.address, amount);

    await playerVault.connect(user).withdraw(amount);

    const taxBalance = await playerVault.getTaxBalance();
    expect(taxBalance).to.be.gt(0);

    const ownerAddress = await playerVault.owner();
    const ownerInitial = await soulShard.balanceOf(ownerAddress);

    await expect(playerVault.withdrawTax()).to.emit(playerVault, "TaxWithdrawn").withArgs(taxBalance);

    const ownerFinal = await soulShard.balanceOf(ownerAddress);
    expect(ownerFinal - ownerInitial).to.equal(taxBalance);
  });
});
