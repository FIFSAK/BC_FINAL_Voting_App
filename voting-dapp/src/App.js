import { useEffect, useState } from "react";
import { BrowserProvider, Contract, parseEther, formatEther } from "ethers";
import votingABI from "./contracts/Voting.json";
import tokenABI from "./contracts/VoteToken.json";
import "./App.css";

const VOTING_ADDRESS = "0x07c8a74738e6B979A112A82f577c6b1A0B77DC5F";
const TOKEN_ADDRESS = "0x8307d49A664C8F2FBf853f20e84fA2724222e563";

function App() {
    const [account, setAccount] = useState("");
    const [proposal, setProposal] = useState("");
    const [optionInput, setOptionInput] = useState("");
    const [options, setOptions] = useState([]);
    const [amounts, setAmounts] = useState({}); // Для разных полей ввода токенов
    const [proposals, setProposals] = useState([]);
    const [voteToken, setVoteToken] = useState(null);
    const [votingContract, setVotingContract] = useState(null);
    const [winner, setWinner] = useState("");

    const connectWallet = async () => {
        if (window.ethereum) {
            try {
                await window.ethereum.request({ method: "eth_requestAccounts" });
                const provider = new BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address);

                const tokenContract = new Contract(TOKEN_ADDRESS, tokenABI, signer);
                const votingContractInstance = new Contract(VOTING_ADDRESS, votingABI, signer); // signer обязательно!

                setVoteToken(tokenContract);
                setVotingContract(votingContractInstance);

                await loadProposals(votingContractInstance);
            } catch (error) {
                console.error("Ошибка при подключении кошелька:", error);
            }
        } else {
            alert("Установите MetaMask!");
        }
    };

    const loadProposals = async (votingInstance) => {
        try {
            const [proposalNames, optionNames, voteCounts] = await votingInstance.getProposals();
            const proposalsList = proposalNames.map((name, index) => ({
                name,
                options: optionNames[index].map((optionName, i) => ({
                    name: optionName,
                    votes: voteCounts[index][i]
                }))
            }));
            setProposals(proposalsList);
        } catch (error) {
            console.error("Ошибка при загрузке предложений:", error);
        }
    };

    const createProposal = async () => {
        if (!proposal || options.length === 0) {
            alert("Введите название и хотя бы один вариант голосования.");
            return;
        }

        try {
            const tx = await votingContract.addProposal(proposal, options);
            await tx.wait();
            alert("✅ Предложение успешно создано!");

            setProposal("");
            setOptions([]);
            setOptionInput("");

            await loadProposals(votingContract);
        } catch (error) {
            console.error("Ошибка при создании предложения:", error);
            alert(`Ошибка при создании предложения: ${error.message || error}`);
        }
    };

    const addOption = () => {
        if (optionInput.trim() !== "") {
            setOptions([...options, optionInput.trim()]);
            setOptionInput("");
        }
    };

    const vote = async (proposalId, optionId) => {
        const enteredAmount = amounts[`${proposalId}-${optionId}`];

        if (!enteredAmount || isNaN(Number(enteredAmount)) || Number(enteredAmount) <= 0) {
            alert("Введите количество токенов для голосования");
            return;
        }

        try {
            const parsedAmount = parseEther(enteredAmount);
            const allowance = await voteToken.allowance(account, VOTING_ADDRESS);

            if (allowance < parsedAmount) { // НЕ BigInt, нормальная проверка!
                const approveTx = await voteToken.approve(VOTING_ADDRESS, parsedAmount);
                await approveTx.wait();
            }


            const tx = await votingContract.vote(proposalId, optionId, parsedAmount);
            await tx.wait();
            alert("Голос успешно учтен!");

            setAmounts({ ...amounts, [`${proposalId}-${optionId}`]: "" });
            await loadProposals(votingContract);
        } catch (error) {
            console.error("Ошибка при голосовании:", error);
        }
    };

    const getWinner = async () => {
        if (!votingContract) return;

        try {
            const [winnerName, winnerOption, winnerVotes] = await votingContract.getWinner();
            setWinner(`${winnerName} — ${winnerOption} (${formatEther(winnerVotes)} голосов)`);
        } catch (error) {
            console.error("Ошибка при получении победителя:", error);
            alert("Голосование еще не завершено.");
        }
    };

    useEffect(() => {
        connectWallet();
    }, []);

    return (
        <div className="app">
            <h1>🗳️ DeFi Voting DApp</h1>
            <p><strong>Аккаунт:</strong> {account}</p>

            <div className="create-proposal">
                <h2>Создать предложение</h2>
                <input
                    type="text"
                    placeholder="Название предложения"
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                />
                <div className="option-adding">
                    <input
                        type="text"
                        placeholder="Добавить вариант"
                        value={optionInput}
                        onChange={(e) => setOptionInput(e.target.value)}
                    />
                    <button onClick={addOption}>Добавить вариант</button>
                </div>
                <ul>
                    {options.map((opt, idx) => (
                        <li key={idx}>{opt}</li>
                    ))}
                </ul>
                <button onClick={createProposal}>Создать предложение</button>
            </div>

            <div className="proposals">
                <h2>Голосование</h2>
                {proposals.map((proposal, index) => (
                    <div key={index} className="proposal">
                        <p><strong>{proposal.name}</strong></p>
                        {proposal.options.map((option, idx) => (
                            <div key={idx}>
                                <p>{option.name} — {formatEther(option.votes)} голосов</p>
                                <input
                                    type="text"
                                    placeholder="Сколько токенов?"
                                    value={amounts[`${index}-${idx}`] || ""}
                                    onChange={(e) => setAmounts({ ...amounts, [`${index}-${idx}`]: e.target.value })}
                                />
                                <button onClick={() => vote(index, idx)}>Голосовать</button>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            <div className="winner">
                <button onClick={getWinner}>Посмотреть победителя</button>
                {winner && <p>🏆 Победитель: {winner}</p>}
            </div>
        </div>
    );
}

export default App;
