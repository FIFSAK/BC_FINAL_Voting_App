const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("📤 Deploying contracts with:", deployer.address);

    const VoteToken = await ethers.getContractFactory("VoteToken");
    const voteToken = await VoteToken.deploy(ethers.parseEther("1000000")); // 1 миллион токенов
    await voteToken.waitForDeployment();
    console.log("✅ VoteToken deployed at:", await voteToken.getAddress());

    const Voting = await ethers.getContractFactory("Voting");
    const votingContract = await Voting.deploy(); // 🚨 БЕЗ ПАРАМЕТРОВ
    await votingContract.waitForDeployment();
    console.log("✅ Voting deployed at:", await votingContract.getAddress());
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
