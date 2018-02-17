import { utils } from 'web3'
import { BigNumber } from 'bignumber.js'
import * as ethABI from 'ethereumjs-abi'
import { toBuffer, bufferToHex, fromRpcSig, ecrecover, pubToAddress, hashPersonalMessage, toChecksumAddress } from 'ethereumjs-util'
import * as _ from 'lodash'

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
   * check to be sure account is available (eg. before signing)
   * @param {string} - Hex address
   * @param {object} - web 3 instance
   * @return {Promise} - resolves a boolean, always
   */

  static isSenderAddressAsync(addr, w3) {
    return new Promise(async (resolve, reject) => {
      if (!utils.isAddress(addr)) {
        reject('isSenderAddressAsync: invalid address')
      }

      if ((await w3.eth.getAccounts()).includes(addr)) {
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
    // console.log('getOrderHash:', orderParts)
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
        return false
    }
  }
}
