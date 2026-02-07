// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title HungryGhostsStaking
 * @notice Skeleton for GHO staking + GHST deposits (1:1) to earn epoch-based rewards.
 * @dev Based on proposition: estimate/adjust pattern. See Hungry Ghosts staking contract proposition.
 * Reference: Scalable Reward Distribution (accumulator pattern)
 */
interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

contract HungryGhostsStaking {
    struct RewardsPeriod {
        uint256 start;
        uint256 end;
    }

    struct RewardsToken {
        address token;
        uint256 totalRewards;
        uint256 rewardsPerEpoch;
    }

    struct RewardsPerToken {
        uint256 accumulated;
        uint256 lastUpdated;
        uint256 rate;
    }

    struct GotchiRewards {
        uint256 accumulated;
        uint256 checkpoint;
        uint256 accumulatedRewards;
    }

    RewardsPeriod public rewardsPeriod;
    RewardsPerToken public rewardsPerToken;
    RewardsToken[] public rewardsToken;
    mapping(uint256 => GotchiRewards) public rewards;

    IERC20 public immutable stakingToken;      // GHO
    IERC20 public immutable depositReceiptToken; // Aave aToken for GHO
    IERC20 public immutable bellySizeToken;    // GHST
    IERC20 public immutable rewardToken;       // GHST

    uint256 public estimatedEpochRewards;
    uint256 public totalStaked;
    uint256 public totalBellyStored;
    uint256 public totalRewards;
    uint256 public epochRewards;

    mapping(uint256 => uint256) public gotchiStaked;
    mapping(uint256 => uint256) public gotchiBellyStored;
    uint256[] public gotchiBelly;
    mapping(uint256 => uint256) public gotchiBellyIndex;

    address public admin;

    event Staked(uint256 indexed gotchiId, uint256 amount);
    event BellyDeposit(uint256 indexed gotchiId, uint256 amount);
    event Unstaked(uint256 indexed gotchiId, uint256 amount);
    event BellyWithdrawal(uint256 indexed gotchiId, uint256 amount);
    event Claimed(uint256 indexed gotchiId, uint256 amount);
    event RewardsPerTokenUpdated(uint256 accumulated);
    event UserRewardsUpdated(uint256 gotchiId, uint256 rewards, uint256 checkpoint);

    error Unauthorized();
    error ZeroAmount();
    error InvalidGotchiId();

    constructor(
        address _stakingToken,
        address _depositReceiptToken,
        address _bellySizeToken,
        address _rewardToken
    ) {
        stakingToken = IERC20(_stakingToken);
        depositReceiptToken = IERC20(_depositReceiptToken);
        bellySizeToken = IERC20(_bellySizeToken);
        rewardToken = IERC20(_rewardToken);
        admin = msg.sender;
        // Initialization done via init() to avoid stack too deep
    }

    function init(
        uint256 _estimatedEpochRewards,
        uint256 _rewardsPerEpoch,
        address _rewardTokenAddress
    ) external {
        require(msg.sender == admin, "Unauthorized");
        require(rewardsToken.length == 0, "Already initialized");
        totalStaked = 0;
        totalBellyStored = 0;
        estimatedEpochRewards = _estimatedEpochRewards;
        rewardsToken.push(RewardsToken({
            token: _rewardTokenAddress,
            totalRewards: 100_000 * 1e18, // 100k GHST
            rewardsPerEpoch: _rewardsPerEpoch
        }));
        rewardsPeriod = RewardsPeriod({
            start: block.timestamp,
            end: block.timestamp + 7 days
        });
        rewardsPerToken = RewardsPerToken({
            accumulated: 0,
            lastUpdated: block.timestamp,
            rate: _estimatedEpochRewards / 7 days
        });
    }

    /// @notice Stake GHO for gotchiId (skeleton - requires Aave integration)
    function stake(uint256 gotchiId, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        // TODO: Transfer GHO from user, deposit in Aave
        gotchiStaked[gotchiId] += amount;
        totalStaked += amount;
        emit Staked(gotchiId, amount);
    }

    /// @notice Deposit GHST (belly) for gotchiId
    function deposit(uint256 gotchiId, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        // TODO: Update rewardsPerToken, rewards[gotchiId], add to gotchiBelly
        bellySizeToken.transferFrom(msg.sender, address(this), amount);
        gotchiBellyStored[gotchiId] += amount;
        totalBellyStored += amount;
        emit BellyDeposit(gotchiId, amount);
    }

    /// @notice Withdraw GHST for gotchiId
    function withdraw(uint256 gotchiId) external {
        uint256 amount = gotchiBellyStored[gotchiId];
        if (amount == 0) revert ZeroAmount();
        gotchiBellyStored[gotchiId] = 0;
        totalBellyStored -= amount;
        bellySizeToken.transfer(msg.sender, amount);
        emit BellyWithdrawal(gotchiId, amount);
    }

    /// @notice Unstake GHO for gotchiId (skeleton)
    function unstake(uint256 gotchiId, uint256 amount) external {
        if (amount == 0) revert ZeroAmount();
        require(gotchiStaked[gotchiId] >= amount, "Insufficient staked");
        gotchiStaked[gotchiId] -= amount;
        totalStaked -= amount;
        // TODO: Withdraw from Aave, transfer GHO to owner
        emit Unstaked(gotchiId, amount);
    }

    /// @notice Claim rewards for gotchiId
    function claim(uint256 gotchiId) external {
        uint256 amount = rewards[gotchiId].accumulatedRewards;
        if (amount == 0) revert ZeroAmount();
        rewards[gotchiId].accumulatedRewards = 0;
        totalRewards -= amount;
        rewardToken.transfer(msg.sender, amount);
        emit Claimed(gotchiId, amount);
    }

    /// @notice View: share of gotchi in total belly (basis points)
    function getGotchiShare(uint256 gotchiId) external view returns (uint256) {
        if (totalBellyStored == 0) return 0;
        uint256 gotchiBellyAmount = gotchiBellyStored[gotchiId] < gotchiStaked[gotchiId]
            ? gotchiBellyStored[gotchiId]
            : gotchiStaked[gotchiId];
        return (gotchiBellyAmount * 10000) / totalBellyStored;
    }

    /// @notice View: claimable rewards for gotchiId
    function claimableRewards(uint256 gotchiId) external view returns (uint256) {
        return rewards[gotchiId].accumulatedRewards;
    }
}
