var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "detect jealous pipe lonely art parade night casino glide fever peasant piano";


module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50); //HTTP://127.0.0.1:7545 is my ganache // originally provided: http://127.0.0.1:8545/
      },
      network_id: '*', //* stands for whatever id I believe.
      gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};