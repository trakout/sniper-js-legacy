import { utils } from 'web3'
import { BigNumber } from 'bignumber.js'

export default class Assert {


  /**
   * Check for valid address
   * @param {string} addr - Address
   * @return {boolean}
   */

  static isAddress(addr) {
    return utils.isAddress(addr)
  }


  /**
   * Poor-man's schema check for Order creation
   * @param {orderJson} data - Order data
   * @return {boolean}
   */

  static orderJson(data) {
    let err = false

    if (!utils.isBigNumber(data.salt)) {
      console.log('Assert.orderJson: invalid salt')
      err = true
    }

    if (!utils.isAddress(data.maker)) {
      console.error('Assert.orderJson: invalid maker')
      err = true
    }

    if (!utils.isAddress(data.taker)) {
      console.error('Assert.orderJson: invalid taker')
      err = true
    }

    if (!utils.isAddress(data.exchangeAddress)) {
      console.error('Assert.orderJson: invalid exchangeAddress')
      err = true
    }

    if (!utils.isAddress(data.makerTokenAddress)) {
      console.error('Assert.orderJson: invalid makerTokenAddress')
      err = true
    }

    if (!utils.isAddress(data.takerTokenAddress)) {
      console.error('Assert.orderJson: invalid takerTokenAddress')
      err = true
    }

    if (!utils.isBigNumber(data.makerTokenAmount)) {
      console.error('Assert.orderJson: invalid makerTokenAmount')
      err = true
    }

    if (!utils.isBigNumber(data.takerTokenAmount)) {
      console.error('Assert.orderJson: invalid takerTokenAmount')
      err = true
    }

    if (!utils.isBigNumber(data.expirationTimestampInSec)) {
      console.error('Assert.orderJson: invalid expirationTimestampInSec')
      err = true
    }

    if (typeof data.base !== 'string') {
      console.error('Assert.orderJson: invalid base')
      err = true
    }

    return err
  }
}
