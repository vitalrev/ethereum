var Splitter = artifacts.require("./Splitter.sol");

var expectedExceptionPromise = function (action, gasToUse) {
  return new Promise(function (resolve, reject) {
      try {
        resolve(action());
      } catch(e) {
        reject(e);
      }
    })
    .then(function (txn) {
      // https://gist.github.com/xavierlepretre/88682e871f4ad07be4534ae560692ee6
      return web3.eth.getTransactionReceiptMined(txn);
    })
    .then(function (receipt) {
      // We are in Geth
      assert.equal(receipt.gasUsed, gasToUse, "should have used all the gas");
    })
    .catch(function (e) {
      if ((e + "").indexOf("invalid JUMP") || (e + "").indexOf("out of gas") > -1) {
        // We are in TestRPC
      } else if ((e + "").indexOf("please check your gas amount") > -1) {
        // We are in Geth for a deployment
      } else {
        throw e;
      }
    });
};

//Tests
contract('Splitter', function(accounts) {
  it("both addresses (bob and carol) are not null", function() {
  	var splitter;
    return Splitter.deployed().then( instance => {
    	splitter = instance;
    	var bobAddr = splitter.bob()
    	assert.isNotNull(bobAddr, "Bob address is not defined");
    	return bobAddr;
    }).then( bobAddr => {
    	console.log("bob address: " + bobAddr);
    	var carolAddr = splitter.carol();
    	assert.isNotNull(carolAddr, "Carol address is not definde");
    	return carolAddr;
    }).then( carolAddr => {
    	console.log("carol address: " + carolAddr);    	
    });
  });

  it("both addresses are correct", function() {
  	var splitter;
    return Splitter.deployed().then( instance => {
    	splitter = instance;
    	var bobAddr = splitter.bob()
    	return bobAddr;
    }).then( bobAddr => {
    	assert.equal(bobAddr, accounts[1], "Bob address is not correct");
    	var carolAddr = splitter.carol();
    	return carolAddr;
    }).then( carolAddr => {
    	assert.equal(carolAddr, accounts[2], "Carol address is not correct");
    });
  });


  it("both balances are incremented after split", function() {
  	var splitter;
  	var bobAddress;
  	var bobBalanceBefore;
  	var bobBalanceAfter;
  	var carolAddress;
  	var carolBalanceBefore;
  	var carolBalanceAfter;
  	var amountInWei = web3.toWei(2, "ether");

    return Splitter.deployed().then( instance => {
    	splitter = instance;
    	return splitter.bob();
	  }).then( bobAddr => {
		  bobAddress = bobAddr;
		  bobBalanceBefore = web3.eth.getBalance(bobAddress).toNumber();
    	console.log("Bob balance before split: " + web3.fromWei(bobBalanceBefore, "ether"));
		  return splitter.carol();
	  }).then( carolAddr => {
		  carolAddress = carolAddr;
		  carolBalanceBefore = web3.eth.getBalance(carolAddress).toNumber();
    	console.log("Carol balance before split: " + web3.fromWei(carolBalanceBefore, "ether"));
    	//call contract
    	return splitter.split( { from: accounts[0], value: amountInWei } );
    }).then( result => {
    	bobBalanceAfter = web3.eth.getBalance(bobAddress).toNumber();
    	console.log("Bob balance after split: " + web3.fromWei(bobBalanceAfter, "ether"));
    	carolBalanceAfter = web3.eth.getBalance(carolAddress).toNumber();
    	console.log("Carol balance after split: " + web3.fromWei(carolBalanceAfter, "ether"));
    	assert.equal(bobBalanceAfter, bobBalanceBefore + amountInWei/2, "Bob balance is not correct");
    	assert.equal(carolBalanceAfter, carolBalanceBefore + amountInWei/2, "Carol balance is not correct");
    });
  });

  it("exception by odd input values", function() {
  	var splitter;
  	var amountInWei = 1;
    return expectedExceptionPromise( function() {
    	Splitter.deployed().then( instance => {
    	splitter = instance;
    	return splitter.split.call( { from: accounts[0], value: amountInWei, gas: 300000 });
    }), 300000});
  });

  it("deactivate contract successful", function() {
    var splitter;
    return Splitter.deployed().then( instance => {
      splitter = instance;
      return splitter.disable.call();
    }).then( disabled => {
      console.log("contract disabled");
      return splitter.active();
    }).then( active => {
      console.log("contract active: " + active);
      assert.isFalse(active, "contract can't be deactivated");
    });
  });

  it("exception by deactivated contract", function() {
    var splitter;
    var amountInWei = 2;
    return Splitter.deployed().then( instance => {
      splitter = instance;
      return splitter.disable.call();
    }).then( deactivated => {
      console.log("contract deactivated");
      return expectedExceptionPromise( function() {
         return splitter.split.call( { from: accounts[0], value: amountInWei, gas: 300000 })
      , 300000});
    });
  });
})
