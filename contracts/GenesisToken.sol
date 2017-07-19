/**
 *
 *               And God saw everything that he had made,
 *               and behold, it was very good.
 *                                         - Genesis 1:31
 *
 * Genesis tokens (GNS) represent creation. They are used to track contributions
 * that people make for the benefit of some cause or organization. GNS tokens
 * are distributed to contributors, and holding these tokens gives them access
 * to a share of the value created (revenue) by the entity which they
 * contributed to.
 *
 * Genesis tokens are therefore able to inflate infinitely. There is no fixed
 * supply. They are mined by human work, just like bitcoins are mined by
 * computational work.
 *
 * Implementation requirements:
 * - ERC-20 Compliant
 * - Can be traded
 * - Mintable by a multisig transaction
 */
pragma solidity ^0.4.4;

import 'zeppelin-solidity/contracts/token/StandardToken.sol';
import 'zeppelin-solidity/contracts/ownership/Ownable.sol';
import 'zeppelin-solidity/contracts/math/SafeMath.sol';

contract GenesisToken is StandardToken, Ownable {
  using SafeMath for uint256;

  // metadata
  string public constant name = 'Genesis';
  string public constant symbol = 'GNS';
  uint256 public constant decimals = 18;
  string public version = '0.0.1';

  // events
  event EarnedGNS(address indexed contributor, uint256 amount);
  event TransferredGNS(address indexed from, address indexed to, uint256 value);

  // constructor
  function GenesisToken(
    address _owner,
    uint256 initialBalance)
  {
    owner = _owner;
    totalSupply = initialBalance;
    balances[_owner] = initialBalance;
    EarnedGNS(_owner, initialBalance);
  }

  /**
   * @dev Function to mint tokens
   * @param _to The address that will recieve the minted tokens.
   * @param _amount The amount of tokens to mint.
   * @return A boolean that indicates if the operation was successful.
   */
  function giveTokens(address _to, uint256 _amount) onlyOwner returns (bool) {
    totalSupply = totalSupply.add(_amount);
    balances[_to] = balances[_to].add(_amount);
    EarnedGNS(_to, _amount);
    return true;
  }
}
