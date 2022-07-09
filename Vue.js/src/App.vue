<template>
  <div id="app">
    Отправить сообщение - <input v-model="text" type="text">
    <button @click="sendMessage">Отправить</button>
    <h1>Сообщения</h1>
    <li v-for="(el,i) in messages">{{el}}</li>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      messages: [],
      text: "",
      chat: null
    }
  },
  mounted() {
    if (typeof window.ethereum == 'undefined') {
      return alert("Metamask extention is not installed. Please install Metamask extention and try again.");
    }
    this.startApp()
  },
  methods: {
    async sendMessage() {
      await this.chat.methods.add(this.text).send({
        from: await window.ethereum.request({ method: 'eth_requestAccounts' })[0]
      })
      this.getMessages();
    },
    getMessages() {
      this.chat.methods.getSt().call().then(messages => this.messages = messages)
    },
    startApp() {
      var chatAddress = "0x90230C05Dc1B8C12AA974ed00CEa0B069b79cd60";
      let web3 = new Web3(window.ethereum);
      this.chat = new web3.eth.Contract(chatABI, chatAddress);
      this.getMessages();
      this.text = "";
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>