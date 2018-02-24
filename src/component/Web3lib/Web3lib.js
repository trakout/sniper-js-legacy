import Web3 from 'web3'


export default class Web3lib {
  constructor(provider) {
    this.contract = {}
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
   * Get available ethereum accounts
   * @return {Promise} resolves array of accounts
   */

  async _getAccounts() {
    return new Promise( async (resolve, reject) => {
      const accounts = await this.web3.eth.getAccounts()
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
      const sig = await this.web3.eth.personal.sign(msg, addr)
      resolve(sig)
    })
  }

}
