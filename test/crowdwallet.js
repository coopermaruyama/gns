var CrowdWallet = artifacts.require("./CrowdWallet.sol");

contract('CrowdWallet', function(accounts) {
  it("should put 10000 points in the first account", function() {
    return CrowdWallet.deployed().then(function(instance) {
      return instance.getPoints.call(accounts[0]);
    }).then(function(balance) {
      assert.equal(balance.valueOf(), 10000, "10000 wasn't in the first account");
    });
  });

  it('should let you add points', function () {
    var instance;
    return CrowdWallet.deployed().then(function(_instance) {
      instance = _instance;
      return instance.addPoints(accounts[1], 5000);
    }).then(function(didAdd) {
      return instance.getPoints.call(accounts[1]);
    }).then(function(balance) {
      assert.equal(balance, 5000, "Balance was not 5000");
    });
  });

  it('should track the total points ever rewarded', function () {
    var instance;
    var initialBalance;

    return CrowdWallet.deployed().then(function(_instance) {
      instance = _instance;
      return instance.getTotalPoints.call(accounts[0]);
    }).then(function(balance) {
      initialBalance = balance.toNumber();
      return instance.addPoints(accounts[1], 5000);
    }).then(function() {
      return instance.getTotalPoints.call();
    }).then(function(totalPoints) {
      assert.equal(
        totalPoints.toNumber(),
        initialBalance + 5000,
        'Total was not correct.'
      );
    })
  });

  it('returns balance', function () {
    return CrowdWallet.deployed().then(function(instance) {
      return instance.ethBalance.call();
    }).then(function(bal) {
      assert.equal(bal.toNumber(), 0, 'should be 0');
    })
  });

  it('should let contributors check their balance', function () {
    var contributor = accounts[1];
    var crowdwallet;
    var contractEthBalance;
    var total;
    var points;

    return CrowdWallet.new().then(function(instance) {
      crowdwallet = instance;
      return crowdwallet.send(web3.toWei(10, 'ether'));
    })
    .then(function() {
      return crowdwallet.addPoints(contributor, 10000);
    })
    .then(function(result) {
      return crowdwallet.getTotalPoints.call();
    })
    .then(function(n) {
      total = n.toNumber();
      return crowdwallet.contract._eth.getBalance(crowdwallet.address);
    })
    .then(function(n) {
      contractEthBalance = web3.fromWei(n.toNumber(), 'ether');
      return crowdwallet.getPoints.call(contributor);
    })
    .then(function(n) {
      points = n.toNumber();
      return crowdwallet.checkBalance.call(contributor);
    })
    .then(function(wei) {
      // The total 'pot' should be 10 eth, and this user has earned 50% of the
      // points. Therefore, he should be entitled to 5 ETH.
      var balance = web3.fromWei(wei.toNumber(), 'ether');

      assert.equal(
        balance,
        5,
        'Expected balance to equal expected'
      );
    })
  });
});
