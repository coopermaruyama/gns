pragma solidity ^0.4.11;

import '../../contracts/GenesisToken.sol';

contract GenesisTokenMock is GenesisToken {
  function GenesisTokenMock(
    address _initialAccount,
    uint256 _initialBalance
  ) GenesisToken(_initialAccount, _initialBalance) {}
}
