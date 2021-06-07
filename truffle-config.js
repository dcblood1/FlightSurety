var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "wrist return fence seven party knife transfer divorce ice sense couple awful";

// my ganache: require metal oven elbow social reject fog expand curve silver story remember
// given: candy maple cake sugar pudding cream honey rich smooth crumble sweet treat

module.exports = {
  networks: {
    development: {
      provider: function() {
        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 50); //HTTP://127.0.0.1:7545 is my ganache // originally provided: http://127.0.0.1:8545/
      },
      network_id: '*',
      gas: 9999999
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24"
    }
  }
};