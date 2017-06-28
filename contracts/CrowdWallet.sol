pragma solidity ^0.4.4;

/**
 * TODO Currently, to check if a contributor can withdraw funds, the contract
 * simply calculates a contributor's percentage share and multiplies the balance
 * by this number. So, if someone has a 40% share, and there is 10 ETH, they are
 * entitled to 4 ETH. However, since we don't store history, they can simply
 * call the withdraw function again and get 40% of the remaining 6 ETH, and then
 * keep doing that. The contract therefore should track the entire amount of
 * ETH it has ever earned, and store the entire amount each contributor has ever
 * withdrawn, and use that for calculations instead.
 */

contract CrowdWallet {

	// Contract owner
	address public owner;

	// maps addresses to the points they have (determines profit share %)
	mapping (address => uint) public points;

	// The total supply of 'points earned'
	uint public sumPoints;

	// Determines the minimum amount a contributor can withdraw in a transaction.
	// This means a contributor must have earned at least this amount in order to
	// withdraw ETH.
	uint public minWithdrawal;

	event AddPoints(address indexed _contributor, uint256 _amount);

	function CrowdWallet(uint _minWithdrawal, uint _initialPoints) {
		require(_minWithdrawal > 0);
		require(_initialPoints >= 0);
		owner = msg.sender;
		points[owner] = _initialPoints;
		sumPoints = _initialPoints;
		minWithdrawal = _minWithdrawal;
	}

	// Points should only ever be added using this funtion to insure sum is
	// incremented properly.
	function addPoints(address contributor, uint amount) returns(bool) {
		if (msg.sender != owner) return false;
		points[contributor] += amount;
		sumPoints += amount;
		return true;
	}

	// Check how many points a contributor has earned.
	function getPoints(address addr) constant returns(uint) {
		return points[addr];
	}

	// Check the total sum of points earned by all contributors.
	// We determine a contributor's "share" using (points / sumPoints).
	function getTotalPoints() constant returns(uint) {
		return sumPoints;
	}

	// Check the contract's ETH balance.
	function ethBalance() constant returns(uint) {
		return this.balance;
	}

	// Contributors will use this to check how much ETH is allocated to them.
	function checkBalance(address addr) constant returns(uint) {
		var pts = points[addr];

		if (pts > 0) {
			var percent = (pts * 100) / sumPoints;
			var ethBalance = (this.balance * percent) / 100;
			return ethBalance;
		}

		return 0;
	}

	// Contributors can call this to withdraw their earnings.
	function withdraw(address addr, uint amount) returns(bool) {
		if (checkBalance(addr) >= amount && amount >= minWithdrawal) {
			return addr.send(amount);
		}
		return false;
	}


	function () payable {}
}
