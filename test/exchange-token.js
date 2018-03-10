/**
 * Tests SniperJS Token functionality
 */

import Sniper from '../src/main.js'

const EXCHANGE_ADDR         = CFG.addr.dex
const UNLIMITED_ALLOWANCE   = new BigNumber(2).pow(256).minus(1)
const NULL_ADDR             = '0x0000000000000000000000000000000000000000'
const CONTRACT_ETHER_TOKEN  = 'EtherToken'
const CONTRACT_TEST_TOKEN   = 'TestToken'
let EtherToken              = artifacts.require(CONTRACT_ETHER_TOKEN)
let TestToken               = artifacts.require(CONTRACT_TEST_TOKEN)


contract(CONTRACT_TEST_TOKEN, (accountsNotUsed) => {
  let web3Wrapper = null
  let snpr = null
  let gasPrice = null
  let account0 = null
  let account1 = null
  let account2 = null
  let EtherTokenAddr = null
  let TestTokenAddr = null
  let weth = null // wrapped ether/ethertoken
  let tst = null // test token
  const zeroBn = new BigNumber(0)
  const tstBalance = new BigNumber(web3.toWei(126, 'ether'))


  before(async () => {

    if (!EtherToken.address) console.error(CONTRACT_ETHER_TOKEN, 'must be deployed prior to test')
    if (!TestToken.address) console.error(CONTRACT_TEST_TOKEN, 'must be deployed prior to test')
    EtherTokenAddr = EtherToken.address
    TestTokenAddr = TestToken.address

    snpr = new Sniper({
      exchangeAddr: EXCHANGE_ADDR,
      provider: LOCAL_NET
    })

    await snpr.init()
    snpr.newAccount(3)
    gasPrice = new BigNumber(await snpr.getGasPriceAsync())

    web3Wrapper = snpr.getWeb3()
    const accounts = await web3Wrapper._getAccounts()
    account0 = accounts[0]
    account1 = accounts[1]
    account2 = accounts[2]

    // load accounts with some ether
    await snpr.sendTransactionAsync(
      accountsNotUsed[0],
      account0,
      web3.toWei(20, 'ether')
    )
    await snpr.sendTransactionAsync(
      accountsNotUsed[0],
      account2,
      web3.toWei(20, 'ether')
    )

    TestToken.deployed().then(async (instance) => {
      instance.setBalance(account0, tstBalance)
      return
    })
  })



  describe('Exchange: Token Functions', () => {
    it('should get address\'s balance', async () => {
      // testtoken already set in 'before' lifecycle step, now get balance
      const balance = await snpr.getBalanceAsync(TestTokenAddr, account0)
      expect(balance.toString()).to.be.equal(tstBalance.toString())
    })

    it('should transfer tokens between users', async () => {
      // account0, and account1 -- check account 1's balance
      const amount = new BigNumber(web3.toWei(26, 'ether'))
      const balanceBefore0 = await snpr.getBalanceAsync(TestTokenAddr, account0)
      const balanceBefore1 = await snpr.getBalanceAsync(TestTokenAddr, account1)

      const tx = await snpr.transferAsync(
        TestTokenAddr,
        account0,
        account1,
        amount
      )
      await snpr.pollTransactionAsync(tx.transactionHash)

      const balanceAfter0 = await snpr.getBalanceAsync(TestTokenAddr, account0)
      const balanceAfter1 = await snpr.getBalanceAsync(TestTokenAddr, account1)

      const check0 = balanceBefore0.minus(amount)
      const check1 = balanceBefore1.plus(amount)

      expect(balanceAfter0.toString()).to.be.equal(check0.toString())
      expect(balanceAfter1.toString()).to.be.equal(check1.toString())
    })

    it('should set unlimited approval', async () => {
      // set approval using account2 as spender, account0 as owner
      const tx = await snpr.setUnlimitedApprovalAsync(TestTokenAddr, account0, account2)
      await snpr.pollTransactionAsync(tx.transactionHash)

      const allowance = await snpr.getAllowanceAsync(
        TestTokenAddr, account0, account2
      )
      expect(allowance.toString()).to.be.equal(UNLIMITED_ALLOWANCE.toString())
    })

    it('spender should be able to run transferFrom', async () => {
      // use account2 to send funds to account1, and account2
      const amount = new BigNumber(web3.toWei(20, 'ether'))
      const initialBalance0 = await snpr.getBalanceAsync(TestTokenAddr, account0)
      const initialBalance1 = await snpr.getBalanceAsync(TestTokenAddr, account1)
      const initialBalance2 = await snpr.getBalanceAsync(TestTokenAddr, account2)
      const tx1 = await snpr.transferFromAsync(
        TestTokenAddr,
        account0,
        account1,
        account2,
        amount
      )
      const tx2 = await snpr.transferFromAsync(
        TestTokenAddr,
        account0,
        account2,
        account2,
        amount
      )
      await snpr.pollTransactionAsync(tx1.transactionHash)
      await snpr.pollTransactionAsync(tx2.transactionHash)

      const finalBalance0 = await snpr.getBalanceAsync(TestTokenAddr, account0)
      const finalBalance1 = await snpr.getBalanceAsync(TestTokenAddr, account1)
      const finalBalance2 = await snpr.getBalanceAsync(TestTokenAddr, account2)

      const check0 = initialBalance0.minus(amount.plus(amount))
      const check1 = initialBalance1.plus(amount)
      const check2 = initialBalance2.plus(amount)

      expect(check0.toString()).to.be.equal(finalBalance0.toString())
      expect(check1.toString()).to.be.equal(finalBalance1.toString())
      expect(check2.toString()).to.be.equal(finalBalance2.toString())
    })

    it('should deposit 1:1 (WETH)', async () => {
      // send ETH to EtherToken contract, get balance
      const initialBalance = await snpr.getEthBalanceAsync(account0)
      const amount = new BigNumber(web3.toWei(10, 'ether'))

      const tx = await snpr.depositAsync(
        EtherTokenAddr,
        account0,
        amount
      )
      await snpr.pollTransactionAsync(tx.transactionHash)

      const wethBalance = await snpr.getBalanceAsync(EtherTokenAddr, account0)
      const finalBalance = await snpr.getEthBalanceAsync(account0)

      const gasUsed = gasPrice.times(tx.gasUsed)
      const balanceCheck = initialBalance.minus(amount.plus(gasUsed))

      expect(wethBalance.toString()).to.be.equal(amount.toString())
      expect(finalBalance.toString()).to.be.equal(balanceCheck.toString())
    })

    it('should withdraw 1:1 (WETH)', async () => {
      // send ETH to EtherToken contract, get balance
      // ensure address ETH and WETH balances are correct

      const initialBalance = await snpr.getEthBalanceAsync(account0)
      const initialWethBalance = await snpr.getBalanceAsync(EtherTokenAddr, account0)
      const amount = new BigNumber(web3.toWei(5, 'ether'))

      const tx = await snpr.withdrawAsync(
        EtherTokenAddr,
        account0,
        amount
      )
      await snpr.pollTransactionAsync(tx.transactionHash)

      const finalWethBalance = await snpr.getBalanceAsync(EtherTokenAddr, account0)
      const finalBalance = await snpr.getEthBalanceAsync(account0)

      const gasUsed = gasPrice.times(tx.gasUsed)
      const balanceCheck = initialBalance.plus(amount.minus(gasUsed))

      expect(finalWethBalance.toString()).to.be.equal((initialWethBalance.minus(amount)).toString())
      expect(finalBalance.toString()).to.be.equal(balanceCheck.toString())
    })
  })
});
