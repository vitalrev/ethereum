var ConvertLib = artifacts.require("./ConvertLib.sol");
var Splitter = artifacts.require("./Splitter.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(ConvertLib);
//  deployer.link(ConvertLib, Splitter);
  deployer.deploy(Splitter, accounts[1], accounts[2]);
};
