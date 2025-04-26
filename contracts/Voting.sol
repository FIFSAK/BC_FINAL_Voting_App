// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract Voting {
    address public owner; // Создатель контракта
    bool public votingOpen = true; // Статус голосования

    // Структура для варианта голосования
    struct Option {
        string name; // Название варианта
        uint256 voteCount; // Количество голосов за вариант
    }

    // Структура для предложения с несколькими вариантами
    struct Proposal {
        string name; // Название предложения
        Option[] options; // Массив вариантов для голосования
    }

    Proposal[] public proposals; // Все предложения

    mapping(address => mapping(uint256 => uint256)) public votes; // Голоса пользователей по предложению и варианту

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this.");
        _;
    }

    modifier votingActive() {
        require(votingOpen, "Voting is closed.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // Функция для создания предложения с несколькими вариантами
    function addProposal(string memory name, string[] memory options) public onlyOwner {
        Proposal storage newProposal = proposals.push();
        newProposal.name = name;

        for (uint256 i = 0; i < options.length; i++) {
            newProposal.options.push(Option({name: options[i], voteCount: 0}));
        }
    }

    // Функция для голосования за вариант в предложении
    function vote(uint256 proposalId, uint256 optionId, uint256 amount) public votingActive {
        require(proposalId < proposals.length, "Invalid proposal");
        require(optionId < proposals[proposalId].options.length, "Invalid option");
        require(amount > 0, "Amount must be greater than 0");

        // Проверка, что пользователь не голосовал за данный вариант
        require(votes[msg.sender][proposalId] == 0, "You already voted for this proposal");

        // Увеличиваем количество голосов за вариант
        proposals[proposalId].options[optionId].voteCount += amount;

        // Сохраняем, что пользователь проголосовал за этот вариант
        votes[msg.sender][proposalId] = amount;
    }

    // Завершение голосования
    function endVoting() public onlyOwner {
        votingOpen = false;
    }

    // Получение всех предложений с вариантами
    function getProposals() public view returns (string[] memory, string[][] memory, uint256[][] memory) {
        uint256 length = proposals.length;
        string[] memory proposalNames = new string[](length);
        string[][] memory optionNames = new string[][](length);
        uint256[][] memory voteCounts = new uint256[][](length);

        for (uint256 i = 0; i < length; i++) {
            proposalNames[i] = proposals[i].name;

            uint256 optionsLength = proposals[i].options.length;
            optionNames[i] = new string[](optionsLength);
            voteCounts[i] = new uint256[](optionsLength);

            for (uint256 j = 0; j < optionsLength; j++) {
                optionNames[i][j] = proposals[i].options[j].name;
                voteCounts[i][j] = proposals[i].options[j].voteCount;
            }
        }

        return (proposalNames, optionNames, voteCounts);
    }

    // Получить победителя (с предложением с максимальным количеством голосов)
    function getWinner() public view returns (string memory winnerProposal, string memory winnerOption, uint256 winnerVotes) {
        require(!votingOpen, "Voting is still open.");
        uint256 winningVoteCount = 0;

        for (uint256 i = 0; i < proposals.length; i++) {
            for (uint256 j = 0; j < proposals[i].options.length; j++) {
                if (proposals[i].options[j].voteCount > winningVoteCount) {
                    winningVoteCount = proposals[i].options[j].voteCount;
                    winnerProposal = proposals[i].name;
                    winnerOption = proposals[i].options[j].name;
                    winnerVotes = proposals[i].options[j].voteCount;
                }
            }
        }
    }
}
