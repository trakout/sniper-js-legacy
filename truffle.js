require('babel-register')
require('isomorphic-fetch')

let config = require('./config')
let HDWalletProvider = require("truffle-hdwallet-provider")
let mnemonic = null

try {
  mnemonic = require('./config-mnemonic')
} catch (e) {
  console.log('WARNING: no mnemonics detected for public deployment')
}

global.CFG = config.dev
global.utils = require('web3').utils
global.promisify = require('es6-promisify').promisify
global.BigNumber = require('bignumber.js-5')

global.chai = require('chai')
global.ChaiPromise = require('chai-as-promised')
global.ChaiBigNumber = require('chai-bignumber')
global.expect = chai.expect
global.chai.use(ChaiPromise)
global.chai.use(ChaiBigNumber(global.BigNumber))

global.LOCAL_NET = 'http://localhost:8545'
global.ROPSTEN_NET = 'https://ropsten.infura.io/FQ4iNOLxTaxMi70mEmSW'
global.MAIN_NET = 'https://mainnet.infura.io/FQ4iNOLxTaxMi70mEmSW'

let networks = {
  development: {
    host: "localhost",
    port: 8545, // 8545 for ganache-cli
    network_id: "*", // Match any network id
    gas: 4000000,
    gasPrice: 2e10,
    cfg: {
      adminAddress: null,
      startDate: 'Sat Feb 24 2018 10:00:00 GMT-0500 (EST)',
      distroInterval: 90, // days
      presaleInterval: 7, // days
      emuDistroInterval: 300, // seconds
      emuPresaleInterval: 60, // seconds
      totalSupply: '72000000',
      premintAmount: '12000000',
      presaleAmount: '20000000',
      distRates: ['20000', '4000', '2000', '1000', '500']
    }
  }
}


if (mnemonic && mnemonic.ropsten) {
  networks.ropsten = {
    network_id: 3,
    provider: function() {
      return new HDWalletProvider(mnemonic.ropsten, config.node.infura.ropsten + config.node.infura.key)
    },
    gas: 4000000,
    // gasPrice
    cfg: {
      adminAddress: null,
      startDate: 'Sat Feb 24 2018 10:00:00 GMT-0500 (EST)',
      distroInterval: 90, // days
      presaleInterval: 7, // days
      emuDistroInterval: 300, // seconds
      emuPresaleInterval: 60, // seconds
      totalSupply: '72000000',
      premintAmount: '12000000',
      presaleAmount: '20000000',
      distRates: ['20000', '4000', '2000', '1000', '500']
    }
  }
}


if (mnemonic && mnemonic.mainnet) {
  // provider: new HDWalletProvider(mnemonic, "https://mainnet.infura.io/"+infuraToken),
  // network_id: 1,
  // gas: 4e6,
  // gasPrice: 2e10
  // ,live: {
  //   host: "178.25.19.88", // Random IP for example purposes (do not use)
  //   port: 80,
  //   network_id: 1,        // Ethereum public network
  //   // optional config values:
  //   // gas
  //   // gasPrice
  //   // from - default address to use for any transaction Truffle makes during migrations
  //   // provider - web3 provider instance Truffle should use to talk to the Ethereum network.
  //   //          - if specified, host and port are ignored.
  // }

  // 4700000 - roptsten gas limit
}


module.exports = {
  networks: networks
};

// more at http://truffleframework.com/docs/advanced/configuration
