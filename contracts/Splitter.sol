pragma solidity ^0.4.8;
import "./Owned.sol";

contract Splitter is Owned {
	address public bob;
	address public carol;
	bool public destroyed;

	event LogSplitted(uint value);

    modifier valid() {
		if (msg.value == 0) {
				throw;
		}
		if (msg.value % 2 > 0) {
			throw;
		}
		if (destroyed) {
			throw;
		}
		_;
	}

	function Splitter(address _bob, address _carol) {
		bob = _bob;
		carol = _carol;
	}

	//fallback
	function() { }

	function destroy() 
		onlyOwner() {
		destroyed = true;
		selfdestruct(msg.sender);
	}

	function split() 
		payable 
		onlyOwner()
		valid()
		returns (bool successful) {

		uint halfValue = msg.value / 2;		
		if (!bob.send(halfValue)) {
			throw;
		}
		//carol.send(msg.value / 2);
		if (!carol.send(halfValue)) {
			throw;
		}

		LogSplitted(msg.value);
		return true;
	}
}