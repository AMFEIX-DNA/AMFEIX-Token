pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";
import "../node_modules/@opengsn/contracts/src/BaseRelayRecipient.sol";

/**
 * @title AMFEIX ERC20 swap smart contract
 * @dev Contract based on ERC20 standard with "swap" features between BTC and AMF
 */
contract AMF is ERC20, Ownable, BaseRelayRecipient {

    mapping (address => uint256) private _balances;

    uint256 private _swapRatio;
    address private _tokenPool;
    string private _btcPool;
    uint256 private _minimumWithdrawal;

    string public override versionRecipient = "2.2.0";

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor (
        string memory name_, 
        string memory symbol_, 
        address tokenPool_, 
        string memory btcPool_
        ) ERC20(name_,symbol_) Ownable() {
            _swapRatio = 100000; // AMF amount for 1 BTC
            _tokenPool = tokenPool_; // AMFEIX buffer ETH wallet address
            _btcPool = btcPool_; // AMFEIX buffer BTC wallet address
            _minimumWithdrawal = 1000; // AMF minimum amount for withdrawals
    }

    /**
     * @dev Allows contract owner to create new tokens.
     * 
     * @param newHolder Ethereum address of the recipient 
     * @param amount The number of tokens the recipient will receive
     */
    function mint(address newHolder, uint256 amount) public virtual onlyOwner returns (uint256) {
        _mint(newHolder, amount);
        return amount;
    }

    /**
     * @dev Allows anyone to destroy its tokens.
     *
     * @param amount The number of tokens that sender is willing to burn from its account
     */
    function burn(uint256 amount) public virtual returns (bool) {
        _burn(_msgSender(), amount);
        return true;
    }
    /**
     * @dev Returns the current AMF minimum withdrawal amount.
     * 
     * We need this value to prevent users from claiming BTC if the AMF amount is too small.
     * Main reason is the BTC mining fees AMFEIX is going to pay for this transaction
     */
    function getMinimumWithdrawalAmount() public view virtual returns (uint256) {
        return _minimumWithdrawal;
    }

    /**
     * @dev Allows contract owner to update the current AMF minimum withdrawal amount.
     * 
     * @param newMinimum The updated minimum amount of AMF allowed for BTC withdrawal
     */
    function setMinimumWithdrawalAmount(uint256 newMinimum) external virtual onlyOwner returns (bool) {
        _minimumWithdrawal = newMinimum;
        emit MinimumWithdrawalChanged(newMinimum);
        return true;
    }
    // Emitted when AMFEIX changes the current AMF minimum withdrawal amount
    event MinimumWithdrawalChanged (
        uint256 indexed newMinimum
    );

    /**
     * @dev Returns the current swap ratio (how much AMF tokens corresponds to 1 BTC)
     *      
     * Initial ratio  100000 AMF : 1 BTC  (1 AMF : 1000 sat)
     * We need this value to compute the amount of AMF to send to users when they deposited BTC at AMFEIX
     * and to compute the amount of BTC to send to users when they claim back their BTC.
     */
    function getSwapRatio() public view virtual returns (uint256) {
        return _swapRatio;
    }

    /**
     * @dev Allows contract owner to update the current swap ratio (AMF/BTC).
     * 
     * @param newRatio The updated amount of AMF tokens corresponding to 1 BTC (~10^5)
     */
    function setSwapRatio(uint256 newRatio) external virtual onlyOwner returns (bool) {
        _swapRatio = newRatio;
        emit RatioChanged(newRatio);
        return true;
    }
    // Emitted when AMFEIX changes the current swap ratio
    event RatioChanged (
        uint256 indexed newRatio
    );

    /**
     * @dev Returns the current AMF token pool address held by AMFEIX.
     */
    function getTokenPoolAddress() public view virtual returns (address) {
        return _tokenPool;
    }

    /**
     * @dev Allows contract owner to update its current AMF token pool address.
     * 
     * @param newAddress The updated address of the token pool
     */
    function setTokenPoolAddress(address newAddress) external virtual onlyOwner returns (bool) {
        _tokenPool = newAddress;
        emit TokenPoolAddressChanged(newAddress);
        return true;
    }
    // Emitted when AMFEIX changes the current token pool address
    event TokenPoolAddressChanged (
        address indexed newAddress
    );

    /**
     * @dev Returns the current BTC pool address held by AMFEIX.
     */
    function getBtcPoolAddress() public view virtual returns (string memory) {
        return _btcPool;
    }

    /**
     * @dev Allows contract owner to update its current BTC pool address.
     * 
     * @param newAddress The updated address of the BTC pool
     */
    function setBtcPoolAddress(string memory newAddress) external virtual onlyOwner returns (bool) {
        _btcPool = newAddress;
        emit BtcPoolAddressChanged(newAddress);
        return true;
    }
    // Emitted when AMFEIX changes the current BTC pool address
    event BtcPoolAddressChanged (
        string indexed newAddress
    );

    /**
     * @dev Allow any customer who hold tokens to claim BTC
     * 
     * @param tokenAmount Amount of tokens to be exchanged (needs to be multiplied by 10^18)
     * @param userBtcAddress BTC address on which users willing to receive payment
     * /!\ gas cost for calling this method : 37kgas /!\
     */
    function claimBTC(uint256 tokenAmount, string memory userBtcAddress) public virtual returns (bool) {
        require (tokenAmount >= _minimumWithdrawal, "current minimum withrawal is ${_minimumWithdrawal}");
        _transfer(_msgSender(), _tokenPool, tokenAmount);
        emit BtcToBePaid(_msgSender(), userBtcAddress, tokenAmount);
        return true;
    }
    // Emitted when an user claim BTC against its tokens
    event BtcToBePaid (
        address indexed customer,
        string userBtcAddress,
        uint256 sentToken
    );

    /**
     * @dev Allow AMFEIX to transfer AMF to claiming users
     * 
     * @param tokenAmount Amount of tokens to be sent
     * @param userAddress BTC address on which users willing to receive payment
     * @param btcTxId ID of the AMF buying transaction on Bitcoin network
     */
    function payAMF(uint256 tokenAmount, address userAddress, string memory btcTxId) public virtual returns (bool) {
        require(_msgSender() == _tokenPool, "Only AMFEIX can use this method");
        _transfer(_msgSender(), userAddress, tokenAmount);
        emit AmfPaid(userAddress, btcTxId, tokenAmount);
        return true;
    }
    // Emitted when AMFEIX send AMF to users.
    event AmfPaid (
        address indexed customer,
        string btcTxId,
        uint256 sentToken
    );

    // GSN compatibility
    function _msgSender() internal override(Context, BaseRelayRecipient) view returns (address payable) {
        return payable(BaseRelayRecipient._msgSender());
    }
    function _msgData() internal override(Context,BaseRelayRecipient) view returns (bytes memory ret) {
        return BaseRelayRecipient._msgData();
    }
    function setForwarder(address forwarder) public onlyOwner {
        trustedForwarder = forwarder;
    }
}