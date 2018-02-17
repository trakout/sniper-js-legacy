import Web3 from 'web3'


export default class Web3lib {
  constructor(providerNet) {
    this.web3 = null
    this.web3HttpOrWS = providerNet ? providerNet : null
    this.contract = {}
  }


  // initialize httpProvider
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


  // get HTTP Provider
  _getHttpProvider() {
    if (!this.web3) {
      console.error('No Http Provider Available.')
      return
    }
    return this.web3
  }


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


  _getContract(name) {
    return this.contract[name]
  }

}
