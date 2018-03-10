/**
 * Tests order creation, signing, signature verification, and order submission
 */

import Sniper from '../src/main.js'

const EXCHANGE_ADDR   = CFG.addr.dex
const NULL_ADDR       = '0x0000000000000000000000000000000000000000'
const TOKEN_MAKE_ADDR   = '0xfaBe65f11fE3EB25636333ca740A8C605494B9b1'
const TOKEN_TAKE_ADDR   = '0x6089982faab51b5758974cf6a502d15ca300a4eb'

let o = null // order
let oHash = null // order hash
let web3 = null
let snpr = null
let gasPrice = null
let account = null
let orderHash = null
let signature = null
const zeroBn = new BigNumber(0)


before(async () => {
  snpr = new Sniper({
    exchangeAddr: EXCHANGE_ADDR,
    provider: ROPSTEN_NET
  })

  await snpr.init()
  snpr.newAccount()
  gasPrice = new BigNumber(await snpr.getGasPriceAsync())

  web3 = snpr.getWeb3()
  account = (await web3._getAccounts())[0]
});


after(async () => {
  // workaround:
  // firebase node process does not exit on its own
  process.exit()
});


describe('Exchange: Order Submission', () => {
  it('should create and sign new order', async () => {

    const addPrefix = false
    const makerAddr = account
    const takerAddr = null
    const mTokenAddr = TOKEN_MAKE_ADDR
    const tTokenAddr = TOKEN_TAKE_ADDR
    const makerTokenAmount = new BigNumber(1)
    const takerTokenAmount = new BigNumber(1)
    const expireInSeconds = 10000
    const base = 'ETH'

    const currentTime = Date.now()

    // * @param {bool} addPrefix - Adds ethereum signed message prefix
    // * @param {string} makerAddr - Maker Address
    // * @param {string} takerAddr - Taker Address
    // * @param {string} makerTokenAddr - Maker Token Address
    // * @param {string} takerTokenAddr - Maker Token Address
    // * @param {BigNumber} makerTokenAmt - Maker Token Amount
    // * @param {BigNumber} takerTokenAmt - Taker Token Amount
    // * @param {Number} expirationUnixLen - Expiration length in seconds
    // * @param {string} base - ETH || EOS

    o = await snpr.createOrderAsync(
      addPrefix,
      makerAddr,
      takerAddr,
      mTokenAddr,
      tTokenAddr,
      makerTokenAmount,
      takerTokenAmount,
      expireInSeconds,
      base
    )

    expect(o.base).to.be.equal(base)
    expect(o.salt.toString() * 1).to.be.gte(0)
    expect(o.maker).to.be.equal(makerAddr)
    expect(o.taker).to.be.equal(NULL_ADDR)
    expect(o.makerTokenAddress).to.be.equal(TOKEN_MAKE_ADDR)
    expect(o.takerTokenAddress).to.be.equal(TOKEN_TAKE_ADDR)
    expect(o.makerTokenAmount).to.be.bignumber.equal(makerTokenAmount)
    expect(o.takerTokenAmount).to.be.bignumber.equal(takerTokenAmount)
    expect(o.expirationTimestampInSec.toString() * 1).to.be.gte(currentTime + expireInSeconds)
    expect(utils.isHexStrict(o.hashHex)).to.be.equal(true)
    expect(typeof o.sig).to.be.equal('object')
    expect(typeof o.sig.v).to.be.equal('number')
    expect(utils.isHexStrict(o.sig.r)).to.be.equal(true)
    expect(utils.isHexStrict(o.sig.s)).to.be.equal(true)
  })


  it('should get new order hash', async () => {
    oHash = snpr.getOrderHash(o)

    expect(utils.isHexStrict(o.hashHex)).to.be.equal(true)
    expect(oHash).to.be.equal(o.hashHex)
  })


  it('should verify newly-signed order', async () => {
    oHash = snpr.getOrderHash(o)
    const verification = snpr.verifySignature(oHash, o.maker, o.sig)

    expect(verification).to.be.equal(true)
  })


  it('should submit new order to order book', async () => {
    const pair = o.base + ':' + o.takerTokenAddress
    const orderBookBefore = await snpr.getOrderBookAsync(pair)
    const orderBookBeforeLen = orderBookBefore.length

    await snpr.submitOrderAsync(o)
    const orderBookAfter = await snpr.getOrderBookAsync(pair)
    const orderBookAfterLen = orderBookAfter.length

    expect(orderBookAfterLen).to.be.equal(orderBookBeforeLen + 1)
  }).timeout(20000)


  it('should not be allowed to submit insecure order', async () => {
    const orderBook = snpr.submitOrderUnsafe(o)

    return expect(orderBook).to.be
    .rejectedWith(/PERMISSION_DENIED/)
  }).timeout(10000)
})
