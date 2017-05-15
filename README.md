# ethereum
Ethereum projects

After clone/download from this code, install pakages:  

    npm install web3 truffle-contract bluebird jquery --save
    npm install webpack --save-dev
    npm install file-loader --save-dev

Run testrpc in other terminal tab/window:  
```testrpc```  
  
Deploy smart contract into testrpc:  
```truffle migrate --reset```  
  
Build WebApp:  
```./node_modules/.bin/webpack```
  
Run PHP http server:  
```php -S 0.0.0.0:8000 -t ./build/app```