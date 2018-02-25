import Web3 from 'web3'
import Util from '../../component/Util'

const LS_KEY = 'sniperaccount'


export default class Web3lib {
  constructor(provider) {
    this.contract = {}
    this.providerType = 'object' // most common...
    this.web3 = new Web3()
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


  async _getGasPrice() {
    return await this.web3.eth.getGasPrice()
  }


  /**
   * Load a contract prior to use
   * @param {object} contractOpt
   *                 - name : string, can be named anything
   *                 - abi : ABI JSON
   *                 - addr : address
   * @return {object} Contract Object
   */

  _addContract(contractOpt) {

    if (!contractOpt || !contractOpt.name || !contractOpt.abi || !contractOpt.addr) {
      console.error('ContractManager._addContract(): Malformed contract args')
      return
    }

    let contract = new this.web3.eth.Contract(
      contractOpt.abi,
      contractOpt.addr
    )

    this.contract = Object.assign(this.contract, {
      name: contractOpt.name,
      contract
    })

    return contract

  }


  /**
   * Get contract by name
   * @param {string} name - contract name, chosen during _addContract
   * @return {object} Contract Object
   */

  _getContract(name) {
    return this.contract[name]
  }


  /**
   * Create new account (not recommended for usein production)
   *
   */

   async _newAccount() {
     this.web3.eth.accounts.wallet.create(
       1,
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

      // node
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

}
