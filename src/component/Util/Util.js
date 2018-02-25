import { utils } from 'web3'
import { BigNumber } from 'bignumber.js'
import * as ethABI from 'ethereumjs-abi'
import { toBuffer, bufferToHex, fromRpcSig, ecrecover, pubToAddress, hashPersonalMessage, toChecksumAddress } from 'ethereumjs-util'

const MAX_DIGITS_IN_UNSIGNED_256_INT = 78
const UNLIMITED_ALLOWANCE_IN_BASE_UNITS = new BigNumber(2).pow(256).minus(1)
const WETH = CFG.addr.weth
let BN = utils.BN


export default class Util {


  /**
   * Check if string is hex
   * @param {string} - string to check
   * @return {boolean}
   */

  static isHex(hex) {
    return utils.isHexStrict(hex)
  }


  /**
   * convert BigNumber to web3 1.0's BN
   * @param {BigNumber} - BigNumber object to convert
   * @return {BN}
   */

  static bigNumberToBN(num) {
    return new BN(num.toString(), 10)
  }


  /**
   * Generate psuedo random number
   * @return {BigNumber} Psuedo-random number
   */

  static genSalt() {
    let randNum = BigNumber.random(MAX_DIGITS_IN_UNSIGNED_256_INT)
    let factor = new BigNumber(10).pow(MAX_DIGITS_IN_UNSIGNED_256_INT - 26)
    return randNum.times(factor).integerValue(BigNumber.ROUND_FLOOR)
  }


  /**
   * given pair, get quote
   * @param {string} p - pair
   * @return {string} pair's quote
   */

   static getQuoteFromPair(p) {
     return p.substr(p.indexOf(':') + 1, p.length - 1)
   }


   /**
    * given pair, get base
    * @param {string} p - pair
    * @return {string} pair's base
    */

    static getBaseFromPair(p) {
      return p.substr(0, p.indexOf(':'))
    }


   /**
    * given pair, return pair with checksum'd address
    * @param {string} p - pair
    * @return {string} pair with checksum'd address
    */

   static checksumPair(p) {
     const b = p.substr(0, p.indexOf(':') + 1)
     const q = toChecksumAddress(p.substr(p.indexOf(':') + 1, p.length - 1))
     return b + q
   }


  /**
   * given order, get quote
   * @param {object} o - complete order
   * @return {string} pair's quote
   */

  static getQuoteFromOrder(o) {
    let quote = null
    const base = o.p ? this.getBaseFromPair(o.p) : o.base
    const makerTokenAddress = o.ma ? o.ma : o.makerTokenAddress
    const takerTokenAddress = o.ta ? o.ta : o.takerTokenAddress

    if (base == 'ETH') {
      if (makerTokenAddress !== WETH) {
        quote = makerTokenAddress
      }
      if (takerTokenAddress !== WETH) {
        quote = takerTokenAddress
      }
      if (!quote) {
        console.error('Could not find valid quote for pair (base:quote)')
      }
    } else {
      console.error('Only ETH base currently supported')
    }
    if (
      utils.isAddress(makerTokenAddress) &&
      utils.isAddress(takerTokenAddress)
    ) {
      if (toChecksumAddress(makerTokenAddress) == toChecksumAddress(takerTokenAddress)) {
        // not sure if this will ever happen, but..
        console.error('Util.getQuote: identical maker & taker token')
        quote = null
      }
    }

    // checksum
    if (utils.isAddress(quote)) {
      quote = toChecksumAddress(quote)
    }

    return quote
  }


  /**
   * check to be sure account is available (eg. before signing)
   * @param {string} - Hex address
   * @param {object} - web 3 instance
   * @return {Promise} - resolves a boolean, always
   */

  static isSenderAddressAsync(addr, w3) {
    return new Promise(async (resolve, reject) => {
      if (!utils.isAddress(addr)) {
        reject('Util.isSenderAddressAsync: invalid address')
      }

      let accounts = []
      try {
        accounts = await w3._getAccounts()
      } catch (e) {
        resolve(false)
      }

      if (accounts.includes(addr)) {
        resolve(true)
      } else {
        resolve(false)
      }
    })
  }


  /**
   * get hash of order object
   * @param {object} - Order
   * @return {string} - Hash of order
   */

  static getOrderHash(order) {
    const orderParts = [
      { value: order.exchangeAddress, type: 'address' },
      { value: order.maker, type: 'address' },
      { value: order.taker, type: 'address' },
      { value: this.bigNumberToBN(order.salt), type: 'uint256' },
      { value: order.makerTokenAddress, type: 'address' },
      { value: order.takerTokenAddress, type: 'address' },
      {
          value: this.bigNumberToBN(order.makerTokenAmount),
          type: 'uint256',
      },
      {
          value: this.bigNumberToBN(order.takerTokenAmount),
          type: 'uint256',
      },
      {
          value: this.bigNumberToBN(order.expirationTimestampInSec),
          type: 'uint256',
      }
    ]
    return utils.soliditySha3(...orderParts)
  } // getOrderHash


  /**
   * Parse signature to VRS convention
   * @param {string} - Signature Hex to parse
   * @return {object}
   */

  static parseSigHexToVRS(sigHex) {
    const sigBuf = toBuffer(sigHex)
    let v = sigBuf[0]
    if (v < 27) v+= 27
    const r = sigBuf.slice(1, 33)
    const s = sigBuf.slice(33, 65)
    return {
      v: v,
      r: bufferToHex(r),
      s: bufferToHex(s)
    }
  }


  /**
   * Parse signature to RSV convention
   * @param {string} - Signature hex to parse
   * @return {object}
   */

  static parseSigHexToRSV(sigHex) {
    const { v, r, s } = fromRpcSig(sigHex)
    return {
      v,
      r: bufferToHex(r),
      s: bufferToHex(s),
    }
  }


  /**
   * Confirm order was signed the correct address
   * @param {string} - Order hash
   * @param {string} - Address claiming to have signed the order
   * @param {object} - ecsignature VRS
   * @return {boolean}
   */

  static verifySignature(data, signerAddr, ecSig) {
    const dataBuff = toBuffer(data)
    const msgHashBuff = hashPersonalMessage(dataBuff)
    try {
      const pubKey = ecrecover(
        msgHashBuff,
        ecSig.v,
        toBuffer(ecSig.r),
        toBuffer(ecSig.s),
      )
      const retrievedAddress = bufferToHex(pubToAddress(pubKey))
      return toChecksumAddress(retrievedAddress) === signerAddr
    } catch (err) {
        console.log(err)
        return false
    }
  }
}
