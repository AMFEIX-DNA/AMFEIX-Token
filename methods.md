# Contract methods

### Context

Provides information about the current execution context, including the  
sender of the transaction and its data. While these are generally available  
via msg.sender and msg.data, they should not be accessed in such a direct  
manner, since when dealing with GSN meta-transactions the account sending and  
paying for execution may not be the actual sender (as far as an application  
is concerned).  

```
function _msgSender() internal view virtual returns (address)
```

```
function _msgData() internal view virtual returns (bytes calldata)
```

### Ownable

Contract module which provides a basic access control mechanism, where  
there is an account (an owner) that can be granted exclusive access to  
specific functions.  
By default, the owner account will be the one that deploys the contract. This  
can later be changed with {transferOwnership}.  
This module is used through inheritance. It will make available the modifier  
`onlyOwner`, which can be applied to your functions to restrict their use to  
the owner.  

Returns the address of the current owner.  
```
function owner() public view virtual returns (address)
```

Leaves the contract without owner. It will not be possible to call  
`onlyOwner` functions anymore. Can only be called by the current owner.  
NOTE: Renouncing ownership will leave the contract without an owner,  
thereby removing any functionality that is only available to the owner.  
```
function renounceOwnership() public virtual onlyOwner
```

Transfers ownership of the contract to a new account (`newOwner`).  
Can only be called by the current owner.  
```
function transferOwnership(address newOwner) public virtual onlyOwner
```
```
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
```

Throws if called by any account other than the owner.  
```
modifier onlyOwner()
```

### ERC20
Interface of the ERC20 standard as defined in the EIP.  

Returns the amount of tokens in existence.
```
function totalSupply() external view returns (uint256)
```

Returns the amount of tokens owned by `account`.  
```
function balanceOf(address account) external view returns (uint256)
```

Moves `amount` tokens from the caller's account to `recipient`.  
Returns a boolean value indicating whether the operation succeeded.  
Emits a {Transfer} event.  
```
function transfer(address recipient, uint256 amount) external returns (bool)
```
```
event Transfer(address indexed from, address indexed to, uint256 value)
```

Returns the remaining number of tokens that `spender` will be  
allowed to spend on behalf of `owner` through {transferFrom}. This is  
zero by default.  
This value changes when {approve} or {transferFrom} are called.  
```
function allowance(address owner, address spender) external view returns (uint256)
```

Sets `amount` as the allowance of `spender` over the caller's tokens.  
Returns a boolean value indicating whether the operation succeeded.  
IMPORTANT: Beware that changing an allowance with this method brings the risk  
that someone may use both the old and the new allowance by unfortunate  
transaction ordering. One possible solution to mitigate this race  
condition is to first reduce the spender's allowance to 0 and set the  
desired value afterwards: https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729  
Emits an {Approval} event.  
```
function approve(address spender, uint256 amount) external returns (bool)
```

Moves `amount` tokens from `sender` to `recipient` using the  
allowance mechanism. `amount` is then deducted from the caller's  
allowance.  
Returns a boolean value indicating whether the operation succeeded. 
Emits a {Transfer} event.   
```
function transferFrom(address sender, address recipient, uint256 amount) external returns (bool)
```
```
event Transfer(address indexed from, address indexed to, uint256 value)
```

### AMF
Set of functions for the purpose of "swap" features between AMF tokens and BTC.  

Allows contract owner to create an `amount` of new tokens for the `newHolder`.  
Emits a {Transfer} event from zero address.  
```
function mint(address newHolder, uint256 amount) public virtual onlyOwner returns (uint256)
```

Allows anyone to destroy a specific `amount` of its token balance.  
Emits a {Transfer} event to zero address.  
```
function burn(uint256 amount) public virtual returns (bool)
```

Returns the current swap ratio (how much AMF tokens corresponds to 1 BTC).  
Initial ratio  100000 AMF : 1 BTC  (1 AMF : 1000 sat).  
We need this value to compute the amount of AMF to send to users when they deposited BTC at  
AMFEIX and to compute the amount of BTC to send to users when they claim back their BTC.  
```
function getSwapRatio() public view virtual returns (uint256)
```

Allows contract owner to update the current swap ratio (AMF/BTC) to `newRatio`.  
```
function setSwapRatio(uint256 newRatio) external virtual onlyOwner returns (bool)
```

Allows contract owner to notify the network that a `userEthAddress` who deposited BTC at  
AMFEIX with `btcTxId` has it ETH wallet funded with the equivalent `tokenmount`.  
Emits a {PaidToken} event. 
```
function tokenDelivery(bytes32 btcTxId, address userEthAddress, uint256 tokenAmount) public virtual onlyOwner returns (bool)
```
```
event PaidToken (bytes32 indexed btcTxId, address indexed userEthAddress, uint256 tokenAmount, uint256 btcToAmfRatio)
```

Allow any customer who hold `tokenAmount` to claim BTC to its `userBtcAddress`.  
Emits a {BtcToBePaid} event.
/!\ gas cost for calling this method : ~37kgas /!\  
```
function claimBTC(uint256 tokenAmount, string memory userBtcAddress) public virtual returns (bool)
```
```
event BtcToBePaid (address indexed customer, string userBtcAddress, uint256 sentToken)
```
