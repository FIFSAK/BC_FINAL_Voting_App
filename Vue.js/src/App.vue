<template>
    <div class="bg">
        <div class="container-fluid bg-head py-3">
            <div class="container">
                <h1 class="text-center">Blockchain Voting Platform(uses <strong>test bnb chain)</strong></h1>
                <p class="text-center">Your votes are transparent and secure with the power of blockchain technology.</p>
            </div>
        </div>
      <div class="container py-5">
        <div class="row dFlex">
          <div class="col-lg-4 dFlex">
            <div class="card text-white bg-fvote mb-3" style="max-width: 30rem;">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/34/Elon_Musk_Royal_Society_%28crop2%29.jpg/411px-Elon_Musk_Royal_Society_%28crop2%29.jpg" class="card-img-top" alt="Vote 1">
              <div class="card-body">
                <h5 class="card-title">
                    Are you for or against Elon Musk?<br>
                    <span class="badge badge-light ms-2">{{ votes.vote1.for }} votes for</span><br>
                    <span class="badge badge-light ms-2">{{ votes.vote1.against }} votes against</span>
                </h5>
                <p class="card-text">{{ vote1Info }}</p>
                <button class="btn btn-light me-3" @click="voteFor('vote1')">For</button>
                <button class="btn btn-dark" @click="voteAgainst('vote1')">Against</button>
              </div>
            </div>
          </div>
          <div class="col-lg-4 dFlex">
            <div class="card text-white bg-svote mb-3" style="max-width: 30rem;">
              <img src="https://avatars.mds.yandex.net/get-kinopoisk-image/1777765/43ad37ff-34c4-4ebc-9f0a-2f2eaa41a18d/280x420" class="card-img-top" alt="Vote 2">
              <div class="card-body">
                <h5 class="card-title">
                    Are you for or against Donald Trump?<br>
                    <span class="badge badge-light ms-2">{{ votes.vote2.for }} votes for</span><br>
                    <span class="badge badge-light ms-2">{{ votes.vote2.against }} votes against</span>
                </h5>
                <p class="card-text">{{ vote2Info }}</p>
                <button class="btn btn-light me-3" @click="voteFor('vote2')">For</button>
                <button class="btn btn-dark" @click="voteAgainst('vote2')">Against</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>

<script>
export default {
  name: 'App',
  data() {
    return {
        votes: {
            vote1: {
                for: 0,
                against: 0
            },
            vote2: {
                for: 0,
                against: 0
            }
        },
        chat: null,
        isLoading: false,
        vote1Info: 'Some information about vote 1',
        vote2Info: 'Some information about vote 2',
    }
  },
  mounted() {
    if (typeof window.ethereum == 'undefined') {
      return alert("Metamask extention is not installed. Please install Metamask extention and try again.");
    }
    this.startApp()
  },
  methods: {
    async vote(voteBody) {
        try{
            if(this.isLoading)
                return alert("Идет сохранение сообщения в блокчейне, подождите");
            this.isLoading = true;
            var from = await window.ethereum.request({ method: 'eth_requestAccounts' })
            await this.chat.methods.add(voteBody).send({
                from: from[0]
            })
            this.getVotes();
            this.isLoading = false;
        } catch (err) {
            console.log(err);
            alert("Ошибка при сохранении сообщения");
            this.isLoading = false;
        }

    },
    getVotes() {
      this.chat.methods.getSt()
      .call()
      .then(votes => {
        votes = votes.filter(vote => {
            try{
                JSON.parse(vote);
                return true;
            } catch (err) {
                return false;
            }
        });
        // convert to object
        votes = votes.map(vote => JSON.parse(vote));
        // count votes
        votes = votes.reduce((acc, vote) => {
            if(vote.vote == 'vote1'){
                if(vote.for)
                    acc.vote1.for++;
                else
                    acc.vote1.against++;
            } else if(vote.vote == 'vote2'){
                if(vote.for)
                    acc.vote2.for++;
                else
                    acc.vote2.against++;
            }
            return acc;
        }, {
            vote1: {
                for: 0,
                against: 0
            },
            vote2: {
                for: 0,
                against: 0
            }
        });
        this.votes = votes;
      })
    },
    startApp() {
      var chatAddress = "0x95F76A4e58f12eaDF20D402E4af1F60D0216c45D";
      let web3 = new Web3(window.ethereum);
      this.chat = new web3.eth.Contract(chatABI, chatAddress);
      this.getVotes();
    },
    voteFor(vote) {
        this.vote(JSON.stringify({
            vote: vote,
            for: true
        }));
    },
    voteAgainst(vote) {
        this.vote(JSON.stringify({
            vote: vote,
            for: false
        }));
    },
  }
}
</script>

<style>
body, html {
  height: 100%;
}

.bg {
  background-color: #62707c;
}

.bg-head{
    background-color: #d3d3d3;
}

.bg-fvote{
    background-color: #7cd270;
}
.bg-svote{
    background-color: #d2707c;
}

.dFlex{
    display: flex;
    justify-content: center;
    align-items: center;
}

img{
    height: 400px;
    object-fit: cover;
}
</style>