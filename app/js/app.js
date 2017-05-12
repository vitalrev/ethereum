require("file-loader?name=../index.html!../index.html");
const Web3 = require("web3");
const Promise = require("bluebird");
const truffleContract = require("truffle-contract");
const $ = require("jquery");
// Not to forget our built contract
const splitterJson = require("../../build/contracts/Splitter.json");

// Supports Mist, and other wallets that provide 'web3'.
if (typeof web3 !== 'undefined') {
    // Use the Mist/wallet/Metamask provider.
    window.web3 = new Web3(web3.currentProvider);
} else {
    // Your preferred fallback.
    window.web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545')); 
}

Promise.promisifyAll(web3.eth, { suffix: "Promise" });
const Splitter = truffleContract(splitterJson);
Splitter.setProvider(web3.currentProvider);

var alice;
var bob;
var carol;

window.addEventListener('load', function() {
    $("#split").click(split);
    $("#deactivate").click(deactivate);
    
    var splitter;
    return web3.eth.getAccountsPromise()
        .then(accounts => {
            if (accounts.length == 0) {
                $("#aliceBalance").html("N/A");
                $("#bobBalance").html("N/A");
                $("#carolBalance").html("N/A");
                throw new Error("No accounts with which to transact");
            }
            alice = accounts[0];
            bob = accounts[1];
            carol = accounts[2];
            return Splitter.deployed();
        })
        .then(deployed => {
            splitter = deployed;
            $("#aliceBalance").html(web3.fromWei(web3.eth.getBalance(alice).toNumber(), "ether"));
            $("#bobBalance").html(web3.fromWei(web3.eth.getBalance(bob).toNumber(), "ether"));
            $("#carolBalance").html(web3.fromWei(web3.eth.getBalance(carol).toNumber(), "ether"));
            return splitter.active.call();
        }).then(active => {
            console.log("Splitter active: " + active);
            $("#contractActive").html(active);
        }) 
        .catch(console.error);
});

const split = function() {
    let deployed;
    return Splitter.deployed()
        .then(_deployed => {
            deployed = _deployed;
            var amountInEther = $("input[name='amount']").val();
            var amountInWei = web3.toWei(amountInEther, "ether");
            console.log("split " + amountInEther + " Ether start...");
            // .sendTransaction so that we get the txHash immediately.
            $("#status").html("Transaction on the way... ");
            return deployed.split( { from: alice, value: amountInWei } );
        })
        .then(txHash => {
            // Make sure we update the UI.
            $("#aliceBalance").html(web3.fromWei(web3.eth.getBalance(alice).toNumber(), "ether"));
            $("#bobBalance").html(web3.fromWei(web3.eth.getBalance(bob).toNumber(), "ether"));
            $("#carolBalance").html(web3.fromWei(web3.eth.getBalance(carol).toNumber(), "ether"));
            console.log("split finished successful");
            $("#status").html("Transaction completed ");
        })
        .catch(e => {
            $("#status").html(e.toString());
            console.error(e);
        });
};

const deactivate = function() {
    let deployed;
    return Splitter.deployed()
        .then(_deployed => {
            deployed = _deployed;
            // .sendTransaction so that we get the txHash immediately.
            return deployed.deactivate();
        })
        .then(txHash => {
            // Make sure we update the UI.
            console.log("deactivate finished successful");
            return deployed.active.call();
        }).then(active => {
            console.log("Splitter active: " + active);
            $("#contractActive").html(active);
        })
        .catch(e => {
            console.error(e);
        });
};