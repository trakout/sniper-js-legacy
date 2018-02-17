import { utils } from 'web3'
import { BigNumber } from 'bignumber.js'
import * as ethABI from 'ethereumjs-abi'
import { toBuffer, bufferToHex, fromRpcSig, ecrecover, pubToAddress, hashPersonalMessage, toChecksumAddress } from 'ethereumjs-util'
import * as _ from 'lodash'

let BN = utils.BN

export default class Util {
  static isHex(hex) {
    return utils.isHexStrict(hex)
  }

  static bigNumberToBN(num) {
    return new BN(num.toString(), 10)
  }

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

  static getOrderHash(order) {
    const orderParts = [
      { value: order.exchangeAddress, type: 'address' },
      { value: order.maker, type: 'address' },
      { value: order.taker, type: 'address' },
      { value: this.bigNumberToBN(order.salt), type: 'uint256' },
      { value: order.makerTokenAddress, type: 'address' },
      { value: order.takerTokenAddress, type: 'address' },
      // { value: order.feeRecipient, type: 'address' }, TODO: remove
      {
          value: this.bigNumberToBN(order.makerTokenAmount),
          type: 'uint256',
      },
      {
          value: this.bigNumberToBN(order.takerTokenAmount),
          type: 'uint256',
      },
      // { TODO: remove
      //     value: this.bigNumberToBN(order.makerFee),
      //     type: 'uint256',
      // },
      // { TODO: remove?
      //     value: this.bigNumberToBN(order.takerFee),
      //     type: 'uint256',
      // },
      {
          value: this.bigNumberToBN(order.expirationTimestampInSec),
          type: 'uint256',
      }
    ]
    console.log('getOrderHash:', orderParts)

    // const types = orderParts.map(o => o.type)
    // const values = orderParts.map(o => o.value)

    // const hashBuff = ethABI.soliditySHA3(types, values)
    // const hashHex = ethUtil.bufferToHex(hashBuff)

    const hashHex = utils.soliditySha3(...orderParts)

    return hashHex

  } // getOrderHash

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

  static parseSigHexToRSV(sigHex) {
    const { v, r, s } = fromRpcSig(sigHex)
    return {
      v,
      r: bufferToHex(r),
      s: bufferToHex(s),
    }
  }

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
