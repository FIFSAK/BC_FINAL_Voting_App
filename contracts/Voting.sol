// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    address public owner;

    struct Option {
        string name;
        uint256 voteCount;
    }

    struct Proposal {
        string name;
        Option[] options;
        bool isOpen; // Теперь каждый Proposal имеет свой статус открытости
    }

    Proposal[] public proposals;

    mapping(address => mapping(uint256 => bool)) public hasVoted; // следим за голосованием по каждому proposal

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this.");
        _;
    }

    modifier proposalActive(uint256 proposalId) {
        require(proposals[proposalId].isOpen, "Voting for this proposal is closed.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function addProposal(string memory name, string[] memory optionNames) public onlyOwner {
        Proposal storage newProposal = proposals.push();
        newProposal.name = name;
        newProposal.isOpen = true;

        for (uint256 i = 0; i < optionNames.length; i++) {
            newProposal.options.push(Option({name: optionNames[i], voteCount: 0}));
        }
    }

    function vote(uint256 proposalId, uint256 optionId, uint256 amount) public proposalActive(proposalId) {
        require(proposalId < proposals.length, "Invalid proposal");
        require(optionId < proposals[proposalId].options.length, "Invalid option");
        require(amount > 0, "Amount must be greater than 0");
        require(!hasVoted[msg.sender][proposalId], "Already voted for this proposal");

        proposals[proposalId].options[optionId].voteCount += amount;
        hasVoted[msg.sender][proposalId] = true;
    }

    function endProposalVoting(uint256 proposalId) public onlyOwner {
        require(proposalId < proposals.length, "Invalid proposal");
        proposals[proposalId].isOpen = false;
    }

    function getProposals() public view returns (string[] memory, string[][] memory, uint256[][] memory, bool[] memory) {
        uint256 length = proposals.length;
        string[] memory proposalNames = new string[](length);
        string[][] memory optionNames = new string[][](length);
        uint256[][] memory voteCounts = new uint256[][](length);
        bool[] memory openStatuses = new bool[](length);

        for (uint256 i = 0; i < length; i++) {
            proposalNames[i] = proposals[i].name;
            openStatuses[i] = proposals[i].isOpen;

            uint256 optionsLength = proposals[i].options.length;
            optionNames[i] = new string[](optionsLength);
            voteCounts[i] = new uint256[](optionsLength);

            for (uint256 j = 0; j < optionsLength; j++) {
                optionNames[i][j] = proposals[i].options[j].name;
                voteCounts[i][j] = proposals[i].options[j].voteCount;
            }
        }

        return (proposalNames, optionNames, voteCounts, openStatuses);
    }

    function getWinner(uint256 proposalId) public view returns (string memory winnerOption, uint256 winnerVotes) {
        require(proposalId < proposals.length, "Invalid proposal");
        require(!proposals[proposalId].isOpen, "Voting for this proposal is still open.");

        uint256 highestVote = 0;

        for (uint256 i = 0; i < proposals[proposalId].options.length; i++) {
            if (proposals[proposalId].options[i].voteCount > highestVote) {
                highestVote = proposals[proposalId].options[i].voteCount;
                winnerOption = proposals[proposalId].options[i].name;
                winnerVotes = proposals[proposalId].options[i].voteCount;
            }
        }
    }
}
