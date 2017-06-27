pragma solidity ^0.4.2;

import "truffle/Assert.sol";
import "truffle/DeployedAddresses.sol";
import "../contracts/CrowdWallet.sol";

contract TestCrowdWallet {
  // Truffle will send the Contract 10 Ether after deploying the contract.
  public uint initialBalance = 10 ether;

  function testInitialBalanceUsingDeployedContract() {
    MyContract cw = CrowdWallet(DeployedAddresses.CrowdWallet());

    // perform an action which sends value to cw, then assert.
    /*cw.send(10 ether);*/

    Assert.equal(cw.balance, 10 ether, "Should have 20 ether");
  }

  function () {
    // This will NOT be executed when Ether is sent. \o/
  }
}
