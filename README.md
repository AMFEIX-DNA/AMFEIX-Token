AMFEIX Solidity
=================================================

## Contract address on Ethereum mainnet 
0x7Bc2B0367DC5b18aA126b68ee4352A5E5044506e  
https://etherscan.io/address/0x7Bc2B0367DC5b18aA126b68ee4352A5E5044506e


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
