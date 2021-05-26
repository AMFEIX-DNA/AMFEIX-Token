AMFEIX Solidity
=================================================

## Contract address on Ethereum mainnet 
0xeeA128Fc13004e7c48EDA8bebD35a393bB7dcc3A  
https://etherscan.io/token/0xeea128fc13004e7c48eda8bebd35a393bb7dcc3a


## Testing

```
npm run test
```

## Flattening 
works with node10

```
npm i -f truffle-flattener
truffle-flattener contracts/AMF.sol > flat.txt
```

Remove every occurence of `// SPDX-...`

```
Optimization: yes
Runs: 0
```

## Deploying on Ropsten

Before deploying, needs to fill credentials in the file `auth.json`

```
truffle deploy --network ropsten
```

## Explicit list of contract methods

See the `methods.md` file.
