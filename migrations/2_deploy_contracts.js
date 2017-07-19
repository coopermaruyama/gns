var CrowdWallet = artifacts.require("CrowdWallet");
var GenesisToken = artifacts.require('GenesisToken');

module.exports = function(deployer, network, accounts) {
  var owner = accounts[0];
  var initialBalance = 100000; // Initial GNS tokens
  var blocksPerPayPeriod = 172800; // about 30 days

  deployer.deploy(GenesisToken, owner, initialBalance).then(function() {
    var gns = GenesisToken.address;

    return deployer.deploy(CrowdWallet, gns, owner, blocksPerPayPeriod);
  });
};
