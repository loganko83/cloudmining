// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title XPxToken
 * @dev Interest-bearing token representing supplied XP in the lending pool
 * Similar to Aave's aToken design
 * - Minted when users supply XP to the pool
 * - Burned when users withdraw XP from the pool
 * - Balance automatically increases as interest accrues
 */
contract XPxToken is ERC20, ERC20Burnable, Ownable, ReentrancyGuard {
    // The lending pool contract that controls minting/burning
    address public lendingPool;

    // Underlying asset (XP Token)
    address public underlyingAsset;

    // Index for calculating scaled balances (RAY = 10^27)
    uint256 public constant RAY = 10**27;
    uint256 public liquidityIndex = RAY;

    // User scaled balances (balance / liquidityIndex at deposit time)
    mapping(address => uint256) private _scaledBalances;
    uint256 private _totalScaledSupply;

    // Events
    event Mint(address indexed user, uint256 amount, uint256 index);
    event Burn(address indexed user, uint256 amount, uint256 index);
    event LiquidityIndexUpdated(uint256 newIndex);

    modifier onlyLendingPool() {
        require(msg.sender == lendingPool, "Only lending pool");
        _;
    }

    constructor(address _underlyingAsset)
        ERC20("Xphere Interest Bearing Token", "XPx")
        Ownable(msg.sender)
    {
        require(_underlyingAsset != address(0), "Invalid underlying asset");
        underlyingAsset = _underlyingAsset;
    }

    /**
     * @dev Set the lending pool address (can only be set once)
     */
    function setLendingPool(address _lendingPool) external onlyOwner {
        require(lendingPool == address(0), "Lending pool already set");
        require(_lendingPool != address(0), "Invalid lending pool address");
        lendingPool = _lendingPool;
    }

    /**
     * @dev Mint XPx tokens when user supplies XP
     * @param user User address
     * @param amount Amount of XP supplied
     * @param index Current liquidity index
     */
    function mint(address user, uint256 amount, uint256 index) external onlyLendingPool nonReentrant {
        require(amount > 0, "Amount must be greater than 0");

        uint256 scaledAmount = (amount * RAY) / index;
        _scaledBalances[user] += scaledAmount;
        _totalScaledSupply += scaledAmount;

        emit Mint(user, amount, index);
    }

    /**
     * @dev Burn XPx tokens when user withdraws XP
     * @param user User address
     * @param amount Amount of XP to withdraw
     * @param index Current liquidity index
     */
    function burn(address user, uint256 amount, uint256 index) external onlyLendingPool nonReentrant {
        uint256 scaledAmount = (amount * RAY) / index;
        require(_scaledBalances[user] >= scaledAmount, "Insufficient balance");

        _scaledBalances[user] -= scaledAmount;
        _totalScaledSupply -= scaledAmount;

        emit Burn(user, amount, index);
    }

    /**
     * @dev Update the liquidity index
     * @param newIndex New liquidity index value
     */
    function updateLiquidityIndex(uint256 newIndex) external onlyLendingPool {
        require(newIndex >= liquidityIndex, "Index can only increase");
        liquidityIndex = newIndex;
        emit LiquidityIndexUpdated(newIndex);
    }

    /**
     * @dev Returns the scaled balance of user (balance at index RAY)
     */
    function scaledBalanceOf(address user) external view returns (uint256) {
        return _scaledBalances[user];
    }

    /**
     * @dev Returns the total scaled supply
     */
    function scaledTotalSupply() external view returns (uint256) {
        return _totalScaledSupply;
    }

    /**
     * @dev Override balanceOf to return interest-bearing balance
     */
    function balanceOf(address account) public view virtual override returns (uint256) {
        return (_scaledBalances[account] * liquidityIndex) / RAY;
    }

    /**
     * @dev Override totalSupply to return interest-bearing total
     */
    function totalSupply() public view virtual override returns (uint256) {
        return (_totalScaledSupply * liquidityIndex) / RAY;
    }

    /**
     * @dev Transfer is disabled for XPx tokens
     * Users must withdraw from lending pool to transfer XP
     */
    function transfer(address, uint256) public pure override returns (bool) {
        revert("XPx: transfers disabled");
    }

    function transferFrom(address, address, uint256) public pure override returns (bool) {
        revert("XPx: transfers disabled");
    }
}
