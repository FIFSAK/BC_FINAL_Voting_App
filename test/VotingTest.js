const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("DeFi Voting DApp", function () {
    let owner, user1, user2;
    let voteToken, voting;

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Деплой токена
        const VoteToken = await ethers.getContractFactory("VoteToken");
        voteToken = await VoteToken.deploy(ethers.parseEther("1000000")); // 1M токенов
        await voteToken.waitForDeployment();

        // Деплой контракта голосования
        const Voting = await ethers.getContractFactory("Voting");
        voting = await Voting.deploy();
        await voting.waitForDeployment();
    });

    describe("VoteToken", function () {
        it("should have correct name and symbol", async function () {
            expect(await voteToken.name()).to.equal("VoteToken");
            expect(await voteToken.symbol()).to.equal("VOTE");
        });

        it("should assign total supply to owner", async function () {
            const totalSupply = await voteToken.totalSupply();
            const ownerBalance = await voteToken.balanceOf(owner.address);
            expect(ownerBalance).to.equal(totalSupply);
        });
    });



});
