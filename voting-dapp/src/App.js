import {useEffect, useState} from "react";
import {BrowserProvider, Contract, formatEther, parseEther} from "ethers";
import votingABI from "./contracts/Voting.json";
import tokenABI from "./contracts/VoteToken.json";
import "./App.css";

const VOTING_ADDRESS = "0x4ec511Dd7789989A58FF0Ddde363395DA06Df698";
const TOKEN_ADDRESS = "0x8307d49A664C8F2FBf853f20e84fA2724222e563";

function App() {
    const [account, setAccount] = useState("");
    const [proposal, setProposal] = useState("");
    const [optionInput, setOptionInput] = useState("");
    const [options, setOptions] = useState([]);
    const [amounts, setAmounts] = useState({});
    const [proposals, setProposals] = useState([]);
    const [voteToken, setVoteToken] = useState(null);
    const [votingContract, setVotingContract] = useState(null);
    const [winners, setWinners] = useState({});

    const connectWallet = async () => {
        if (window.ethereum) {
            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            setAccount(address);

            const tokenContract = new Contract(TOKEN_ADDRESS, tokenABI, signer);
            const votingContractInstance = new Contract(VOTING_ADDRESS, votingABI, signer);

            setVoteToken(tokenContract);
            setVotingContract(votingContractInstance);

            await loadProposals(votingContractInstance);
        }
    };

    const loadProposals = async (voting) => {
        try {
            const [names, optionLists, voteCounts, openStatuses] = await voting.getProposals();

            const proposalsFormatted = names.map((name, idx) => ({
                id: idx,
                name,
                isOpen: openStatuses[idx],
                options: (optionLists[idx] || []).map((optName, j) => ({
                    name: optName,
                    votes: voteCounts[idx][j] || 0
                }))
            }));

            setProposals(proposalsFormatted);
        } catch (error) {
            console.error("Ошибка при загрузке предложений:", error);
            setProposals([]);
        }
    };


    const addOption = () => {
        if (optionInput.trim()) {
            setOptions([...options, optionInput.trim()]);
            setOptionInput("");
        }
    };

    const createProposal = async () => {
        if (!proposal || options.length === 0) {
            alert("Введите название и хотя бы один вариант");
            return;
        }

        try {
            const tx = await votingContract.addProposal(proposal, options);
            await tx.wait();
            alert("✅ Предложение создано!");
            setProposal("");
            setOptions([]);
            setOptionInput("");
            setTimeout(() => loadProposals(votingContract), 2000);
        } catch (error) {
            console.error("Ошибка при создании:", error);
        }
    };

    const vote = async (proposalId, optionId) => {
        const enteredAmount = amounts[`${proposalId}-${optionId}`];
        if (!enteredAmount || isNaN(enteredAmount) || Number(enteredAmount) <= 0) {
            alert("Введите корректное количество токенов");
            return;
        }

        try {
            const parsedAmount = parseEther(enteredAmount);
            const allowance = await voteToken.allowance(account, VOTING_ADDRESS);

            if (allowance < parsedAmount) {
                const approveTx = await voteToken.approve(VOTING_ADDRESS, parsedAmount);
                await approveTx.wait();
            }

            const tx = await votingContract.vote(proposalId, optionId, parsedAmount);
            await tx.wait();
            alert("✅ Голос учтён");
            await loadProposals(votingContract);
        } catch (error) {
            console.error("Ошибка при голосовании:", error);
        }
    };

    const closeProposal = async (proposalId) => {
        try {
            const tx = await votingContract.endProposalVoting(proposalId);
            await tx.wait();
            alert(`✅ Голосование для предложения ${proposalId} закрыто`);
            await loadProposals(votingContract);
        } catch (error) {
            console.error("Ошибка при закрытии предложения:", error);
        }
    };

    const getProposalWinner = async (proposalId) => {
        try {
            const [winnerOption, winnerVotes] = await votingContract.getWinner(proposalId);
            setWinners(prev => ({
                ...prev,
                [proposalId]: `${winnerOption} (${formatEther(winnerVotes)} голосов)`
            }));
        } catch (error) {
            console.error("Ошибка при получении победителя:", error);
            alert("Проверь, закрыто ли голосование для этого предложения");
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
                <h2>Создать новое предложение</h2>
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
                    <button onClick={addOption}>➕ Добавить</button>
                </div>
                <ul>
                    {options.map((opt, idx) => (
                        <li key={idx}>{opt}</li>
                    ))}
                </ul>
                <button onClick={createProposal}>🚀 Создать предложение</button>
            </div>

            <div className="proposals">
                <h2>Текущие предложения</h2>
                {proposals.map((proposal) => (
                    <div key={proposal.id} className="proposal-card">
                        <p><strong>{proposal.name}</strong></p>
                        {proposal.options.map((opt, idx) => (
                            <div key={idx} className="option-card">
                                <p>{opt.name}: {formatEther(opt.votes)} голосов</p>
                                <input
                                    type="text"
                                    placeholder="Сколько токенов?"
                                    value={amounts[`${proposal.id}-${idx}`] || ""}
                                    onChange={(e) => setAmounts({
                                        ...amounts,
                                        [`${proposal.id}-${idx}`]: e.target.value
                                    })}
                                />
                                <button onClick={() => vote(proposal.id, idx)}>Голосовать</button>
                            </div>
                        ))}

                        {proposal.isOpen ? (
                            <button onClick={() => closeProposal(proposal.id)}>🛑 Закрыть голосование</button>
                        ) : (
                            <button onClick={() => getProposalWinner(proposal.id)}>🏆 Посмотреть победителя</button>
                        )}

                        {winners[proposal.id] && (
                            <p><strong>Победитель:</strong> {winners[proposal.id]}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
