// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IXPToken {
    function mintRewards(address to, uint256 amount) external;
}

/**
 * @title MiningRewards
 * @dev Distributes mining rewards to users based on their machine hashrates
 * - Admin can register machines and their daily reward rates
 * - Users can claim accumulated rewards
 * - Rewards are minted from XPToken
 */
contract MiningRewards is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // XP Token for minting rewards
    IXPToken public xpToken;

    // Machine registration
    struct Machine {
        address owner;
        uint256 hashrate;
        uint256 dailyReward;       // Daily XP reward in wei
        uint256 registeredAt;
        uint256 lastClaimTime;
        bool isActive;
    }

    // Machine ID => Machine data
    mapping(bytes32 => Machine) public machines;

    // User => Machine IDs
    mapping(address => bytes32[]) public userMachines;

    // Total hashrate in the pool
    uint256 public totalHashrate;

    // Reward accumulator for batch claims
    mapping(address => uint256) public pendingRewards;

    // Authorized distributors (backend servers)
    mapping(address => bool) public authorizedDistributors;

    // Events
    event MachineRegistered(bytes32 indexed machineId, address indexed owner, uint256 hashrate, uint256 dailyReward);
    event MachineDeactivated(bytes32 indexed machineId);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardsDistributed(address indexed user, uint256 amount);
    event DistributorAuthorized(address indexed distributor, bool authorized);

    modifier onlyDistributor() {
        require(authorizedDistributors[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }

    constructor(address _xpToken) Ownable(msg.sender) {
        require(_xpToken != address(0), "Invalid XP token address");
        xpToken = IXPToken(_xpToken);
    }

    /**
     * @dev Authorize a distributor address
     */
    function setDistributor(address distributor, bool authorized) external onlyOwner {
        authorizedDistributors[distributor] = authorized;
        emit DistributorAuthorized(distributor, authorized);
    }

    /**
     * @dev Register a new mining machine
     * @param machineId Unique machine identifier (from backend)
     * @param owner Machine owner address
     * @param hashrate Machine hashrate
     * @param dailyReward Daily XP reward amount
     */
    function registerMachine(
        bytes32 machineId,
        address owner,
        uint256 hashrate,
        uint256 dailyReward
    ) external onlyDistributor {
        require(owner != address(0), "Invalid owner");
        require(hashrate > 0, "Invalid hashrate");
        require(machines[machineId].owner == address(0), "Machine already registered");

        machines[machineId] = Machine({
            owner: owner,
            hashrate: hashrate,
            dailyReward: dailyReward,
            registeredAt: block.timestamp,
            lastClaimTime: block.timestamp,
            isActive: true
        });

        userMachines[owner].push(machineId);
        totalHashrate += hashrate;

        emit MachineRegistered(machineId, owner, hashrate, dailyReward);
    }

    /**
     * @dev Deactivate a machine
     */
    function deactivateMachine(bytes32 machineId) external onlyDistributor {
        Machine storage machine = machines[machineId];
        require(machine.owner != address(0), "Machine not found");
        require(machine.isActive, "Machine already inactive");

        machine.isActive = false;
        totalHashrate -= machine.hashrate;

        emit MachineDeactivated(machineId);
    }

    /**
     * @dev Distribute rewards to a user (called by backend scheduler)
     * @param user User address
     * @param amount Reward amount to distribute
     */
    function distributeRewards(address user, uint256 amount) external onlyDistributor {
        require(user != address(0), "Invalid user");
        require(amount > 0, "Amount must be positive");

        pendingRewards[user] += amount;

        emit RewardsDistributed(user, amount);
    }

    /**
     * @dev Batch distribute rewards to multiple users
     */
    function batchDistributeRewards(
        address[] calldata users,
        uint256[] calldata amounts
    ) external onlyDistributor {
        require(users.length == amounts.length, "Length mismatch");

        for (uint256 i = 0; i < users.length; i++) {
            if (users[i] != address(0) && amounts[i] > 0) {
                pendingRewards[users[i]] += amounts[i];
                emit RewardsDistributed(users[i], amounts[i]);
            }
        }
    }

    /**
     * @dev Claim accumulated rewards
     */
    function claimRewards() external nonReentrant {
        uint256 amount = pendingRewards[msg.sender];
        require(amount > 0, "No pending rewards");

        pendingRewards[msg.sender] = 0;

        // Mint XP tokens to user
        xpToken.mintRewards(msg.sender, amount);

        emit RewardsClaimed(msg.sender, amount);
    }

    /**
     * @dev Calculate pending rewards for all active machines of a user
     */
    function calculatePendingRewards(address user) external view returns (uint256) {
        bytes32[] memory userMachineIds = userMachines[user];
        uint256 totalPending = pendingRewards[user];

        for (uint256 i = 0; i < userMachineIds.length; i++) {
            Machine memory machine = machines[userMachineIds[i]];
            if (machine.isActive) {
                uint256 timeElapsed = block.timestamp - machine.lastClaimTime;
                uint256 accruedReward = (machine.dailyReward * timeElapsed) / 1 days;
                totalPending += accruedReward;
            }
        }

        return totalPending;
    }

    /**
     * @dev Get all machine IDs for a user
     */
    function getUserMachines(address user) external view returns (bytes32[] memory) {
        return userMachines[user];
    }

    /**
     * @dev Get machine details
     */
    function getMachine(bytes32 machineId) external view returns (
        address owner,
        uint256 hashrate,
        uint256 dailyReward,
        uint256 registeredAt,
        uint256 lastClaimTime,
        bool isActive
    ) {
        Machine memory m = machines[machineId];
        return (m.owner, m.hashrate, m.dailyReward, m.registeredAt, m.lastClaimTime, m.isActive);
    }
}
