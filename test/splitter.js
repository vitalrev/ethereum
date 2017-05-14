var Splitter = artifacts.require("./Splitter.sol");

web3.eth.getTransactionReceiptMined = function (txnHash, interval) {
    var transactionReceiptAsync;
    interval = interval ? interval : 500;
    transactionReceiptAsync = function(txnHash, resolve, reject) {
        web3.eth.getTransactionReceipt(txnHash, (error, receipt) => {
            if (error) {
                reject(error);
            } else {
                if (receipt == null) {
                    setTimeout(function () {
                        transactionReceiptAsync(txnHash, resolve, reject);
                    }, interval);
                } else {
                    resolve(receipt);
                }
            }
        });
    };

    if (Array.isArray(txnHash)) {
        var promises = [];
        txnHash.forEach(function (oneTxHash) {
            promises.push(web3.eth.getTransactionReceiptMined(oneTxHash, interval));
        });
        return Promise.all(promises);
    } else {
        return new Promise(function (resolve, reject) {
                transactionReceiptAsync(txnHash, resolve, reject);
            });
    }
};

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
      if ((e + "").indexOf("invalid JUMP") > -1 || (e + "").indexOf("out of gas") > -1) {
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
    	return splitter.bob.call();
	  }).then( bobAddr => {
		  bobAddress = bobAddr;
		  return web3.eth.getBalance(bobAddress);
    }).then( balance => {
      bobBalanceBefore = balance.toNumber();
    	console.log("Bob balance before split: " + web3.fromWei(bobBalanceBefore, "ether"));
		  return splitter.carol.call();
	  }).then( carolAddr => {
		  carolAddress = carolAddr;
		  return web3.eth.getBalance(carolAddress);
    }).then( balance => {
      carolBalanceBefore = balance.toNumber();
    	console.log("Carol balance before split: " + web3.fromWei(carolBalanceBefore, "ether"));
    	//call contract
    	return splitter.split( { from: accounts[0], value: amountInWei } );
    }).then( result => {
    	return web3.eth.getBalance(bobAddress);
    }).then( balance => {
      bobBalanceAfter = balance.toNumber();
    	console.log("Bob balance after split: " + web3.fromWei(bobBalanceAfter, "ether"));
    	return web3.eth.getBalance(carolAddress);
    }).then( balance => {
      carolBalanceAfter = balance.toNumber();
    	console.log("Carol balance after split: " + web3.fromWei(carolBalanceAfter, "ether"));
    	assert.equal(bobBalanceAfter, bobBalanceBefore + amountInWei/2, "Bob balance is not correct");
    	assert.equal(carolBalanceAfter, carolBalanceBefore + amountInWei/2, "Carol balance is not correct");
    });
  });
/*
  it("exception by odd input values", function() {
  	var splitter;
  	var amountInWei = 1;
    return expectedExceptionPromise( function() {
    	Splitter.deployed().then( instance => {
    	splitter = instance;
    	return splitter.split( { from: accounts[0], value: amountInWei, gas: 300000 });
    }), 300000});
  });
*/
  it("destroy contract successful", function() {
    var splitter;
    return Splitter.deployed().then( instance => {
      splitter = instance;
      return splitter.destroy();
    }).then( destroyed => {
      console.log("contract destroy called -> check if destroyed");
      return splitter.owner();
    }).then( owner => {
      console.log("contract owner address after destroy: " + owner);
      assert.equal(owner, "0x", "contract is not destroyed");
    });
  });
})
