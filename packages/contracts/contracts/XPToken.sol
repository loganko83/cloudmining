// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title XPToken
 * @dev XP Token for Xphere Mining Cloud Platform
 * - ERC-20 compliant
 * - Maximum supply: 1 billion tokens
 * - Burnable
 * - Permit support for gasless approvals
 */
contract XPToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18; // 1 billion tokens

    // Mining reward controller
    address public miningRewardsController;

    // Events
    event MiningRewardsControllerUpdated(address indexed previousController, address indexed newController);
    event TokensMinted(address indexed to, uint256 amount);

    constructor()
        ERC20("Xphere Token", "XP")
        ERC20Permit("Xphere Token")
        Ownable(msg.sender)
    {
        // Initial mint to deployer (for liquidity and distribution)
        _mint(msg.sender, 100_000_000 * 10**18); // 100 million initial supply
    }

    /**
     * @dev Set the mining rewards controller address
     * @param _controller Address of the mining rewards contract
     */
    function setMiningRewardsController(address _controller) external onlyOwner {
        require(_controller != address(0), "Invalid controller address");
        address previousController = miningRewardsController;
        miningRewardsController = _controller;
        emit MiningRewardsControllerUpdated(previousController, _controller);
    }

    /**
     * @dev Mint new tokens for mining rewards
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mintRewards(address to, uint256 amount) external {
        require(msg.sender == miningRewardsController, "Only mining rewards controller");
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Owner can mint tokens up to max supply
     * @param to Recipient address
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }

    /**
     * @dev Returns the remaining mintable supply
     */
    function remainingMintableSupply() external view returns (uint256) {
        return MAX_SUPPLY - totalSupply();
    }
}
