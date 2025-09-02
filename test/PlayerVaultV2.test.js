// test/PlayerVaultV2.test.js
// Tests for PlayerVaultV2 username functionality

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PlayerVaultV2 Username System", function () {
  let playerVaultV2;
  let owner, user1, user2, user3;
  const registrationFee = ethers.parseEther("0.01"); // 0.01 BNB

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    // Deploy PlayerVaultV2
    const PlayerVaultV2 = await ethers.getContractFactory("PlayerVaultV2");
    playerVaultV2 = await PlayerVaultV2.deploy();
    await playerVaultV2.waitForDeployment();
  });

  describe("Username Registration", function () {
    it("Should register a valid username", async function () {
      const username = "alice123";
      
      // Check initial state
      expect(await playerVaultV2.isUsernameAvailable(username)).to.be.true;
      expect(await playerVaultV2.resolveUsername(username)).to.equal(ethers.ZeroAddress);
      
      // Register username
      await expect(
        playerVaultV2.connect(user1).registerUsername(username, {
          value: registrationFee
        })
      ).to.emit(playerVaultV2, "UsernameRegistered")
       .withArgs(user1.address, username);

      // Verify registration
      expect(await playerVaultV2.usernameToAddress(username)).to.equal(user1.address);
      expect(await playerVaultV2.addressToUsername(user1.address)).to.equal(username);
      expect(await playerVaultV2.usernameExists(username)).to.be.true;
      expect(await playerVaultV2.isUsernameAvailable(username)).to.be.false;
      expect(await playerVaultV2.resolveUsername(username)).to.equal(user1.address);
    });

    it("Should reject invalid usernames", async function () {
      const invalidUsernames = [
        "ab",           // Too short
        "a".repeat(21), // Too long
        "user@name",    // Invalid characters
        "0xuser",       // Starts with 0x
        "user-name",    // Contains dash
        ""              // Empty
      ];

      for (const username of invalidUsernames) {
        await expect(
          playerVaultV2.connect(user1).registerUsername(username, {
            value: registrationFee
          })
        ).to.be.revertedWith("Vault: Invalid username format");
      }
    });

    it("Should reject duplicate usernames", async function () {
      const username = "duplicate";
      
      // First registration succeeds
      await playerVaultV2.connect(user1).registerUsername(username, {
        value: registrationFee
      });

      // Second registration fails
      await expect(
        playerVaultV2.connect(user2).registerUsername(username, {
          value: registrationFee
        })
      ).to.be.revertedWith("Vault: Username already taken");
    });

    it("Should reject registration with insufficient fee", async function () {
      const username = "cheapuser";
      const insufficientFee = ethers.parseEther("0.005");

      await expect(
        playerVaultV2.connect(user1).registerUsername(username, {
          value: insufficientFee
        })
      ).to.be.revertedWith("Vault: Insufficient registration fee");
    });

    it("Should prevent users from having multiple usernames", async function () {
      // Register first username
      await playerVaultV2.connect(user1).registerUsername("first", {
        value: registrationFee
      });

      // Try to register second username
      await expect(
        playerVaultV2.connect(user1).registerUsername("second", {
          value: registrationFee
        })
      ).to.be.revertedWith("Vault: User already has a username");
    });
  });

  describe("Referral by Username", function () {
    beforeEach(async function () {
      // Register usernames for testing
      await playerVaultV2.connect(user1).registerUsername("alice", {
        value: registrationFee
      });
      await playerVaultV2.connect(user2).registerUsername("bob", {
        value: registrationFee
      });
    });

    it("Should set referrer by username", async function () {
      await expect(
        playerVaultV2.connect(user3).setReferrerByUsername("alice")
      ).to.emit(playerVaultV2, "ReferralSetByUsername")
       .withArgs(user3.address, user1.address, "alice")
       .and.to.emit(playerVaultV2, "ReferralSet")
       .withArgs(user3.address, user1.address);

      expect(await playerVaultV2.referrers(user3.address)).to.equal(user1.address);
    });

    it("Should reject non-existent username", async function () {
      await expect(
        playerVaultV2.connect(user3).setReferrerByUsername("nonexistent")
      ).to.be.revertedWith("Vault: Username not found");
    });

    it("Should reject self-referral by username", async function () {
      await expect(
        playerVaultV2.connect(user1).setReferrerByUsername("alice")
      ).to.be.revertedWith("Vault: Cannot refer yourself");
    });

    it("Should reject duplicate referrer setting", async function () {
      // Set referrer first time
      await playerVaultV2.connect(user3).setReferrerByUsername("alice");

      // Try to set again
      await expect(
        playerVaultV2.connect(user3).setReferrerByUsername("bob")
      ).to.be.revertedWith("Vault: Referrer already set");
    });
  });

  describe("Username Management", function () {
    beforeEach(async function () {
      await playerVaultV2.connect(user1).registerUsername("testuser", {
        value: registrationFee
      });
    });

    it("Should return correct username for address", async function () {
      expect(await playerVaultV2.getUserUsername(user1.address)).to.equal("testuser");
      expect(await playerVaultV2.getUserUsername(user2.address)).to.equal("");
    });

    it("Should check username availability correctly", async function () {
      expect(await playerVaultV2.isUsernameAvailable("testuser")).to.be.false;
      expect(await playerVaultV2.isUsernameAvailable("available")).to.be.true;
      expect(await playerVaultV2.isUsernameAvailable("x")).to.be.false; // Too short
    });
  });

  describe("Fee Management", function () {
    it("Should allow owner to update registration fee", async function () {
      const newFee = ethers.parseEther("0.02");
      
      await expect(
        playerVaultV2.connect(owner).setUsernameRegistrationFee(newFee)
      ).to.emit(playerVaultV2, "UsernameRegistrationFeeUpdated")
       .withArgs(newFee);

      expect(await playerVaultV2.usernameRegistrationFee()).to.equal(newFee);
    });

    it("Should reject non-owner fee updates", async function () {
      const newFee = ethers.parseEther("0.02");
      
      await expect(
        playerVaultV2.connect(user1).setUsernameRegistrationFee(newFee)
      ).to.be.revertedWithCustomError(playerVaultV2, "OwnableUnauthorizedAccount");
    });

    it("Should allow owner to withdraw BNB fees", async function () {
      // Register some usernames to collect fees
      await playerVaultV2.connect(user1).registerUsername("user1", {
        value: registrationFee
      });
      await playerVaultV2.connect(user2).registerUsername("user2", {
        value: registrationFee
      });

      const initialBalance = await ethers.provider.getBalance(owner.address);
      const contractBalance = await ethers.provider.getBalance(await playerVaultV2.getAddress());
      
      expect(contractBalance).to.equal(registrationFee * 2n);

      // Withdraw BNB
      const tx = await playerVaultV2.connect(owner).withdrawBNB();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;

      const finalBalance = await ethers.provider.getBalance(owner.address);
      expect(finalBalance).to.be.closeTo(
        initialBalance + contractBalance - gasUsed,
        ethers.parseEther("0.001") // Allow for gas estimation errors
      );
    });
  });

  describe("Integration with Original Features", function () {
    it("Should work with original setReferrer function", async function () {
      // Original referrer setting should still work
      await expect(
        playerVaultV2.connect(user2).setReferrer(user1.address)
      ).to.emit(playerVaultV2, "ReferralSet")
       .withArgs(user2.address, user1.address);

      expect(await playerVaultV2.referrers(user2.address)).to.equal(user1.address);
    });

    it("Should preserve all original PlayerVault functionality", async function () {
      // Test that contract still has original functions
      expect(await playerVaultV2.PERCENT_DIVISOR()).to.equal(10000);
      expect(await playerVaultV2.commissionRate()).to.equal(500);
      expect(await playerVaultV2.usernameRegistrationFee()).to.equal(registrationFee);
    });
  });
});

describe("Username Validation Edge Cases", function () {
  let playerVaultV2;
  let owner, user1;

  beforeEach(async function () {
    [owner, user1] = await ethers.getSigners();
    
    const PlayerVaultV2 = await ethers.getContractFactory("PlayerVaultV2");
    playerVaultV2 = await PlayerVaultV2.deploy();
    await playerVaultV2.waitForDeployment();
  });

  const validUsernames = [
    "abc",           // Minimum length
    "a".repeat(20),  // Maximum length
    "user123",       // Alphanumeric
    "my_username",   // With underscore
    "ABC123",        // Uppercase
    "test_user_123"  // Mixed
  ];

  const invalidUsernames = [
    "ab",                    // Too short
    "a".repeat(21),          // Too long
    "user name",             // Space
    "user-name",             // Dash
    "user@domain",           // Special characters
    "user.name",             // Dot
    "0xuser",                // Starts with 0x
    "user!",                 // Exclamation
    "用户名",                 // Chinese characters
    "user#123",              // Hash
    "user$",                 // Dollar sign
    "user%",                 // Percent
  ];

  it("Should accept all valid username formats", async function () {
    const registrationFee = ethers.parseEther("0.01");
    
    for (let i = 0; i < validUsernames.length; i++) {
      const username = validUsernames[i];
      const signer = await ethers.getSigner(i); // Use different signers
      
      await expect(
        playerVaultV2.connect(signer).registerUsername(username, {
          value: registrationFee
        })
      ).to.emit(playerVaultV2, "UsernameRegistered")
       .withArgs(signer.address, username);
    }
  });

  it("Should reject all invalid username formats", async function () {
    const registrationFee = ethers.parseEther("0.01");
    
    for (const username of invalidUsernames) {
      await expect(
        playerVaultV2.connect(user1).registerUsername(username, {
          value: registrationFee
        })
      ).to.be.revertedWith("Vault: Invalid username format");
    }
  });
});