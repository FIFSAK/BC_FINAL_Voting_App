
const HDWalletProvider = require("truffle-hdwallet-provider");

// Set your own mnemonic here
const mnemonic = "dune autumn picture clever bird cream coast coach enlist raccoon donkey razor";

// Module exports to make this configuration available to Truffle itself
module.exports = {
  // Object with configuration for each network
  networks: {
    // Configuration for rinkeby network
    rinkeby: {
      // Special function to setup the provider
      provider: function () {
        // Setting the provider with the Infura Rinkeby address and Token
        return new HDWalletProvider(mnemonic, "https://rinkeby.infura.io/v3/5760cba7b3f545b1912020131adea4c0")
      },
      network_id: 4,
      from: "0x88fE68893355813D9a4C9154416e9Dcee340F58e"
    }
  }
};
