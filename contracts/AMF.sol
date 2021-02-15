pragma solidity >=0.7.0 <0.8.0;

import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title AMFEIX ERC20 swap smart contract
 * @dev Contract based on ERC20 standard with "swap" features between BTC and AMF
 */
contract AMF is ERC20, Ownable {

    using SafeMath for uint256;

    mapping (address => uint256) private _balances;

    uint256 private _BtcToAmfRatio;

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with
     * a default value of 18.
     *
     * All three of these values are immutable: they can only be set once during
     * construction.
     */
    constructor (string memory name_, string memory symbol_) ERC20(name_,symbol_) Ownable() {
        _BtcToAmfRatio = 100000; // AMF amount for 1 BTC
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
     * @dev Returns the current swap ratio (how much AMF tokens corresponds to 1 BTC)
     *      
     * Initial ratio  100000 AMF : 1 BTC  (1 AMF : 1000 sat)
     * We need this value to compute the amount of AMF to send to users when they deposited BTC at AMFEIX
     * and to compute the amount of BTC to send to users when they claim back their BTC.
     */
    function getBtcToAmfRatio() public view virtual returns (uint256) {
        return _BtcToAmfRatio;
    }

    /**
     * @dev Allows contract owner to update the current swap ratio (AMF/BTC).
     * 
     * @param newRatio The updated amount of AMF tokens corresponding to 1 BTC (~10^5)
     */
    function setBtcToAmfRatio(uint256 newRatio) external virtual onlyOwner returns (bool) {
        _BtcToAmfRatio = newRatio;
        return true;
    }

    /**
     * @dev Allows contract owner to notify the network that a user who deposited 
     *      BTC at AMFEIX has it ETH wallet funded with the equivalent amount of tokens
     *
     * @param btcTxId Transaction ID of the BTC deposit
     * @param userEthAddress Ethereum address previously provided by user through an OP_RETURN on bitcoin
     * @param tokenAmount Amount of token to deliver to user
     */
    function tokenDelivery(bytes32 btcTxId, address userEthAddress, uint256 tokenAmount) public virtual onlyOwner returns (bool) {
        _transfer(_msgSender(), userEthAddress, tokenAmount);
        emit PaidToken(btcTxId, userEthAddress, tokenAmount, _BtcToAmfRatio);
        return true;
    }
    // Emitted when AMFEIX tells the network that a specific token claiming/purchase has been processed
    event PaidToken (
        bytes32 indexed btcTxId,
        address indexed userEthAddress,
        uint256 tokenAmount,
        uint256 btcToAmfRatio
    );

    /**
     * @dev Allow any customer who hold tokens to claim BTC
     * 
     * @param tokenAmount Amount of tokens to be exchanged (needs to be multiplied by 10^18)
     * @param userBtcAddress BTC address on which users willing to receive payment
     * /!\ gas cost for calling this method : 37kgas /!\
     */
    function claimBTC(uint256 tokenAmount, string memory userBtcAddress) public virtual returns (bool) {
        _transfer(_msgSender(), owner(), tokenAmount);
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
     * @dev Allows contract owner to notify the network that BTC has been paid to claiming user
     * 
     * @param ethTxId Transaction ID of the token transfer from user to AMFEIX pool
     * @param customer Ethereum address of the claiming user
     * @param btcAmount Amount of BTC paid to claiming user
     */    
    function btcDelivery(bytes32 ethTxId, address customer, uint256 btcAmount) public virtual onlyOwner returns (bool) {
        // AMFEIX needs to check wether an event has already been emitted for this claim
        emit PaidBTC(ethTxId, customer, btcAmount, _BtcToAmfRatio);
        return true;
    }
    // Emitted when AMFEIX actually paid BTC 
    event PaidBTC (
        bytes32 indexed ethTxId,
        address customer,
        uint256 btcAmount,
        uint256 btcToAmfRatio
    );    

}