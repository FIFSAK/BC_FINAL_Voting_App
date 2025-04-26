import {useEffect, useState} from "react";
import {ethers} from "ethers";
import votingABI from "./contracts/Voting.json";
import tokenABI from "./contracts/VoteToken.json";
import "./App.css";

const VOTING_ADDRESS = "0x144d6a2489389Fd43E2B47d21D490D44Be30b4aa";
const TOKEN_ADDRESS = "0x2bf0A8696E22e204ebBcabDeA7BA504b8ED9A5B2";

function App() {
    const [account, setAccount] = useState("");
    const [proposal, setProposal] = useState("");
    const [amount, setAmount] = useState("");
    const [proposals, setProposals] = useState([]);
    const [voteToken, setVoteToken] = useState(null);
    const [votingContract, setVotingContract] = useState(null);
    const [winner, setWinner] = useState("");

    // Подключаем кошелек MetaMask
    const connectWallet = async () => {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        setAccount(address);

        const tokenContract = new ethers.Contract(TOKEN_ADDRESS, tokenABI, signer);
        const votingContractInstance = new ethers.Contract(VOTING_ADDRESS, votingABI, signer);

        setVoteToken(tokenContract);
        setVotingContract(votingContractInstance);

        const proposalCount = await votingContractInstance.getProposals();
        const proposals = await Promise.all(proposalCount.map(async (proposal) => {
            const name = proposal.name;         // убрал await
            const votes = proposal.voteCount;   // убрал await
            return {name, votes};
        }));

        setProposals(proposals);
    };

    // Создание предложения
    const createProposal = async () => {
        try {
            // Вызов контракта для добавления нового предложения
            const tx = await votingContract.addProposal(proposal);
            await tx.wait();

            alert("Предложение успешно создано!");

            // Обновляем список предложений после добавления
            const proposalCount = await votingContract.getProposals();
            const proposals = await Promise.all(proposalCount.map(async (proposal) => {
                const name = proposal.name;
                const votes = proposal.voteCount;
                return {name, votes};
            }));

            setProposals(proposals); // Обновляем состояние предложений
            setProposal(""); // Очищаем поле ввода
        } catch (error) {
            console.error("Ошибка при создании предложения:", error);
        }
    };


    // Проголосовать
    const vote = async (id) => {
        try {
            const parsedAmount = ethers.parseEther(amount);

            // Проверка allowance токенов
            const allowance = await voteToken.allowance(account, VOTING_ADDRESS);
            if (allowance < parsedAmount) {
                const approveTx = await voteToken.approve(VOTING_ADDRESS, parsedAmount);
                await approveTx.wait();
                console.log("✅ Approve прошёл успешно");
            }

            // Вызов метода голосования
            const tx = await votingContract.vote(id, parsedAmount);
            await tx.wait();

            console.log("✅ Стейкинг прошёл успешно");

            // Обновление предложений с актуальными голосами
            const proposalCount = await votingContract.getProposals();
            const proposals = await Promise.all(proposalCount.map(async (proposal) => {
                const name = proposal.name;
                const votes = proposal.voteCount;
                return {name, votes};
            }));

            setProposals(proposals); // Обновляем состояние с новыми данными о предложениях
            setAmount(""); // Очищаем поле ввода
        } catch (error) {
            console.error("Ошибка при голосовании:", error);
            alert(`Ошибка: ${error.reason || error.message}`);
        }
    };


    // Получить победителя
    const getWinner = async () => {
        try {
            const [winnerId, winnerName, votes] = await votingContract.getWinner();
            setWinner(`${winnerName} с ${ethers.formatEther(votes)} голосами`);
        } catch (error) {
            console.error("Ошибка при получении победителя:", error);
        }
    };

    useEffect(() => {
        if (window.ethereum) {
            connectWallet();
        }
    }, []);

    return (
        <div className="app">
            <h1>DeFi Voting DApp</h1>
            <p className="account-info"><strong>Подключенный аккаунт:</strong> {account}</p>

            <div>
                <h2>Создать предложение</h2>
                <input
                    type="text"
                    placeholder="Введите название предложения"
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                />
                <button onClick={createProposal}>Создать предложение</button>
            </div>

            <div className="proposals">
                <h2>Голосование</h2>
                <input
                    type="number"
                    placeholder="Введите количество токенов"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <div>
                    {proposals.map((prop, index) => (
                        <div key={index}>
                            <p>{prop.name} — {ethers.formatEther(prop.votes)} голосов</p>
                            <button onClick={() => vote(index)}>Голосовать</button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="status">
                <h2>Победитель голосования</h2>
                <button onClick={getWinner}>Посмотреть победителя</button>
                {winner && <p>Победитель: {winner}</p>}
            </div>
        </div>
    );
}

export default App;
