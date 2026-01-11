// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MachinePayment
 * @dev Handles USDT payments for mining machine purchases
 * - Accepts USDT payments for machine plans
 * - Emits events for backend to process machine activation
 * - Supports multiple payment tokens
 */
contract MachinePayment is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // Payment tokens (USDT, USDC, etc.)
    mapping(address => bool) public acceptedTokens;

    // Treasury address for receiving payments
    address public treasury;

    // Machine plan prices (planId => token => price)
    mapping(bytes32 => mapping(address => uint256)) public planPrices;

    // Plan metadata
    struct MachinePlan {
        string name;
        uint256 hashrate;
        uint256 dailyRewardXP;  // in wei
        bool isActive;
    }

    mapping(bytes32 => MachinePlan) public plans;
    bytes32[] public planIds;

    // Purchase records
    struct Purchase {
        address buyer;
        bytes32 planId;
        address paymentToken;
        uint256 amount;
        uint256 timestamp;
        bool processed;
    }

    mapping(bytes32 => Purchase) public purchases;

    // Events
    event TokenAccepted(address indexed token, bool accepted);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);
    event PlanCreated(bytes32 indexed planId, string name, uint256 hashrate, uint256 dailyRewardXP);
    event PlanPriceSet(bytes32 indexed planId, address indexed token, uint256 price);
    event PlanDeactivated(bytes32 indexed planId);
    event MachinePurchased(
        bytes32 indexed purchaseId,
        address indexed buyer,
        bytes32 indexed planId,
        address paymentToken,
        uint256 amount
    );
    event PurchaseProcessed(bytes32 indexed purchaseId);

    constructor(address _treasury) Ownable(msg.sender) {
        require(_treasury != address(0), "Invalid treasury");
        treasury = _treasury;
    }

    /**
     * @dev Set accepted payment token
     */
    function setAcceptedToken(address token, bool accepted) external onlyOwner {
        require(token != address(0), "Invalid token");
        acceptedTokens[token] = accepted;
        emit TokenAccepted(token, accepted);
    }

    /**
     * @dev Update treasury address
     */
    function setTreasury(address _treasury) external onlyOwner {
        require(_treasury != address(0), "Invalid treasury");
        address oldTreasury = treasury;
        treasury = _treasury;
        emit TreasuryUpdated(oldTreasury, _treasury);
    }

    /**
     * @dev Create a new machine plan
     */
    function createPlan(
        bytes32 planId,
        string calldata name,
        uint256 hashrate,
        uint256 dailyRewardXP
    ) external onlyOwner {
        require(plans[planId].hashrate == 0, "Plan already exists");
        require(hashrate > 0, "Invalid hashrate");

        plans[planId] = MachinePlan({
            name: name,
            hashrate: hashrate,
            dailyRewardXP: dailyRewardXP,
            isActive: true
        });

        planIds.push(planId);

        emit PlanCreated(planId, name, hashrate, dailyRewardXP);
    }

    /**
     * @dev Set price for a plan in a specific token
     */
    function setPlanPrice(bytes32 planId, address token, uint256 price) external onlyOwner {
        require(plans[planId].hashrate > 0, "Plan does not exist");
        require(acceptedTokens[token], "Token not accepted");
        require(price > 0, "Invalid price");

        planPrices[planId][token] = price;

        emit PlanPriceSet(planId, token, price);
    }

    /**
     * @dev Deactivate a plan
     */
    function deactivatePlan(bytes32 planId) external onlyOwner {
        require(plans[planId].hashrate > 0, "Plan does not exist");
        plans[planId].isActive = false;
        emit PlanDeactivated(planId);
    }

    /**
     * @dev Purchase a mining machine with payment token
     * @param planId Plan to purchase
     * @param paymentToken Token to pay with
     */
    function purchaseMachine(bytes32 planId, address paymentToken) external nonReentrant returns (bytes32) {
        MachinePlan memory plan = plans[planId];
        require(plan.isActive, "Plan not active");
        require(acceptedTokens[paymentToken], "Token not accepted");

        uint256 price = planPrices[planId][paymentToken];
        require(price > 0, "Price not set for this token");

        // Generate unique purchase ID
        bytes32 purchaseId = keccak256(abi.encodePacked(
            msg.sender,
            planId,
            block.timestamp,
            block.prevrandao
        ));

        // Transfer payment to treasury
        IERC20(paymentToken).safeTransferFrom(msg.sender, treasury, price);

        // Record purchase
        purchases[purchaseId] = Purchase({
            buyer: msg.sender,
            planId: planId,
            paymentToken: paymentToken,
            amount: price,
            timestamp: block.timestamp,
            processed: false
        });

        emit MachinePurchased(purchaseId, msg.sender, planId, paymentToken, price);

        return purchaseId;
    }

    /**
     * @dev Mark purchase as processed (called by backend)
     */
    function markPurchaseProcessed(bytes32 purchaseId) external onlyOwner {
        Purchase storage purchase = purchases[purchaseId];
        require(purchase.buyer != address(0), "Purchase not found");
        require(!purchase.processed, "Already processed");

        purchase.processed = true;

        emit PurchaseProcessed(purchaseId);
    }

    /**
     * @dev Get all plan IDs
     */
    function getAllPlanIds() external view returns (bytes32[] memory) {
        return planIds;
    }

    /**
     * @dev Get plan details with price
     */
    function getPlanWithPrice(bytes32 planId, address token) external view returns (
        string memory name,
        uint256 hashrate,
        uint256 dailyRewardXP,
        bool isActive,
        uint256 price
    ) {
        MachinePlan memory plan = plans[planId];
        return (
            plan.name,
            plan.hashrate,
            plan.dailyRewardXP,
            plan.isActive,
            planPrices[planId][token]
        );
    }

    /**
     * @dev Emergency withdraw stuck tokens
     */
    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransfer(owner(), amount);
    }

    /**
     * @dev Receive XP native token (for potential XP payments)
     */
    receive() external payable {}

    /**
     * @dev Withdraw native token
     */
    function withdrawNative(uint256 amount) external onlyOwner {
        payable(owner()).transfer(amount);
    }
}
