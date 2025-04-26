    // SPDX-License-Identifier: MIT
    pragma solidity ^0.8.28;

    interface IERC20 {
        function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    }

    contract Voting {
        struct Proposal {
            string name;
            uint256 voteCount;
        }

        Proposal[] public proposals;
        IERC20 public voteToken;

        constructor(address _token) {
            voteToken = IERC20(_token);
        }

        function addProposal(string memory name) public {
            proposals.push(Proposal(name, 0));
        }

        function vote(uint proposalId, uint256 amount) public {
            require(proposalId < proposals.length, "Invalid proposal");
            require(amount > 0, "Must vote with some tokens");

            bool success = voteToken.transferFrom(msg.sender, address(this), amount);
            require(success, "Token transfer failed");

            proposals[proposalId].voteCount += amount;
        }

        function getProposals() public view returns (Proposal[] memory) {
            return proposals;
        }

        function getWinner() public view returns (uint winnerId, string memory winnerName, uint256 votes) {
            uint max = 0;
            for (uint i = 0; i < proposals.length; i++) {
                if (proposals[i].voteCount > max) {
                    max = proposals[i].voteCount;
                    winnerId = i;
                    winnerName = proposals[i].name;
                    votes = max;
                }
            }
        }
    }
