import firebase from '@firebase/app'
import '@firebase/firestore'
import 'whatwg-fetch'
import Util from 'component/Util'

const cfg = CFG

export default class Firebase {
  constructor() {
    this.unsubOrderBook = null
    this.cbOrderBook = null

    this.app = firebase.initializeApp({
      apiKey:     cfg.fb.apiKey,
      authDomain: cfg.fb.authDomain,
      projectId:  cfg.fb.projectId
    })
    this.db = firebase.firestore()
  }


  /**
   * Insecure order submission -- this should never be possible
   * @param {object} o - complete order
   * @return {Promise}
   */

  async _submitOrderInsecure(o) {
    return new Promise( async (resolve, reject) => {
      let quote = Util.getQuoteFromOrder(o)

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
        tn:  o.takerTokenAmount.toString(),
      }

      this.db.collection('order_sub')
      .add(order)
      .then(function(docRef) {
        resolve(Object.assign({}, order, {id: docRef.id}))
      })
      .catch(function(error) {
        reject(new Error('Error submitting order: ' + error))
      })
    }) // Promise
  }


  /**
   * Order submission
   * @param {object} o - complete order
   * @return {Promise}
   */

  async _submitOrder(o) {
    return new Promise( async (resolve, reject) => {
      let quote = Util.getQuoteFromOrder(o)

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
        tn:  o.takerTokenAmount.toString(),
      }

      fetch(cfg.fb.api + 'ordersubmit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(order)
      })

    }) // Promise
  }


  /**
   * Send snapshot of orders, run callback each time state changes
   * can be called multiple times. Each new call will
   * stop subsequent listening and reset the callback.
   * @param {object} pair - base:quote
   * @param {function} cb - callback
   */

  _listenOrderBook(pair, cb) {
    if (this.unsubOrderBook) this.unsubOrderBook() // unsubscribe
    this.cbOrderBook = cb
    const sanitizedPair = Util.checksumPair(pair)

    this.unsubOrderBook = this.db.collection('order_sub')
    .where('p', '==', sanitizedPair)
    .onSnapshot((querySnapshot) => {
      let orders = []
      querySnapshot.forEach((doc) => {
        orders.push(doc.data())
      });
      this.cbOrderBook(orders)
    }, function(error) {
      console.log(new Error('listenOrderBook: ' + error))
    })
  }


  /**
   * Get order book once (no subsequent listening)
   * @param {object} pair - base:quote
   * @return {Promise}
   */

  _getOrderBook(pair) {
    return new Promise( async (resolve, reject) => {
      const sanitizedPair = Util.checksumPair(pair)

      this.db.collection('order_sub')
      .where('p', '==', sanitizedPair)
      .get()
      .then(function(querySnapshot) {
        let orders = []
        querySnapshot.forEach(function(doc) {
          orders.push(doc.data())
        })
        resolve(orders)
      }).catch(function(error) {
        reject(new Error('getOrderBook: ' + error))
      })
    }) // Promise
  }

}
