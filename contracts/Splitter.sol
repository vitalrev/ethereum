pragma solidity ^0.4.8;
import "./Owned.sol";

contract Splitter is Owned {
	address public bob;
	address public carol;
	bool public active;

	event Splitted(uint value);
	event Disabled(bool disabled);

    modifier valid() {
		if (msg.value == 0) {
				throw;
		}
		if (msg.value % 2 > 0) {
			throw;
		}
		_;
	}

	modifier isActive() {
		if (!active) {
			throw;
		}
		_;
	}

	function Splitter(address _bob, address _carol) {
		bob = _bob;
		carol = _carol;
		active = true;
	}

	function disable() 
		payable 
		onlyOwner()
		isActive() 
		returns (bool disabled) {
		//send ether from contract back to owner
		//uint myBalance = this.balance;
		//if (myBalance > 0)  {
		//	if (!owner.send(myBalance)) {
		//		throw;
		//	}
		//}
		active = false;
		Disabled(active);
		return true;
	}

	function split() 
		payable 
		onlyOwner()
		valid()
		isActive()
		returns (bool successful) {

		uint halfValue = msg.value / 2;		
		if (!bob.send(halfValue)) {
			throw;
		}
		//carol.send(msg.value / 2);
		if (!carol.send(halfValue)) {
			throw;
		}

		Splitted(msg.value);
		return true;
	}
}