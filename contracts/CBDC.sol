// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// Importing ERC20 from OpenZeppelin contracts
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title CBDC
 * @author Cristian Richarte Gil
 * @dev Implementation of the CBDC
 */
contract CBDC is ERC20 {
    // Address of the Federal Reserve
    address public FED;
    // Current interest rates
    uint256 public interestRates;

    // Mapping to keep track of blacklisted addresses
    mapping(address => uint8) blackList;
    // Mapping to keep track of staked Treasury Bonds
    mapping(address => uint256) stakedTreasuryBonds;
    // Mapping to keep track of bonds
    mapping(address => uint256) bonds;
    // Mapping to keep track of staked timestamps
    mapping(address => uint256) stakedTimeStamp;

    /**
     * @dev Emitted when the blacklist is updated
     */
    event BlackListUpdated(address indexed criminal, uint8 decision);
    /**
     * @dev Emitted when the FED address is updated
     */
    event FEDUpdated(address indexed oldFED, address indexed newFED);
    /**
     * @dev Emitted when the supply is increased
     */
    event supplyIncreased(address indexed FED, uint256 oldSupply, uint256 totalSupply);
    /**
     * @dev Emitted when the supply is decreased
     */
    event supplyDecreased(address indexed FED, uint256 oldSupply, uint256 totalSupply);
    /**
     * @dev Emitted when DUSD is staked
     */
    event DUSDStaked(address indexed staker, uint256 amount, uint256 stakedTime);
    /**
     * @dev Emitted when DUSD is unstaked
     */
    event DUSDUnstaked(address indexed staker, uint256 amount, uint256 unStakedTime);
    /**
     * @dev Emitted when interest rates are updated
     */
    event InterestRatesUpdated(
        uint256 oldInterestRates,
        uint256 newInterestRates
    );
    /**
     * @dev Emitted when interest is claimed
     */
    event interestClaimed(
        address indexed staker,
        uint256 reward,
        uint256 newTotalSupply
    );

    /**
     * @dev Throws if called by any account other than the FED.
     */
    modifier onlyFED() {
        require(msg.sender == FED, "You aren't the FED");
        _;
    }

    /**
     * @dev Sets the values for {name} and {symbol}, initializes {decimals} with a value of 8.
     * All three of these values are immutable: they can only be set once during construction.
     * @param _name The name of the token
     * @param _symbol The symbol of the token
     * @param _amount The initial supply of the token
     */
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _amount
    ) ERC20(_name, _symbol) {
        FED = msg.sender;
        _mint(msg.sender, _amount);
    }

    /**
     * @dev Moves tokens `amount` from `sender` to `recipient`.
     * Returns a boolean value indicating whether the operation succeeded.
     * Emits a {Transfer} event.
     * @param _from The address to transfer from
     * @param _to The address to transfer to
     * @param _amount The amount to transfer
     * @return A boolean value indicating whether the operation succeeded
     */
    function transferFrom(
        address _from,
        address _to,
        uint256 _amount
    ) public virtual override returns (bool) {
        require(blackList[msg.sender] != 1, "From is Black List");
        require(blackList[_to] != 1, "To is Black List");

        super.transferFrom(_from, _to, _amount);
        return true;
    }

    /**
     * @dev Add or remove addresses to the blacklist.
     * @param _criminal The address to add or remove from the blacklist
     * @param _decision The decision to add (1) or remove (0) the address from the blacklist
     */
    function manageBlackList(
        address _criminal,
        uint8 _decision
    ) external onlyFED {
        require(_decision <= 1, "Invalid decision");

        blackList[_criminal] = _decision;
        emit BlackListUpdated(_criminal, _decision);
    }

    /**
     * @dev Update the FED address.
     * @param _newFed The new FED address
     */
    function updateFED(address _newFed) external onlyFED {
        require(_newFed != address(0));
        address oldFed = FED;
        FED = _newFed;
        emit FEDUpdated(oldFed, _newFed);
    }

    /**
     * @dev Print/mint more DUSD supply.
     * @param _amount The amount of DUSD to print/mint
     */
    function printMoney(uint256 _amount) external onlyFED {
        uint256 oldSupply = totalSupply();
        _mint(msg.sender, _amount);
        emit supplyIncreased(msg.sender, oldSupply, totalSupply());
    }

    /**
     * @dev Decrease the total DUSD supply.
     * @param _amount The amount of DUSD to burn
     */
    function burnMoney(uint256 _amount) external onlyFED {
        uint256 oldSupply = totalSupply();
        _burn(msg.sender, _amount);
        emit supplyDecreased(msg.sender, oldSupply, totalSupply());
    }

    /**
     * @dev Stake DUSD and earn interest (Treasury bonds).
     * @param _amount The amount of DUSD to stake
     */
    function stakeDUSD(uint256 _amount) external {
        require(_amount > 0, "0 is not valid");
        require(balanceOf(msg.sender) >= _amount, "Not enough funds");

        if (stakedTreasuryBonds[msg.sender] > 0) claimInterest(); // Claim before staking more
        stakedTimeStamp[msg.sender] = block.timestamp;
        stakedTreasuryBonds[msg.sender] += _amount;
        _transfer(msg.sender, address(this), _amount);
        emit DUSDStaked(msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Unstake DUSD and claim rewards (Treasury bonds).
     * @param _amount The amount of DUSD to unstake
     */
    function unstakeDUSD(uint256 _amount) external {
        require(_amount > 0, "0 is not valid");
        require(
            stakedTreasuryBonds[msg.sender] >= _amount,
            "Not enough funds staked"
        );

        claimInterest();
        stakedTreasuryBonds[msg.sender] -= _amount;
        _transfer(address(this), msg.sender, _amount);
        emit DUSDUnstaked(msg.sender, _amount, block.timestamp);
    }

    /**
     * @dev Claim the rewards (Treasury bonds).
     */
    function claimInterest() public {
        require(stakedTreasuryBonds[msg.sender] > 0, "Not enough funds staked");
        uint256 DUSDstaked = stakedTreasuryBonds[msg.sender];
        uint256 secondsStaked = block.timestamp - stakedTimeStamp[msg.sender];
        uint256 reward = (DUSDstaked * secondsStaked * interestRates) /
            (1000 * 3.154e7); //1000 * 3.154e7 => Seconds in a year.

        stakedTimeStamp[msg.sender] = block.timestamp; // Reset the staked time stamp to now.
        _mint(msg.sender, reward);
        emit interestClaimed(msg.sender, reward, totalSupply());
    }

    /**
     * @dev Update the interests rate points for staking (Treasury bonds).
     * @param _interest The new interest rate
     */
    function updateInterestRates(uint256 _interest) external onlyFED {
        uint256 oldInterestRates = interestRates;
        interestRates = _interest;
        emit InterestRatesUpdated(oldInterestRates, _interest);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation.
     * For example, if `decimals` equals `2`, a balance of `505` tokens should
     * be displayed to a user as `5,05` (`505 / 10 ** 2`).
     * Tokens usually opt for a value of 18, imitating the relationship between
     * Ether and Wei. This token opts for 8, imitating the relationship between
     * Bitcoin and Satoshi.
     * @return The number of decimals used to get its user representation
     */
    function decimals() public pure override returns (uint8) {
        return 8;
    }
}
