'use strict';
const assertJump = require('./helpers/assertJump');
const time = require('./helpers/timer');
const CrowdWallet = artifacts.require('./helpers/CrowdWalletMock.sol');
const GenesisToken = artifacts.require('./helpers/GenesisTokenMock.sol');

contract('CrowdWallet', function(accounts) {
  const account0 = accounts[0];
  const account1 = accounts[1];
  const initialBalance = 1000;
  const blocksPerPeriod = 120;

  it('should return the correct state after construction', async function() {
    const gns = await GenesisToken.new(account0, initialBalance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, blocksPerPeriod);
    const lifetimeDeposits = await crowdwallet.lifetimeDeposits();
    const lifetimePayouts = await crowdwallet.lifetimePayouts();
    const blocksPerPayPeriod = await crowdwallet.blocksPerPayPeriod();
    const previousPayoutBlock = await crowdwallet.previousPayoutBlock();
    const payoutPool = await crowdwallet.payoutPool();
    const owner = await crowdwallet.owner();

    assert.equal(lifetimeDeposits.toNumber(), 0, 'lifetime deposits invalid');
    assert.equal(lifetimePayouts.toNumber(), 0, 'lifetimePayouts invalid');
    assert.equal(blocksPerPayPeriod, 120, 'blocksPerPayPeriod invalid');
    assert.equal(previousPayoutBlock, 0, 'previousPayoutBlock invalid');
    assert.equal(payoutPool, 0, 'payoutPool invalid');
    assert.equal(owner, account0, 'owner invalid');
  });

  it('should track all deposits sent to it by address', async function() {
    const gns = await GenesisToken.new(account0, initialBalance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, blocksPerPeriod);

    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    await crowdwallet.sendTransaction({ from: account1, value: web3.toWei(1.5, 'ether') });

    let deposit0 = await crowdwallet.deposits.call(account0, 0);
    let deposit1 = await crowdwallet.deposits.call(account1, 0);

    // deposit is a struct which is returned as an array [amount, blockNum]
    deposit0 = web3.fromWei(deposit0[0].toNumber(), 'ether');
    deposit1 = web3.fromWei(deposit1[0].toNumber(), 'ether');

    assert.equal(deposit0, 5);
    assert.equal(deposit1, 1.5);
  });

  it('should allow owner to update the time period between payouts', async function() {
    const gns = await GenesisToken.new(account0, initialBalance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, blocksPerPeriod);

    await crowdwallet.setBlocksPerPayPeriod(12345);

    const numBlocks = await crowdwallet.blocksPerPayPeriod.call();

    assert.equal(numBlocks.toNumber(), 12345);
  });

  it('should pay out using the forumla: <% of tokens owned> * <total income during previous period>', async function() {
    const period = 50;
    const gns = await GenesisToken.new(account0, 0);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, period);
    // Earn some tokens
    await gns.giveTokens(account0, 1800);
    // Simulate some money being made.
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    // Time warp
    await time(period);
    // Start a new pay period.
    await crowdwallet.startNewPayoutPeriod();
    // Balance before withdrawing
    const balance0 = await web3.eth.getBalance(account0);

    // We should now be able to withdraw.
    await crowdwallet.withdraw({ from: account0 });

    const newBalance = await web3.eth.getBalance(account0);
    const earnedWei = newBalance.toNumber() - balance0.toNumber();
    const earnedEth = web3.fromWei(earnedWei);
    const roundedEarnings = Math.round(earnedEth);

    assert.equal(roundedEarnings, 15);
  });

  it('should throw an error when trying to withdraw more than once during a pay cycle', async function() {
    const period = 50;
    const gns = await GenesisToken.new(account0, 0);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, period);
    // Earn some tokens
    await gns.giveTokens(account0, 1800);
    // Simulate some money being made.
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    // Time warp to next cycle
    await time(period);
    // Start a new pay period.
    await crowdwallet.startNewPayoutPeriod();
    // We should now be able to withdraw.
    await crowdwallet.withdraw({ from: account0 });

    // try to withdraw a second time
    try {
      await crowdwallet.withdraw({ from: account0 });
    } catch(error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it('should throw an error if the payout amount is less than the minimum threshold', async function() {
    const period = 50;
    const gns = await GenesisToken.new(account0, initialBalance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, period);

    // Set minimum to 1 ETH
    await crowdwallet.setMinimumWithdrawal(web3.toWei(1, 'ether'));

    // Deposit 0.9 ETH
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(0.9, 'ether') });

    // Time warp to next cycle
    await time(period);

    // Start a new pay period.
    await crowdwallet.startNewPayoutPeriod();

    // Withdrawing should fail since only 0.9 ETH is allotted.
    try {
      await crowdwallet.withdraw({ from: account0 });
    } catch (error) {
      return assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  it('should not pay out during the first cycle', async function () {
    const gns = await GenesisToken.new(account0, initialBalance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, 999999999999);

    // Deposit ETH
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });

    // const isFirst = await crowdwallet.isFirstCycle.call();
    //
    // assert.equal(isFirst, true);

    // Withdrawing should fail since we are in first cycle
    try {
      await crowdwallet.withdraw({ from: account0 });
    } catch (error) {
      console.log(error);
      assertJump(error);
    }
    assert.fail('should have thrown before');
  });

  // calling manually now to save gas.
  it.skip('should re-calculate the pool the first time someone tries to withdraw in a new cycle, and save the result to storage', async function () {
    const period = 50;
    const balance = 1000;
    const gns = await GenesisToken.new(account0, balance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, period);

    // Give a 2nd account equivalent share.
    await gns.giveTokens(account1, balance);

    // Deposit ETH
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });

    // Time warp to next cycle
    await time(period);

    // Payout pool should be zero since no one tried to withdraw yet
    const pool0 = await crowdwallet.payoutPool.call();
    assert.equal(pool0, 0);

    // Start a new pay period.
    await crowdwallet.startNewPayoutPeriod();

    // withdraw
    await crowdwallet.withdraw({ from: account0 });

    // pool shuld be re-calculated.
    const pool1 = await crowdwallet.payoutPool();
    assert.equal(pool1, web3.toWei(5, 'ether'));

    // Deposit more
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(10, 'ether') });

    // Time warp to next cycle
    await time(period);

    // Start a new pay period.
    await crowdwallet.startNewPayoutPeriod();

    // In the first cycle, account1 never withdrew their ETH. therefore, the pool
    // in this cycle should have additional balance since the uncalimed balance
    // in each cycle should roll over.
    await crowdwallet.withdraw({ from: account0 });

    // Unclaimed in cycle 1 = 2.5 ETH, and cycle 2 earnings were 10 ETH.
    const pool2 = await crowdwallet.payoutPool.call();
    const expected = web3.toWei(12.5, 'ether');

    assert.equal(pool2.toNumber(), expected);
  });

  it.skip('should track all withdrawals by address', async function () {
    const gns = await GenesisToken.new(account0, initialBalance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, blocksPerPeriod);
    // Simulate some money being made.
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });

    const balance0 = await web3.eth.getBalance(account0);
    console.log(balance0);
    await crowdwallet.withdraw({ from: account0 });
    const balance1 = await web3.eth.getBalance(account0);

    assert.equal(balance1 - balance0, 15);
    //
    // const totalWithdrawals = await crowdwallet.lifetimePayouts.call();
    //
    // assert.equal(totalWithdrawals.toNumber(), web3.toWei(15, 'ether'));
  });

  // This isn't implemented at the moment. We would need to use formula:
  // <unclaimed> = <last period pool> - <withdrawn last period>
  // <curr oool> = <total balance> - <unclaimed>
  // <curr balance> = <share of gns> * <curr pool>
  it.skip('should let contributors query their balance even if they cant claim it yet', async function () {
    let balance0, balance1;
    const balance = 2500;
    const gns = await GenesisToken.new(account0, balance);
    const crowdwallet = await CrowdWallet.new(gns.address, account0, blocksPerPeriod);

    // Simulate some money being made.
    await crowdwallet.sendTransaction({ from: account0, value: web3.toWei(5, 'ether') });

    // Simulate someone else earning the same amount of tokens
    await gns.giveTokens(account1, balance);

    // We should each be entitled to 2.5 ETH now.
    balance0 = await crowdwallet.balanceOf(account0);
    balance1 = await crowdwallet.balanceOf(account1);
    balance0 = web3.fromWei(balance0.toNumber(), 'ether');
    balance1 = web3.fromWei(balance1.toNumber(), 'ether');

    assert.equal(balance0, 2.5);
    assert.equal(balance1, 2.5);
  });
});
