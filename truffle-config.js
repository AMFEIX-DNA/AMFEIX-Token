const HDWalletProvider = require("truffle-hdwallet-provider");
const authInfo = require('./auth.json');


module.exports = {
  networks: {
    development: {
      host: "localhost",
      port: 8545,
      network_id: "*" // Match any network id
    },
    ropsten: {
      provider: () =>
        new HDWalletProvider(authInfo.ropsten.mnemonic, `${authInfo.ropsten.node}/${authInfo.ropsten.key}`),
      network_id: '3',
      gasPrice: 12000000000, // 12 Gwei
    },
    mainnet: {
      provider: () =>
        new HDWalletProvider(authInfo.mainnet.mnemonic, `${authInfo.mainnet.node}/${authInfo.mainnet.key}`),
      network_id: '1',
      gasPrice: 66000000000, // 12 Gwei
    }
  },
  compilers: {
    solc: {
      version: '0.7.0',
      docker: true,
      settings: {
        optimizer: {
          enabled: false, // Default: false
          runs: 0, // Default: 200 | consensys default 0
        },
      },
    },
  },
};