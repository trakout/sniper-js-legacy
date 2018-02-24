import { utils } from 'web3'
import { BigNumber } from 'bignumber.js'
import Util from 'component/Util'

const cfg = CFG

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


  /**
   * Validate and sanitize outgoing order
   * @param {object} o - complete order
   * @return {Promise} order object || Error
   */

  static sanitizeOrderOut(o) {
    return new Promise((resolve, reject) => {

      if (
        !o.base                                         ||
        (!(o.base === 'ETH' || o.base === 'EOS'))       ||
        !o.exchangeAddress                              ||
        !utils.isAddress(o.exchangeAddress)             ||
        (o.exchangeAddress !== cfg.addr.dex)            ||
        !o.expirationTimestampInSec                     ||
        !utils.isBigNumber(o.expirationTimestampInSec)  ||
        !o.hashHex                                      ||
        !Util.isHex(o.hashHex)                          ||
        !o.salt                                         ||
        !utils.isBigNumber(o.salt)                      ||
        !o.sig                                          ||
        !o.sig.v                                        ||
        (typeof o.sig.v !== 'number')                   ||
        !o.sig.r                                        ||
        (typeof o.sig.r !== 'string')                   ||
        !Util.isHex(o.sig.r)                            ||
        !o.sig.s                                        ||
        (typeof o.sig.s !== 'string')                   ||
        !Util.isHex(o.sig.s)                            ||
        !o.maker                                        ||
        !utils.isAddress(o.maker)                       ||
        !o.makerTokenAddress                            ||
        !utils.isAddress(o.makerTokenAddress)           ||
        !o.makerTokenAmount                             ||
        !utils.isBigNumber(o.makerTokenAmount)          ||
        !o.taker                                        ||
        !utils.isAddress(o.taker)                       ||
        !o.takerTokenAddress                            ||
        !utils.isAddress(o.takerTokenAddress)           ||
        !o.takerTokenAmount                             ||
        !utils.isBigNumber(o.takerTokenAmount)
      ) {
        reject(new Error('Assert.sanitizeOrderOut: invalid order'))
      }

      const quote = Util.getQuoteFromOrder(o)
      const order = {
        p:   o.base + ':' + quote,
        dex: o.exchangeAddress,
        exp: o.expirationTimestampInSec.toString(),
        h:   o.hashHex,
        s:   o.salt.toString(),
        sg:  o.sig,
        m:   o.maker,
        ma:  o.makerTokenAddress,
        mn:  o.makerTokenAmount.toString(),
        t:   o.taker,
        ta:  o.takerTokenAddress,
        tn:  o.takerTokenAmount.toString()
      }

      resolve(order)
    }) // Promise
  }

  /**
   * Validate and sanitize incoming order
   * @param {object} o - complete order
   * @return {Promise} order object || Error
   */
  static sanitizeOrderIn(order, transform) {
    return new Promise((resolve, reject) => {
      let o = null

      try {
        o = {
          p:   order.p,
          dex: order.dex,
          exp: transform ? new BigNumber(order.exp) : order.exp,
          h:   order.h,
          s:   transform ? new BigNumber(order.s) : order.s,
          sg:  order.sg,
          m:   order.m,
          ma:  order.ma,
          mn:  transform ? new BigNumber(order.mn) : order.mn,
          t:   order.t,
          ta:  order.ta,
          tn:  transform ? new BigNumber(order.tn) : order.tn
        }
      } catch (e) {
        reject(new Error('Assert.sanitizeOrderIn: ' + e))
      }

      const base = Util.getBaseFromPair(o.p)
      const quote = Util.getQuoteFromPair(o.p)
      const saltBn = transform ? o.s : new BigNumber(o.s)
      const expBn = transform ? o.exp : new BigNumber(o.exp)
      const maxExp = new BigNumber(Date.now() + (cfg.max_expiry * 1))
      const currentTime = new BigNumber(Date.now())
      const zeroBn = new BigNumber(0)

      if (
        !o ||
        !base ||
        (!(base === 'ETH' || base === 'EOS'))             ||
        (Util.getQuoteFromOrder(o) !== quote)             ||
        !o.dex                                            ||
        !utils.isAddress(o.dex)                           ||
        (o.dex !== cfg.addr.dex)                          ||
        !o.exp                                            ||
        (transform && !utils.isBigNumber(o.exp))          ||
        (!transform && (typeof o.exp !== 'string'))       ||
        (currentTime.gte(expBn))                          ||
        !o.h                                              ||
        !Util.isHex(o.h)                                  ||
        !o.s                                              ||
        (transform && !utils.isBigNumber(o.s))            ||
        (!transform && (typeof o.s !== 'string'))         ||
        (saltBn.lte(zeroBn))                              ||
        !o.sg                                             ||
        !o.sg.v                                           ||
        (typeof o.sg.v !== 'number')                      ||
        !o.sg.r                                           ||
        (typeof o.sg.r !== 'string')                      ||
        !Util.isHex(o.sg.r)                               ||
        !o.sg.s                                           ||
        (typeof o.sg.s !== 'string')                      ||
        !Util.isHex(o.sg.s)                               ||
        !o.m                                              ||
        !utils.isAddress(o.m)                             ||
        !o.ma                                             ||
        !utils.isAddress(o.ma)                            ||
        !o.mn                                             ||
        (transform && !utils.isBigNumber(o.mn))           ||
        (!transform && (typeof o.mn !== 'string'))        ||
        (transform && o.mn.lte(zeroBn))                   ||
        (!transform && (new BigNumber(o.mn)).lte(zeroBn)) ||
        !o.t                                              ||
        !utils.isAddress(o.t)                             ||
        !o.ta                                             ||
        !utils.isAddress(o.ta)                            ||
        !o.tn                                             ||
        (transform && !utils.isBigNumber(o.tn))           ||
        (!transform && (typeof o.tn !== 'string'))
      ) {
        reject(new Error('Assert.sanitizeOrderIn: invalid order'))
      }

      resolve(o)
    })
  }
}
