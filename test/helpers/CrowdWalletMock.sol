pragma solidity ^0.4.11;

import '../../contracts/CrowdWallet.sol';

contract CrowdWalletMock is CrowdWallet {
  function CrowdWalletMock(
    address _gns,
    address _owner,
    uint blocksPerPayPeriod
  ) CrowdWallet(_gns, _owner, blocksPerPayPeriod) {}
}
