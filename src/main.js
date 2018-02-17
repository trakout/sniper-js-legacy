'use strict'

import * as cfg from '../config'
import { abi as dexAbi } from '../../build/contracts/SniperExchange'

import { BigNumber } from 'bignumber.js'
import Assert from './component/Assert'
import Util from './component/Util'
import Web3lib from './component/Web3lib'
import { toBuffer, bufferToHex, hashPersonalMessage } from 'ethereumjs-util'

const MAX_DIGITS_IN_UNSIGNED_256_INT = 78
const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1)
const NULL_ADDR = cfg.addr.null


export default class Sniper {
  constructor(opts) {
    let err = this._checkOptions(opts)
    if (err) return

    this.w3           = null
    this.provider     = null
    this.webworker    = opts.webworker ? opts.webworker : false
  }


  /**
   * Instantiate Web3 & Contracts
   * @return {Promise}
   */

  async init() {
    return new Promise((resolve, reject) => {
      this.w3 = new Web3lib()

      this.w3._initHttpProvider((web3Provider) => {
        this.provider = web3Provider
        this.dex = this.w3._addContract({
          name: 'dex',
          addr: cfg.addr.dex,
          abi: dexAbi
        })
        resolve()
      })

    }) // promise
  } // init

  _checkOptions(opts) {
    let error = false
    if (!opts.exchangeAddr) {
      console.warn('Missing exchangeAddr option')
    }
    return error
  } // _checkOptions


  // changeProvider(provider) {
  //
  // }


  /**
   * Generate psuedo random number
   * @return {BigNumber} Psuedo-random number
   */

  _genSalt() {
    let randNum = BigNumber.random(MAX_DIGITS_IN_UNSIGNED_256_INT)
    let factor = new BigNumber(10).pow(MAX_DIGITS_IN_UNSIGNED_256_INT - 26)
    return randNum.times(factor).integerValue(BigNumber.ROUND_FLOOR)
  }


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
        salt: this._genSalt(),
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
      const sig = await this.signOrderHashAsync(orderHashHex, order.maker, usePrefix)

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
      if (!(await Util.isSenderAddressAsync(signerAddr, this.provider))) {
        reject('signOrderHashAsync: Invalid signerAddr')
      }

      let msgHashHex = orderHash
      if (addPrefix) {
        const orderHashBuff = toBuffer(orderHash);
        const msgHashBuff = hashPersonalMessage(orderHashBuff);
        msgHashHex = bufferToHex(msgHashBuff);
      }

      const sig = await this.provider.eth.personal.sign(msgHashHex, signerAddr)
      resolve(sig)
    })
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

    return Util.verifySignature(data, signerAddr, ecSig)
  }


  fillOrder() {

  }
}


let snpr = new Sniper({})
snpr.init().then((contract) => {
  // console.log(contract)
  snpr.createOrderAsync(
    false,
    '0xfaBe65f11fE3EB25636333ca740A8C605494B9b1', // mAddr
    null, // tAddr
    '0x6089982faab51b5758974cf6a502d15ca300a4eb', // mTokenAddr
    '0x6089982faab51b5758974cf6a502d15ca300a4eb', // tTokenAddr
    new BigNumber(1), // makerTokenAmt
    new BigNumber(1), // takerTokenAmt
    360000, // expiry length
    'ETH'
  ).then((order) => {
    console.log('done!')
    console.log(order)
  })
})