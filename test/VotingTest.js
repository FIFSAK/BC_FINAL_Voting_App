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

    describe("Voting", function () {
        it("should allow only owner to create proposal", async function () {
            await expect(
                voting.connect(user1).addProposal("Proposal 1", ["Option A", "Option B"])
            ).to.be.revertedWith("Only the owner can call this.");

            await expect(
                voting.addProposal("Proposal 1", ["Option A", "Option B"])
            ).to.not.be.reverted;
        });

        it("should allow voting and correctly count votes", async function () {
            await voting.addProposal("Best Fruit?", ["Apple", "Banana", "Orange"]);

            // Передаём токены пользователю
            await voteToken.transfer(user1.address, ethers.parseEther("100"));
            await voteToken.connect(user1).approve(voting.target, ethers.parseEther("50"));

            // Пользователь голосует за вариант 0 (Apple)
            await voting.connect(user1).vote(0, 0, ethers.parseEther("50"));

            const [proposalNames, optionNames, voteCounts] = await voting.getProposals();
            expect(voteCounts[0][0]).to.equal(ethers.parseEther("50"));
        });

        it("should prevent double voting by the same user", async function () {
            await voting.addProposal("Best Color?", ["Red", "Blue", "Green"]);

            await voteToken.transfer(user2.address, ethers.parseEther("100"));
            await voteToken.connect(user2).approve(voting.target, ethers.parseEther("20"));

            await voting.connect(user2).vote(0, 1, ethers.parseEther("20"));

            // Попытка проголосовать второй раз должна провалиться
            await expect(
                voting.connect(user2).vote(0, 2, ethers.parseEther("10"))
            ).to.be.revertedWith("You already voted for this proposal");
        });

        it("should correctly determine the winner after voting ends", async function () {
            await voting.addProposal("Best Sport?", ["Football", "Basketball"]);

            await voteToken.transfer(user1.address, ethers.parseEther("100"));
            await voteToken.transfer(user2.address, ethers.parseEther("100"));

            await voteToken.connect(user1).approve(voting.target, ethers.parseEther("30"));
            await voteToken.connect(user2).approve(voting.target, ethers.parseEther("50"));

            await voting.connect(user1).vote(0, 0, ethers.parseEther("30")); // Football
            await voting.connect(user2).vote(0, 1, ethers.parseEther("50")); // Basketball

            await voting.endVoting();

            const [winnerProposal, winnerOption, winnerVotes] = await voting.getWinner();
            expect(winnerProposal).to.equal("Best Sport?");
            expect(winnerOption).to.equal("Basketball");
            expect(winnerVotes).to.equal(ethers.parseEther("50"));
        });

        it("should not allow voting after endVoting", async function () {
            await voting.addProposal("Choose Pet?", ["Dog", "Cat"]);

            await voting.endVoting();

            await voteToken.transfer(user1.address, ethers.parseEther("100"));
            await voteToken.connect(user1).approve(voting.target, ethers.parseEther("20"));

            await expect(
                voting.connect(user1).vote(0, 0, ethers.parseEther("20"))
            ).to.be.revertedWith("Voting is closed.");
        });
    });
});
