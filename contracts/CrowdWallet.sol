pragma solidity ^0.4.4;

import "./ConvertLib.sol";

contract CrowdWallet {

	address public owner;

	// maps addresses to the points they have (determines profit share %)
	mapping (address => uint) public points;

	address[] internal contributors;

	// Track total points ever rewarded
	uint public sumPoints;

	event AddPoints(address indexed _contributor, uint256 _amount);

	function CrowdWallet() {
		owner = tx.origin;
		points[owner] = 10000;
		sumPoints = 10000;
	}

	// Points should only ever be added using this funtion to insure sum is
	// incremented properly.
	function addPoints(address contributor, uint amount) returns(bool) {
		if (msg.sender != owner) return false;
		points[contributor] += amount;
		sumPoints += amount;
		return true;
	}

	function getPoints(address addr) returns(uint) {
		return points[addr];
	}

	function getTotalPoints() returns(uint) {
		return sumPoints;
	}

	function ethBalance() returns(uint) {
		return this.balance;
	}

	// Contributors will use this to check how much ETH is allocated to them.
	function checkBalance(address addr) returns(uint) {
		var pts = points[addr];
		if (pts > 0) {
			var percent = (pts * 100) / sumPoints;
			var ethBalance = (this.balance * percent) / 100;
			return ethBalance;
		} else {
			return 0;
		}
	}

	function () payable {}
}
