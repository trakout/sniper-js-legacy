import ContractToken from '../../component/ContractToken'


export default class ContractManager {
  constructor(w3) {
    if (!w3) {
      console.error('ContractManager: no web3 provider available')
      return
    }

    this.token = new ContractToken(w3)
  }
}
