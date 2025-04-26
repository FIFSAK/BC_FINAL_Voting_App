const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log(`📤 Deploying contracts with: ${deployer.address}`);

    // Deploy токен
    const TokenFactory = await ethers.getContractFactory("VoteToken");
    const voteToken = await TokenFactory.deploy(ethers.parseEther("1000000"));
    await voteToken.waitForDeployment();
    const tokenAddress = await voteToken.getAddress();
    console.log(`✅ VoteToken deployed at: ${tokenAddress}`);

    // Deploy контракт голосования
    const VotingFactory = await ethers.getContractFactory("Voting");
    const votingContract = await VotingFactory.deploy(tokenAddress);
    await votingContract.waitForDeployment();
    const votingAddress = await votingContract.getAddress();
    console.log(`✅ Voting contract deployed at: ${votingAddress}`);
}

main()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
