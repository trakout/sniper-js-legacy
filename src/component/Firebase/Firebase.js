import firebase from '@firebase/app'
import '@firebase/firestore'

import Net from '../../component/Net'
import Util from '../../component/Util'
import Assert from '../../component/Assert'

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
      let order = null
      try {
        order = await Assert.sanitizeOrderOut(o)
      } catch (e) {
        console.error(e)
        reject(e)
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
      let order = null
      try {
        order = await Assert.sanitizeOrderOut(o)
      } catch (e) {
        console.error(e)
        reject(e)
      }

      Net.request(cfg.fb.api + 'ordersubmit', order)
      .then((result) => {
        resolve(result)
      }, (error) => {
        if (error) reject(error)
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

  async _getOrderBook(pair) {
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
