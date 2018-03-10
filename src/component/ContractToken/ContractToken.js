import { BigNumber } from 'bignumber.js'
import Assert from '../../component/Assert'
import * as ArtifactToken from '../../artifact/Token'

const cfg = CFG
const PROXY_ADDR = cfg.addr.proxy
const UNLIMITED_ALLOWANCE = new BigNumber(2).pow(256).minus(1)


export default class ContractToken {
  constructor(w3) {
    this.web3 = w3
    this.contracts = {}
  }


  /**
   * Get token balance
   * @param  {string}  tokenAddr hex string token address
   * @param  {string}  ownerAddr hex string owner address
   * @return {Promise}           BigNumber balance value
   */

  async getBalanceAsync(
    tokenAddr,
    ownerAddr
  ) {
    return new Promise(async (resolve, reject) => {
      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(ownerAddr)
      ) {
        reject(new Error('ContractToken.getBalanceAsync: invalid address param(s)'))
      }

      const instance = await this._getContractInstance(ArtifactToken, tokenAddr)
      const balance = new BigNumber(
        await instance.methods.balanceOf(ownerAddr).call({from: ownerAddr})
      )
      resolve(balance)
    })
  }


  /**
   * Get token allowance (how many tokens can be spent on owner's behalf)
   * @param  {string}  tokenAddr   hex string token address
   * @param  {string}  ownerAddr   hex string owner address
   * @param  {string}  spenderAddr hex string spender address
   * @return {Promise}             BigNumber allowance value
   */

  async getAllowanceAsync(
    tokenAddr,
    ownerAddr,
    spenderAddr
  ) {
    return new Promise(async (resolve, reject) => {
      let spenderAddress = spenderAddr
      if (!spenderAddress) spenderAddress = PROXY_ADDR

      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(ownerAddr) ||
        !Assert.isAddress(spenderAddress)
      ) {
        reject(new Error('ContractToken.getAllowanceAsync: invalid address param(s)'))
      }

      const instance = await this._getContractInstance(ArtifactToken, tokenAddr)
      const allowance = new BigNumber(
        await instance.methods.allowance(ownerAddr, spenderAddress).call({from: ownerAddr})
      )
      resolve(allowance)
    })
  }


  /**
   * Set token allowance (eg. before trading) on behalf of spender address
   * @param  {string}  tokenAddr hex string token address
   * @param  {string}  ownerAddr hex string owner address (aka msg.sender)
   * @param  {string}  spenderAddr OPTIONAL hex string spender address, reverts to proxy contract
   * @return {Promise}           return transaction hash
   */

  setAllowanceAsync(
    tokenAddr,
    ownerAddr,
    spenderAddr,
    amount)
  {
    return new Promise(async (resolve, reject) => {
      let spenderAddress = spenderAddr
      if (!spenderAddress) spenderAddress = PROXY_ADDR

      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(ownerAddr) ||
        !Assert.isAddress(spenderAddress) ||
        !Assert.isBigNumber(amount)
      ) {
        reject(new Error('ContractToken.setAllowanceAsync: invalid param(s)'))
      }

      const gasLimit = this.web3._getGasLimit()
      const instance = await this._getContractInstance(ArtifactToken, tokenAddr)
      const tx = instance.methods.approve(spenderAddress, amount).send({
        from: ownerAddr,
        gas: gasLimit
      })
      resolve(tx)
    })
  }


  /**
   * Set Unlimited token allowance (eg. before trading) on behalf of spender address
   * @param  {string}  tokenAddr hex string token address
   * @param  {string}  ownerAddr hex string owner address
   * @param  {string}  spenderAddr OPTIONAL hex string spender address, reverts to proxy contract
   * @return {Promise}           return transaction hash
   */

  setUnlimitedAllowanceAsync(tokenAddr, ownerAddr, spenderAddr) {
    return new Promise(async (resolve, reject) => {
      let spenderAddress = spenderAddr
      if (!spenderAddress) spenderAddress = PROXY_ADDR

      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(ownerAddr) ||
        !Assert.isAddress(spenderAddress)
      ) {
        reject(new Error('ContractToken.setUnlimitedAllowanceAsync: invalid address param(s)'))
      }

      const tx = await this.setAllowanceAsync(
        tokenAddr,
        ownerAddr,
        spenderAddress,
        UNLIMITED_ALLOWANCE
      )

      resolve(tx)
    })
  }


  /**
   * transfer
   * @param  {string}  tokenAddr     hex token Address
   * @param  {string}  ownerAddr     hex owner (sender) Address
   * @param  {string}  toAddr        hex recipient address
   * @param  {BigNumber} amount      amount to transfer
   * @return {Promise}
   */

  async transfer(
    tokenAddr,
    ownerAddr,
    toAddr,
    amount
  ) {
    return new Promise(async (resolve, reject) => {
      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(ownerAddr) ||
        !Assert.isAddress(toAddr) ||
        !Assert.isBigNumber(amount)
      ) {
        reject(new Error('ContractToken.transfer: invalid param(s)'))
      }
      const gasLimit = this.web3._getGasLimit()
      const instance = await this._getContractInstance(ArtifactToken, tokenAddr)
      const tx = await instance.methods.transfer(toAddr, amount).send({
        from: ownerAddr,
        gas: gasLimit
      })
      resolve(tx)
    })
  }


  /**
   * transferFrom
   * @param  {string}  tokenAddr     hex token Address
   * @param  {string}  fromAddr      hex from (sender) Address
   * @param  {string}  toAddr        hex recipient address
   * @param  {BigNumber} amount      amount to transfer
   * @return {Promise}
   */

  async transferFrom(
    tokenAddr,
    fromAddr,
    toAddr,
    spenderAddr,
    amount
  ) {
    return new Promise(async (resolve, reject) => {
      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(fromAddr) ||
        !Assert.isAddress(toAddr) ||
        !Assert.isAddress(spenderAddr) ||
        !Assert.isBigNumber(amount)
      ) {
        reject(new Error('ContractToken.transferFrom: invalid param(s)'))
      }

      const gasLimit = this.web3._getGasLimit()
      const instance = await this._getContractInstance(ArtifactToken, tokenAddr)
      const tx = await instance.methods.transferFrom(fromAddr, toAddr, amount).send({
        from: spenderAddr,
        gas: gasLimit
      })
      resolve(tx)
    })
  }


  /**
   * Explicit Deposit for contracts that support it (eg EtherToken)
   * @param  {string}  tokenAddr hex token Address
   * @param  {string}  ownerAddr hex address to deposit to (msg.sender)
   * @param  {BigNumber} amount  amount to Deposit
   * @return {Promise}           resolves transaction
   */

  async deposit(
    tokenAddr,
    ownerAddr,
    amount
  ) {
    return new Promise(async (resolve, reject) => {
      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(ownerAddr) ||
        !Assert.isBigNumber(amount)
      ) {
        reject(new Error('ContractToken.deposit: invalid param(s)'))
      }

      const gasLimit = this.web3._getGasLimit()
      const instance = await this._getContractInstance(ArtifactToken, tokenAddr)

      if (typeof instance.methods.deposit == 'undefined') {
        reject(new Error('ContractToken.deposit: method does not exist in this contract'))
      }

      const tx = await instance.methods.deposit().send({
        from: ownerAddr,
        value: amount,
        gas: gasLimit
      })
      
      resolve(tx)
    })
  }


  /**
   * Withdraw for contracts that support it (eg EtherToken)
   * @param  {string}  tokenAddr hex token Address
   * @param  {string}  ownerAddr hex address to withdraw to (msg.sender)
   * @param  {BigNumber} amount  amount to Withdraw
   * @return {Promise}           resolves transaction
   */

  async withdraw(
    tokenAddr,
    ownerAddr,
    amount
  ) {
    return new Promise(async (resolve, reject) => {
      if (
        !Assert.isAddress(tokenAddr) ||
        !Assert.isAddress(ownerAddr) ||
        !Assert.isBigNumber(amount)
      ) {
        reject(new Error('ContractToken.withdraw: invalid param(s)'))
      }

      const gasLimit = this.web3._getGasLimit()
      const instance = await this._getContractInstance(ArtifactToken, tokenAddr)

      if (typeof instance.methods.withdraw == 'undefined') {
        reject(new Error('ContractToken.withdraw: method does not exist in this contract'))
      }

      const tx = await instance.methods.withdraw(amount).send({from: ownerAddr})
      resolve(tx)
    })
  }


  /**
   * Get Web3 Contract for later method() use. If contract has not been
   * previously instantiated, a new web3 Contract is instantiated.
   * @param  {Object}  artifact     artifact containing ABI
   * @param  {string}  contractAddr hex address/contract location
   * @return {object}               web3 Contract
   */

  async _getContractInstance(artifact, contractAddr) {
    if (!Assert.isAddress(contractAddr)) {
      return new Error('ContractToken.getTokenContract: invalid address param')
    }
    if (!this.contracts[contractAddr]) {
      this.contracts[contractAddr] = await this.web3.getContractInstance(artifact, contractAddr)
    }
    return this.contracts[contractAddr]
  }

}
