import { utils } from 'web3'
import { BigNumber } from 'bignumber.js'

export default class Assert {

  static isAddress(addr) {
    return utils.isAddress(addr)
  }

  static orderJson(json) {
    let err = false

    if (!utils.isBigNumber(json.salt)) {
      console.log('Assert.orderJson: invalid salt')
      err = true
    }

    if (!utils.isAddress(json.maker)) {
      console.error('Assert.orderJson: invalid maker')
      err = true
    }

    if (!utils.isAddress(json.taker)) {
      console.error('Assert.orderJson: invalid taker')
      err = true
    }

    if (!utils.isAddress(json.exchangeAddress)) {
      console.error('Assert.orderJson: invalid exchangeAddress')
      err = true
    }

    if (!utils.isAddress(json.makerTokenAddress)) {
      console.error('Assert.orderJson: invalid makerTokenAddress')
      err = true
    }

    if (!utils.isAddress(json.takerTokenAddress)) {
      console.error('Assert.orderJson: invalid takerTokenAddress')
      err = true
    }

    if (!utils.isBigNumber(json.makerTokenAmount)) {
      console.error('Assert.orderJson: invalid makerTokenAmount')
      err = true
    }

    if (!utils.isBigNumber(json.takerTokenAmount)) {
      console.error('Assert.orderJson: invalid takerTokenAmount')
      err = true
    }

    if (!utils.isBigNumber(json.expirationTimestampInSec)) {
      console.error('Assert.orderJson: invalid expirationTimestampInSec')
      err = true
    }

    if (typeof json.base !== 'string') {
      console.error('Assert.orderJson: invalid base')
      err = true
    }

    return err
  }
}
