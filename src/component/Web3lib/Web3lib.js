import Web3 from 'web3'


export default class Web3lib {
  constructor(providerNet) {
    this.web3 = null
    this.web3HttpOrWS = providerNet ? providerNet : null
    this.contract = {}
  }


  /**
   * Initialize Web3 Provider
   * @param {function} callback
   */

  _initHttpProvider(callback) {
    window.addEventListener('load', () => {
      if (typeof web3 !== 'undefined' && !this.web3Location) {
        // Use the metamask/mist provider.
        // eslint-disable-next-line
        this.web3 = new Web3(web3.currentProvider)
        console.info('web3 provider detected')
      } else if (this.web3Location) {
        console.info('using specified web3 provider')
        this.web3 = new Web3(new Web3.providers.HttpProvider(this.web3Location))
      } else {
        console.error('Could not find injected web3')
      }
      callback(this.web3)
    })
  }


  /**
   * Current currently-used Provider
   * @return {object} web3 provider
   */

  _getHttpProvider() {
    if (!this.web3) {
      console.error('No Http Provider Available.')
      return
    }
    return this.web3
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

}
