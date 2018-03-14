const CONTRACT = 'EtherToken'
let EtherToken = artifacts.require(CONTRACT)

contract(CONTRACT, (accounts) => {
  const account = accounts[0];

  let gasPrice;
  let etherTokenAddress;
  let token;

  const sendTransactionAsync = web3.eth.sendTransaction
  const getEthBalanceAsync = async (owner) => {
    return await web3.eth.getBalance(owner)
  }

  const getTransactionReceipt = async (txHash) => {
    return new Promise((resolve, reject) => {
      let pollTx = setInterval(() => {
        web3.eth.getTransactionReceipt(txHash, (ret, txObj) => {
          if (txObj) {
            clearInterval(pollTx)
            resolve(txObj)
          }
        })
      }, 2000)
    })
  }


  before(async () => {
    if (!EtherToken.address) console.error(CONTRACT, 'must be deployed prior to test')

    etherTokenAddress = EtherToken.address;

    web3.eth.getGasPrice((ret, price) => {
      gasPrice = price
    });

    EtherToken.deployed().then(async (instance) => {
      token = instance;
    })

    // console.info('EtherToken Address:', etherTokenAddress)
  });


  describe('deposit', () => {
    it('should throw if caller attempts to deposit more Ether than caller balance', async () => {
      const initEthBalance = await getEthBalanceAsync(account);
      const ethToDeposit = initEthBalance.plus(1);

      sendTransactionAsync({
        from: account,
        to: etherTokenAddress,
        value: ethToDeposit,
        gasPrice: gasPrice
      }, (err) => {
        expect(err).to.match(/sender doesn't have enough funds to send tx/)
      })
    })

    it('should convert deposited Ether to wrapped Ether tokens', async () => {
      const initEthBalance = await getEthBalanceAsync(account)
      const initEthTokenBalance = await token.balanceOf.call(account)
      const ethToDeposit = BigNumber(web3.toWei('1', 'ether'))

      const txDeposit = await token.deposit({value: ethToDeposit.toString()})
      const txReceipt = await getTransactionReceipt(txDeposit.tx)

      const ethSpentOnGas = gasPrice.times(txReceipt.gasUsed)
      const finalEthBalance = await getEthBalanceAsync(account)
      const finalEthTokenBalance = await token.balanceOf.call(account)

      expect(finalEthBalance.toString()).to.be.equal((initEthBalance.sub(ethToDeposit.add(ethSpentOnGas))).toString())
      expect(finalEthTokenBalance.toString()).to.be.equal((initEthTokenBalance.add(ethToDeposit)).toString())
    })
  })

  describe('withdraw', () => {
    // TODO: handle this somehow
    // it('should throw if caller attempts to withdraw greater than caller balance', async () => {
    //   const initEthTokenBalance = await token.balanceOf.call(account)
    //   const ethTokensToWithdraw = initEthTokenBalance.add(1)
    //   const txWithdraw = token.withdraw(ethTokensToWithdraw)
    //   return expect(txWithdraw).to.be.rejected;
    // });

    it('should convert ether tokens to ether with sufficient balance', async () => {
      const initEthBalance = await getEthBalanceAsync(account)
      const initEthTokenBalance = await token.balanceOf.call(account)
      const ethTokensToWithdraw = initEthTokenBalance
      expect(ethTokensToWithdraw.toString()).to.not.be.equal(0)

      const txWithdraw = await token.withdraw(ethTokensToWithdraw.toString())
      const txReceipt = await getTransactionReceipt(txWithdraw.tx)

      const ethSpentOnGas = gasPrice.times(txReceipt.gasUsed)
      const finalEthBalance = await getEthBalanceAsync(account)
      const finalEthTokenBalance = await token.balanceOf.call(account)

      expect(finalEthBalance.toString()).to.be.equal((initEthBalance.plus(ethTokensToWithdraw).minus(ethSpentOnGas)).toString())
      expect(finalEthTokenBalance.toString()).to.be.equal((initEthTokenBalance.minus(ethTokensToWithdraw)).toString())
    });
  });

  describe('fallback', () => {
    it('should convert sent ether to ether tokens', async () => {
      const initEthBalance = await getEthBalanceAsync(account)
      const initEthTokenBalance = await token.balanceOf.call(account)
      const ethToDeposit = BigNumber(web3.toWei('1', 'ether'))

      const txDeposit = await sendTransactionAsync({
        from: account,
        to: etherTokenAddress,
        value: ethToDeposit,
        gasPrice: gasPrice
      })

      const txReceipt = await getTransactionReceipt(txDeposit)
      const ethSpentOnGas = gasPrice.times(txReceipt.gasUsed)
      const finalEthBalance = await getEthBalanceAsync(account)
      const finalEthTokenBalance = await token.balanceOf.call(account)

      expect(finalEthBalance.toString()).to.be.equal((initEthBalance.sub(ethToDeposit.add(ethSpentOnGas))).toString())
      expect(finalEthTokenBalance.toString()).to.be.equal((initEthTokenBalance.add(ethToDeposit)).toString())
    });
  });
});
