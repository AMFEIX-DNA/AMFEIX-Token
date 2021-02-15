AMFeix Solidity
=================================================


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
