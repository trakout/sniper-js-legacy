import Web3 from 'web3'
import Util from '../../component/Util'

const LS_KEY = 'sniperaccount'


export default class Web3lib {
  constructor(provider) {
    this.contract = {}
    this.providerType = 'object' // most common...
    this.web3 = new Web3()
    this.gasLimit = 5000000// maximum gas
    if (provider) this._setProvider(provider)
  }


  /**
   * Set web3 provider
   * @param {string} provider - Provider URL
   */

  _setProvider(provider) {
    if (typeof provider != 'string' && provider.currentProvider) {
      this.web3.setProvider(provider.currentProvider)
    } else {
      this.providerType = 'string'
      this.web3.setProvider(provider)
    }
  }


  /**
   * Current currently-used Provider
   * @return {object} web3 provider
   */

  _getProvider() {
    return this.web3.currentProvider
  }


  /**
   * Get Ethereum balance by Address
   * @param  {string}  addr hex ethereum address
   * @return {BigNumber}
   */

  async getEthBalance(addr) {
    return new BigNumber(await this.web3.eth.getBalance(addr))
  }


  /**
   * Get estimated gas price
   * @return {BigNumber}
   */

  async _getGasPrice() {
    return new BigNumber(await this.web3.eth.getGasPrice())
  }


  /**
   * Get gas limit (whatever it may have been set to)
   * @return {BigNumber}
   */

  _getGasLimit() {
    return new BigNumber(this.gasLimit)
  }
  

  /**
   * Create new account (not recommended for usein production)
   *
   */

   async _newAccount(numAddr = 1) {
     this.web3.eth.accounts.wallet.create(
       numAddr,
       Util.genSalt().toString()
     )

     return this.web3.eth.accounts.wallet[
       this.web3.eth.accounts.wallet.length - 1
     ]
   }


   /**
    * Encrypt and save account to localstorage. Browser Only.
    * @param  {string}  pw password
    */

   async _saveAccount(pw) {
     this.web3.eth.accounts.wallet.save(pw, LS_KEY)
   }



  /**
   * Get available ethereum accounts
   * @return {Promise} resolves array of accounts
   */

  async _getAccounts() {
    return new Promise( async (resolve, reject) => {
      let accounts = []

      // light-wallet
      try {
        let tmp = await this.web3.eth.accounts.wallet
        for (let i = 0, iLen = tmp.length; i < iLen; i++) {
          accounts.push(tmp[i].address)
        }
        if (accounts.length > 0) {
          resolve(accounts)
        }
      } catch (e) {}

      // node-wallet
      try {
        accounts = await this.web3.eth.getAccounts()
      } catch (e) {}


      if (accounts.length == 0) {
        reject(new Error('Web3lib._getAccounts: no accounts available'))
      }
      resolve(accounts)
    })
  }


  /**
   * Signs a message
   * @param  {string}  msg  message to signed
   * @param  {string}  addr address to use while signing
   * @return {Promise}      resolves signature
   */

  async _sign(msg, addr) {
    return new Promise( async (resolve, reject) => {
      let sig = null

      if (this.providerType == 'object') {
        sig = await this.web3.eth.personal.sign(msg, addr)
      }
      if (this.providerType == 'string') {
        let pk = this.web3.eth.accounts.wallet[addr].privateKey
        sig = this.web3.eth.accounts.sign(msg, pk)
      }

      if (sig.signature) sig = sig.signature

      resolve(sig)
    })
  }


  /**
   * Send a raw transaction
   * @param  {string}  fromAddr 'from' address
   * @param  {string}  toAddr   recipient address
   * @param  {BigNumber|string}  amount   value
   * @param  {BigNumber|string}  gasPrice gas price
   * @param  {string|number}  nonce
   * @return {Promise}        returns transaction receipt
   */

  async sendTransaction(fromAddr, toAddr, amount, gasPrice, nonce) {
    return new Promise(async (resolve, reject) => {
      let txObj = {
        from: fromAddr,
        to: toAddr,
        value: amount
      }
      // checks for gasPrice
      if (gasPrice) txObj.gasPrice = gasPrice
      // nonce
      if (nonce) txObj.nonce = nonce

      const tx = await this.web3.eth.sendTransaction(txObj)
      resolve(tx)
    })
  }


  /**
   * Given transaction hash, return receipt
   * @param  {string}  txHash transaction hash
   * @return {Promise}        transaction receipt or bust
   */

  async getTransactionReceipt(txHash) {
    return new Promise((resolve, reject) => {
      this.web3.eth.getTransactionReceipt(txHash, (ret, txObj) => {
        if (txObj) {
          resolve(txObj)
        }
        resolve()
      })
    })
  }


  /**
   * Given ABI and Address, instantiate & return Web3 Contract
   * @param  {Object}  artifact     Contract ABI
   * @param  {string}  contractAddr hex string contract Address
   * @return {Promise}              Returns web3 contract
   */

  async getContractInstance(artifact, contractAddr) {
    return new Promise(async (resolve, reject) => {
      if (!artifact || !artifact.abi) {
        reject(new Error('Web3lib.getContractInstance: invalid abi'))
      }

      const codeExists = await this.web3.eth.getCode(contractAddr)
      if (/^0x0{0,40}$/i.test(codeExists)) {
        reject(new Error('Web3lib.getContractInstance: contract code does not exist at: ' + contractAddr))
      }

      const instance = new this.web3.eth.Contract(
        artifact.abi,
        contractAddr,
        {
          gas: this._getGasLimit()
        }
      )

      resolve(instance)
    })
  }


}
