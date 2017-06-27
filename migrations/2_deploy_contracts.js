var CrowdWallet = artifacts.require("./CrowdWallet.sol");

module.exports = function(deployer) {
  deployer.deploy(CrowdWallet);
};
