'use strict'

import { BigNumber }    from 'bignumber.js'
import Assert           from './component/Assert'
import Util             from './component/Util'
import Web3lib          from './component/Web3lib'
import ContractManager  from './component/ContractManager'
import Firebase         from './component/Firebase'

import {
  toBuffer,
  bufferToHex,
  hashPersonalMessage
} from 'ethereumjs-util'

const cfg = CFG
const NULL_ADDR = cfg.addr.null


export default class Sniper {
  constructor(opts) {
    let err = this._checkOptions(opts)
    if (err) return

    this.Web3lib      = Web3lib
    this.w3           = null
    this.provider     = opts.provider
    this.webworker    = opts.webworker ? opts.webworker : false
    this.db           = new Firebase()
  }

  /**
   * Instantiate Web3 & Contracts
   * @return {Promise}
   */

  async init() {
    return new Promise((resolve, reject) => {
      this.w3 = new Web3lib(this.provider)
      this.contract = new ContractManager(this.w3)
      resolve()
    })
  }

  _checkOptions(opts) {
    let error = false
    if (!opts.provider) {
      console.error('Missing provider option')
      error = true
    }
    if (!opts.exchangeAddr) {
      console.warn('Missing exchangeAddr option')
    }
    return error
  } // _checkOptions


  getWeb3() { return this.w3 }


  changeProvider(provider) {
    if (this.w3 && provider) {
      this.provider = provider
      this.w3._setProvider(this.provider)
    } else {
      console.error('Could not change provider')
    }
  }

  getGasPriceAsync() { return this.w3._getGasPrice() }

  newAccount(numAddr) { this.w3._newAccount(numAddr) }

  getAccountsAsync() { return this.w3._getAccounts() }


  /**
   * Create Order
   * @param {bool} addPrefix - Adds ethereum signed message prefix
   * @param {string} makerAddr - Maker Address
   * @param {string} takerAddr - Taker Address
   * @param {string} makerTokenAddr - Maker Token Address
   * @param {string} takerTokenAddr - Maker Token Address
   * @param {BigNumber} makerTokenAmt - Maker Token Amount
   * @param {BigNumber} takerTokenAmt - Taker Token Amount
   * @param {Number} expirationUnixLen - Expiration length in seconds
   * @param {string} base - ETH || EOS
   * @return {Point} A Point object.
   */

  async createOrderAsync(
    addPrefix,
    makerAddr,
    takerAddr,
    makerTokenAddr,
    takerTokenAddr,
    makerTokenAmt,
    takerTokenAmt,
    expirationUnixLen,
    base = 'ETH'
  ) {
    return new Promise( async (resolve, reject) => {
      const usePrefix = addPrefix ? true : false
      const order = {
        base: base,
        salt: Util.genSalt(),
        maker: makerAddr,
        taker: takerAddr = takerAddr ? takerAddr : NULL_ADDR,
        makerTokenAddress: makerTokenAddr,
        takerTokenAddress: takerTokenAddr,
        makerTokenAmount: makerTokenAmt,
        takerTokenAmount: takerTokenAmt,
        exchangeAddress: cfg.addr.dex,
        expirationTimestampInSec: new BigNumber(Date.now() + expirationUnixLen)
      }

      if (Assert.orderJson(order)) {
        reject(new Error('Error creating order. Please check the console log and report!'))
      }

      const orderHashHex = Util.getOrderHash(order)
      let sig = null

      try {
        sig = await this.signOrderHashAsync(orderHashHex, order.maker, usePrefix)
      } catch (e) {
        reject(new Error(e))
        return
      }

      // verification, attempt VRS & RSV
      let ecSig = null
      const validV = [27, 28]
      const ecSigVRS = Util.parseSigHexToVRS(sig)
      if (validV.includes(ecSigVRS.v)) {
        if (this.verifySignature(orderHashHex, order.maker, ecSigVRS)) {
          ecSig = ecSigVRS
        }
      }
      const ecSigRSV = Util.parseSigHexToRSV(sig)
      if (validV.includes(ecSigRSV.v)) {
        if (this.verifySignature(orderHashHex, order.maker, ecSigRSV)) {
          ecSig = ecSigRSV
        }
      }

      if (!ecSig) reject(new Error('Could not sign order: invalid signature.'))

      resolve(
        Object.assign(order, {
          hashHex: orderHashHex,
          sig: ecSig
        })
      )
    }) // Promise
  }


  /**
   * Signs Order Hash
   * @param {string} orderHash - Order hash/message to sign
   * @param {string} signerAddr - Signer's address
   * @param {boolean} addPrefix - adds Ethereum signed message prefix
   * @return {object} VRS
   */

  async signOrderHashAsync(orderHash, signerAddr, addPrefix) {
    return new Promise(async (resolve, reject) => {
      if (!Util.isHex(orderHash)) {
        reject('signOrderHashAsync: Invalid orderHash')
      }
      if (!(await Util.isSenderAddressAsync(signerAddr, this.w3))) {
        reject('signOrderHashAsync: Invalid signerAddr')
      }

      let msgHashHex = orderHash
      if (addPrefix) {
        const orderHashBuff = toBuffer(orderHash);
        const msgHashBuff = hashPersonalMessage(orderHashBuff);
        msgHashHex = bufferToHex(msgHashBuff);
      }

      const sig = await this.w3._sign(cfg.msg_prefix + msgHashHex, signerAddr)
      resolve(sig)
    })
  }


  sanitizeOrderIn(o) {
    return Assert.sanitizeOrderIn(o)
  }

  sanitizeOrderOut(o) {
    return Assert.sanitizeOrderOut(o)
  }


  /**
   * Externally-available order hashing
   * @param {object} order - complete order data
   * @return {string}
   */

  getOrderHash(order) {
    return Util.getOrderHash(order)
  }


  /**
   * Verify Order Hash
   * @param {string} data - message to sign (eg. Order Hash)
   * @param {string} signerAddr - Signer's address
   * @param {object} ecSigVRS - adds Ethereum signed message prefix
   * @return {bool} VRS
   */

  verifySignature(data, signerAddr, ecSig) {
    const validVParamValues = [27, 28]
    if (
      !validVParamValues.includes(ecSig.v) ||
      !Util.isHex(data) ||
      typeof ecSig != 'object' ||
      typeof ecSig.v != 'number' ||
      typeof ecSig.r != 'string' ||
      typeof ecSig.s != 'string' ||
      !Assert.isAddress(signerAddr)
    ) {
      return false
    }
    return Util.verifySignature(cfg.msg_prefix + data, signerAddr, ecSig)
  }

  pollTransactionAsync(txHash, frequencyS = 1, timeoutS = 1200) {
    const frequencyMS = frequencyS * 1000
    const timeoutMS = timeoutS * 1000
    let timeTracker = 0

    return new Promise((resolve, reject) => {
      let pollTx = setInterval(async () => {
        if (timeTracker > timeoutMS) {
          console.warn('Sniper.pollTransactionAsync: timeout for', txHash)
          clearInterval(pollTx)
          resolve()
        }
        timeTracker += frequencyMS

        const receipt = await this.w3.getTransactionReceipt(txHash)
        if (receipt) {
          clearInterval(pollTx)
          resolve(receipt)
        }
      }, frequencyMS)
    })
  }

  sendTransactionAsync(fromAddr, toAddr, amount, gasPrice, nonce) {
    return this.w3.sendTransaction(fromAddr, toAddr, amount, gasPrice, nonce)
  }

  getEthBalanceAsync(addr) {
    return this.w3.getEthBalance(addr)
  }

  // Token-specific Functionality
  getBalanceAsync(tokenAddr, ownerAddr) {
    return this.contract.token.getBalanceAsync(tokenAddr, ownerAddr)
  }

  setUnlimitedApprovalAsync(tokenAddr, ownerAddr, spenderAddr) {
    return this.contract.token.setUnlimitedAllowanceAsync(tokenAddr, ownerAddr, spenderAddr)
  }

  getAllowanceAsync(tokenAddr, ownerAddr, spenderAddr) {
    return this.contract.token.getAllowanceAsync(tokenAddr, ownerAddr, spenderAddr)
  }

  transferAsync(tokenAddr, ownerAddr, toAddr, amount) {
    return this.contract.token.transfer(
      tokenAddr,
      ownerAddr,
      toAddr,
      amount
    )
  }

  transferFromAsync(tokenAddr, fromAddr, toAddr, spenderAddr, amount) {
    return this.contract.token.transferFrom(
      tokenAddr,
      fromAddr,
      toAddr,
      spenderAddr,
      amount
    )
  }

  depositAsync(tokenAddr, ownerAddr, amount) {
    return this.contract.token.deposit(
      tokenAddr,
      ownerAddr,
      amount
    )
  }

  withdrawAsync(tokenAddr, ownerAddr, amount) {
    return this.contract.token.withdraw(
      tokenAddr,
      ownerAddr,
      amount
    )
  }


  // TODO
  fillOrder(order) { return }

  submitOrderAsync(order) { return this.db._submitOrder(order) }
  submitOrderUnsafe(order) { return this.db._submitOrderInsecure(order) }

  listenOrderBook(pair, cb) { this.db._listenOrderBook(pair, cb) }
  getOrderBookAsync(pair) { return this.db._getOrderBook(pair) }
}



// dev testing

// ( async () => {
//   let snpr = new Sniper({
//     provider: web3
//   })
//
//   await snpr.init()
//
//   const accounts = await snpr.getAccountsAsync()
//   const ethToDeposit = BigNumber(1000000000000000000) // web3.toWei('1', 'ether')
//
//   const txDeposit = await snpr.sendTransactionAsync(
//     accounts[0],
//     cfg.addr.weth,
//     ethToDeposit
//   )
//   // const balance = await snpr.getBalanceAsync(cfg.addr.weth, accounts[0])
//   // console.log('balance:', balance)
//
//   // testing2 addr: 0x7ad2ca2081e4b40147e8b8a6cd3c0907ee09e469
//   //
//   const tx = await snpr.setUnlimitedApprovalAsync(cfg.addr.weth, accounts[0])
//   console.log(tx)
//   const receipt = await snpr.pollTransactionAsync(tx.transactionHash)
//
//   const balance = await snpr.getBalanceAsync(cfg.addr.weth, accounts[0])
//   console.log('balance:', balance)
//
//   const allowance = await snpr.getAllowanceAsync(cfg.addr.weth, '0xfaBe65f11fE3EB25636333ca740A8C605494B9b1', '0xBadb56702F42e8FA4D826234FF8744215EB511F3')
//   console.log(allowance.toString())
// })()

//
// let count = 0;
// let onOrder = (orders) => {
//   console.log(count, orders)
//   count++
// }

// let snpr = new Sniper({
//   provider: web3
// })
// // snpr.listenOrderBook('ETH:0x6089982faab51b5758974cf6a502d15ca300a4eb', onOrder)
//
//
// snpr.init().then(() => {
//
//   // console.log('standalone verification test:')
//   // console.log(snpr.verifySignature(
//   //   '0xd09e3e833a8581ecc01df146b197f63d243ceb023572044922f547836950599f',
//   //   '0xfaBe65f11fE3EB25636333ca740A8C605494B9b1',
//   //   {v: 28, r: '0xf7e34636dcb9a4b844e37bb28a998f96cb56a592fd508c738aee96a3222cba93', s: '0x6b8cf351dcfe6a9af1e9c6921b88af028421f2ebb09d87e9b86d6ad37785b7ae'}
//   // ))
//
//   snpr.createOrderAsync(
//     false,
//     '0xfaBe65f11fE3EB25636333ca740A8C605494B9b1', // mAddr
//     null, // tAddr
//     '0xfaBe65f11fE3EB25636333ca740A8C605494B9b1', // mTokenAddr
//     '0x6089982faab51b5758974cf6a502d15ca300a4eb', // tTokenAddr
//     new BigNumber(1), // makerTokenAmt
//     new BigNumber(1), // takerTokenAmt
//     50000, // expiry length
//     'ETH'
//   ).then((order) => {
//     // console.log(order)
//     let hash = snpr.getOrderHash(order)
//     console.log('verification test:', snpr.verifySignature(hash, order.maker, order.sig))
//     return order
//   }).then((order) => {
//     snpr.submitOrderAsync(order)
//   })
//
// })
