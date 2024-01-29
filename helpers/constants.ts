import { NetworkConfig, Networks } from './types'
import { parseEther } from 'ethers'
import { MAX_UINT256 } from '../test/shared/constants'

const MAX_UINT16 = 2n ** 16n - 1n

export const NETWORKS: {
  [network in Networks]: NetworkConfig
} = {
  [Networks.holesky]: {
    url: process.env.NETWORK_RPC_URL || '',
    chainId: 17000,

    governor: '0xFF2B6d2d5c205b99E2e6f607B6aFA3127B9957B6',
    validatorsRegistry: '0x4242424242424242424242424242424242424242',
    securityDeposit: 1000000000n, // 1 gwei
    exitedAssetsClaimDelay: 24 * 60 * 60, // 24 hours

    // Keeper
    oracles: [
      '0xf1a2f8E2FaE384566Fe10f9a960f52fe4a103737',
      '0xF1091485531122c2cd0Beb6fD998FBCcCf42b38C',
      '0x51182c9B66F5Cb2394511006851aE9b1Ea7f1B5D',
      '0x675eD17F58b15CD2C31F6d9bfb0b4DfcCA264eC1',
      '0x6bAfFEE3c8B59E5bA19c26Cd409B2a232abb57Cb',
      '0x36a2E8FF08f801caB399eab2fEe9E6A8C49A9C2A',
      '0x3EC6676fa4D07C1f31d088ae1DE96240eC56D1D9',
      '0x893e1c16fE47DF676Fd344d44c074096675B6aF6',
      '0x3eEC4A51cbB2De4e8Cc6c9eE859Ad16E8a8693FC',
      '0x9772Ef6AbC2Dfd879ebd88aeAA9Cf1e69a16fCF4',
      '0x18991d6F877eF0c0920BFF9B14D994D80d2E7B0c',
    ],
    rewardsMinOracles: 6,
    validatorsMinOracles: 6,
    rewardsDelay: 12 * 60 * 60, // 12 hours
    maxAvgRewardPerSecond: 6341958397n, // 20% APY
    oraclesConfigIpfsHash: 'QmPpm82rEJTfgw34noJKugYovHSg7BFdWHWzUV5eNC91Zs',

    // OsToken
    treasury: '0xFF2B6d2d5c205b99E2e6f607B6aFA3127B9957B6',
    osTokenFeePercent: 500, // 5%
    osTokenCapacity: parseEther('1000000'), // 1m ETH
    osTokenName: 'Staked ETH',
    osTokenSymbol: 'osETH',
    redeemFromLtvPercent: 9150n, // 91.5%
    redeemToLtvPercent: 9000n, // 90%
    liqThresholdPercent: 9200, // 92%
    liqBonusPercent: 10100, // 101%
    ltvPercent: 9000, // 90%

    // EthGenesisVault
    genesisVault: {
      admin: '0xFF2B6d2d5c205b99E2e6f607B6aFA3127B9957B6',
      poolEscrow: '0x253368DEBd5B3894D5A53516bE94CE4104bA4BD3',
      rewardEthToken: '0x413C51fDF65668B3A1d434bC184a479E3B8e0f3f',
      capacity: parseEther('1000000'), // 1m ETH
      feePercent: 500, // 5%
    },
    // EthFoxVault
    foxVault: {
      admin: '0x0000000000000000000000000000000000000000',
      capacity: MAX_UINT256, // unlimited
      feePercent: 500, // 5%
      metadataIpfsHash: '',
    },
    priceFeedDescription: 'osETH/ETH',

    // Cumulative MerkleDrop
    liquidityCommittee: '0xFF2B6d2d5c205b99E2e6f607B6aFA3127B9957B6',
    swiseToken: '0x484871C6D54a3dAEBeBBDB0AB7a54c97D72986Bb',
  },
  [Networks.mainnet]: {
    url: process.env.NETWORK_RPC_URL || '',
    chainId: 1,

    governor: '0x144a98cb1CdBb23610501fE6108858D9B7D24934',
    validatorsRegistry: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
    securityDeposit: 1000000000n, // 1 gwei
    exitedAssetsClaimDelay: 24 * 60 * 60, // 24 hours

    // Keeper
    oracles: [
      '0x6D403394848EaD12356C9Bb667ED27bCe1945914',
      '0xED5a1c366984215A28a95bE95A9a49d59a065e91',
      '0x20B04EcB2bc5E44Ac5AaAd9c8DD3cd04d9Fb87c8',
      '0x4E81bfde2eb1574bf0839aDEFb65cEA0D8B07EFC',
      '0x49F436341dbB3ffFce92C59fBcfcAEdaD22D0b0e',
      '0x624EC1141Eb0C3bE58b382737718852665c35Cf0',
      '0x671D846eCd7D945011912a6fa42E6F3E39eD0569',
      '0x3F77cC37b5F49561E84e36D87FAe1F032E1f771e',
      '0xa9Ccb8ba942C45F6Fa786F936679812591dA012a',
      '0xb5dBd61DAb7138aF20A61614e0A4587566C2A15A',
      '0x8Ce4f2800dE6476F42a070C79AfA58E0E209173e',
    ],
    rewardsDelay: 12 * 60 * 60, // 12 hours
    rewardsMinOracles: 6,
    validatorsMinOracles: 6,
    maxAvgRewardPerSecond: 6341958397n, // 20% APY
    oraclesConfigIpfsHash: 'QmXeaejxVMPgLAL1u7SuN12gUUULtwgYqvRNBzVafcnxFn',

    // OsToken
    treasury: '0x144a98cb1CdBb23610501fE6108858D9B7D24934',
    osTokenFeePercent: 500, // 5 %
    osTokenCapacity: parseEther('20000000'), // 20m osETH
    osTokenName: 'Staked ETH',
    osTokenSymbol: 'osETH',

    // OsTokenConfig
    redeemFromLtvPercent: MAX_UINT16, // disable redeems
    redeemToLtvPercent: MAX_UINT16, // disable redeems
    liqThresholdPercent: 9200, // 92%
    liqBonusPercent: 10100, // 101%
    ltvPercent: 9000, // 90%

    // EthGenesisVault
    genesisVault: {
      admin: '0xf330b5fE72E91d1a3782E65eED876CF3624c7802',
      poolEscrow: '0x2296e122c1a20Fca3CAc3371357BdAd3be0dF079',
      rewardEthToken: '0x20BC832ca081b91433ff6c17f85701B6e92486c5',
      capacity: parseEther('1000000'), // 1m ETH
      feePercent: 500, // 5%
    },
    // EthFoxVault
    foxVault: {
      admin: '0x0000000000000000000000000000000000000000',
      capacity: MAX_UINT256, // unlimited
      feePercent: 500, // 5%
      metadataIpfsHash: '',
    },
    priceFeedDescription: 'osETH/ETH',

    // Cumulative MerkleDrop
    liquidityCommittee: '0x189Cb93839AD52b5e955ddA254Ed7212ae1B1f61',
    swiseToken: '0x48C3399719B582dD63eB5AADf12A40B4C3f52FA2',
  },
}

export const ethValidatorsRegistry = {
  abi: [
    { inputs: [], stateMutability: 'nonpayable', type: 'constructor' },
    {
      anonymous: false,
      inputs: [
        { indexed: false, internalType: 'bytes', name: 'pubkey', type: 'bytes' },
        { indexed: false, internalType: 'bytes', name: 'withdrawal_credentials', type: 'bytes' },
        { indexed: false, internalType: 'bytes', name: 'amount', type: 'bytes' },
        { indexed: false, internalType: 'bytes', name: 'signature', type: 'bytes' },
        { indexed: false, internalType: 'bytes', name: 'index', type: 'bytes' },
      ],
      name: 'DepositEvent',
      type: 'event',
    },
    {
      inputs: [
        { internalType: 'bytes', name: 'pubkey', type: 'bytes' },
        { internalType: 'bytes', name: 'withdrawal_credentials', type: 'bytes' },
        { internalType: 'bytes', name: 'signature', type: 'bytes' },
        { internalType: 'bytes32', name: 'deposit_data_root', type: 'bytes32' },
      ],
      name: 'deposit',
      outputs: [],
      stateMutability: 'payable',
      type: 'function',
    },
    {
      inputs: [],
      name: 'get_deposit_count',
      outputs: [{ internalType: 'bytes', name: '', type: 'bytes' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [],
      name: 'get_deposit_root',
      outputs: [{ internalType: 'bytes32', name: '', type: 'bytes32' }],
      stateMutability: 'view',
      type: 'function',
    },
    {
      inputs: [{ internalType: 'bytes4', name: 'interfaceId', type: 'bytes4' }],
      name: 'supportsInterface',
      outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
      stateMutability: 'pure',
      type: 'function',
    },
  ],
  bytecode:
    '0x608060405234801561001057600080fd5b5060005b601f8110156101025760026021826020811061002c57fe5b01546021836020811061003b57fe5b015460405160200180838152602001828152602001925050506040516020818303038152906040526040518082805190602001908083835b602083106100925780518252601f199092019160209182019101610073565b51815160209384036101000a60001901801990921691161790526040519190930194509192505080830381855afa1580156100d1573d6000803e3d6000fd5b5050506040513d60208110156100e657600080fd5b5051602160018301602081106100f857fe5b0155600101610014565b506118d680620001136000396000f3fe60806040526004361061003f5760003560e01c806301ffc9a71461004457806322895118146100a4578063621fd130146101ba578063c5f2892f14610244575b600080fd5b34801561005057600080fd5b506100906004803603602081101561006757600080fd5b50357fffffffff000000000000000000000000000000000000000000000000000000001661026b565b604080519115158252519081900360200190f35b6101b8600480360360808110156100ba57600080fd5b8101906020810181356401000000008111156100d557600080fd5b8201836020820111156100e757600080fd5b8035906020019184600183028401116401000000008311171561010957600080fd5b91939092909160208101903564010000000081111561012757600080fd5b82018360208201111561013957600080fd5b8035906020019184600183028401116401000000008311171561015b57600080fd5b91939092909160208101903564010000000081111561017957600080fd5b82018360208201111561018b57600080fd5b803590602001918460018302840111640100000000831117156101ad57600080fd5b919350915035610304565b005b3480156101c657600080fd5b506101cf6110b5565b6040805160208082528351818301528351919283929083019185019080838360005b838110156102095781810151838201526020016101f1565b50505050905090810190601f1680156102365780820380516001836020036101000a031916815260200191505b509250505060405180910390f35b34801561025057600080fd5b506102596110c7565b60408051918252519081900360200190f35b60007fffffffff0000000000000000000000000000000000000000000000000000000082167f01ffc9a70000000000000000000000000000000000000000000000000000000014806102fe57507fffffffff0000000000000000000000000000000000000000000000000000000082167f8564090700000000000000000000000000000000000000000000000000000000145b92915050565b6030861461035d576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806118056026913960400191505060405180910390fd5b602084146103b6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252603681526020018061179c6036913960400191505060405180910390fd5b6060821461040f576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260298152602001806118786029913960400191505060405180910390fd5b670de0b6b3a7640000341015610470576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260268152602001806118526026913960400191505060405180910390fd5b633b9aca003406156104cd576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260338152602001806117d26033913960400191505060405180910390fd5b633b9aca00340467ffffffffffffffff811115610535576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602781526020018061182b6027913960400191505060405180910390fd5b6060610540826114ba565b90507f649bbc62d0e31342afea4e5cd82d4049e7e1ee912fc0889aa790803be39038c589898989858a8a6105756020546114ba565b6040805160a0808252810189905290819060208201908201606083016080840160c085018e8e80828437600083820152601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01690910187810386528c815260200190508c8c808284376000838201819052601f9091017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe01690920188810386528c5181528c51602091820193918e019250908190849084905b83811015610648578181015183820152602001610630565b50505050905090810190601f1680156106755780820380516001836020036101000a031916815260200191505b5086810383528881526020018989808284376000838201819052601f9091017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169092018881038452895181528951602091820193918b019250908190849084905b838110156106ef5781810151838201526020016106d7565b50505050905090810190601f16801561071c5780820380516001836020036101000a031916815260200191505b509d505050505050505050505050505060405180910390a1600060028a8a600060801b604051602001808484808284377fffffffffffffffffffffffffffffffff0000000000000000000000000000000090941691909301908152604080517ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0818403018152601090920190819052815191955093508392506020850191508083835b602083106107fc57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe090920191602091820191016107bf565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015610859573d6000803e3d6000fd5b5050506040513d602081101561086e57600080fd5b5051905060006002806108846040848a8c6116fe565b6040516020018083838082843780830192505050925050506040516020818303038152906040526040518082805190602001908083835b602083106108f857805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe090920191602091820191016108bb565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015610955573d6000803e3d6000fd5b5050506040513d602081101561096a57600080fd5b5051600261097b896040818d6116fe565b60405160009060200180848480828437919091019283525050604080518083038152602092830191829052805190945090925082918401908083835b602083106109f457805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe090920191602091820191016109b7565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015610a51573d6000803e3d6000fd5b5050506040513d6020811015610a6657600080fd5b5051604080516020818101949094528082019290925280518083038201815260609092019081905281519192909182918401908083835b60208310610ada57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101610a9d565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015610b37573d6000803e3d6000fd5b5050506040513d6020811015610b4c57600080fd5b50516040805160208101858152929350600092600292839287928f928f92018383808284378083019250505093505050506040516020818303038152906040526040518082805190602001908083835b60208310610bd957805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101610b9c565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015610c36573d6000803e3d6000fd5b5050506040513d6020811015610c4b57600080fd5b50516040518651600291889160009188916020918201918291908601908083835b60208310610ca957805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101610c6c565b6001836020036101000a0380198251168184511680821785525050505050509050018367ffffffffffffffff191667ffffffffffffffff1916815260180182815260200193505050506040516020818303038152906040526040518082805190602001908083835b60208310610d4e57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101610d11565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015610dab573d6000803e3d6000fd5b5050506040513d6020811015610dc057600080fd5b5051604080516020818101949094528082019290925280518083038201815260609092019081905281519192909182918401908083835b60208310610e3457805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101610df7565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015610e91573d6000803e3d6000fd5b5050506040513d6020811015610ea657600080fd5b50519050858114610f02576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260548152602001806117486054913960600191505060405180910390fd5b60205463ffffffff11610f60576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260218152602001806117276021913960400191505060405180910390fd5b602080546001019081905560005b60208110156110a9578160011660011415610fa0578260008260208110610f9157fe5b0155506110ac95505050505050565b600260008260208110610faf57fe5b01548460405160200180838152602001828152602001925050506040516020818303038152906040526040518082805190602001908083835b6020831061102557805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101610fe8565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa158015611082573d6000803e3d6000fd5b5050506040513d602081101561109757600080fd5b50519250600282049150600101610f6e565b50fe5b50505050505050565b60606110c26020546114ba565b905090565b6020546000908190815b60208110156112f05781600116600114156111e6576002600082602081106110f557fe5b01548460405160200180838152602001828152602001925050506040516020818303038152906040526040518082805190602001908083835b6020831061116b57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0909201916020918201910161112e565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa1580156111c8573d6000803e3d6000fd5b5050506040513d60208110156111dd57600080fd5b505192506112e2565b600283602183602081106111f657fe5b015460405160200180838152602001828152602001925050506040516020818303038152906040526040518082805190602001908083835b6020831061126b57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0909201916020918201910161122e565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa1580156112c8573d6000803e3d6000fd5b5050506040513d60208110156112dd57600080fd5b505192505b6002820491506001016110d1565b506002826112ff6020546114ba565b600060401b6040516020018084815260200183805190602001908083835b6020831061135a57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0909201916020918201910161131d565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790527fffffffffffffffffffffffffffffffffffffffffffffffff000000000000000095909516920191825250604080518083037ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8018152601890920190819052815191955093508392850191508083835b6020831061143f57805182527fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe09092019160209182019101611402565b51815160209384036101000a7fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff01801990921691161790526040519190930194509192505080830381855afa15801561149c573d6000803e3d6000fd5b5050506040513d60208110156114b157600080fd5b50519250505090565b60408051600880825281830190925260609160208201818036833701905050905060c082901b8060071a60f81b826000815181106114f457fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053508060061a60f81b8260018151811061153757fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053508060051a60f81b8260028151811061157a57fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053508060041a60f81b826003815181106115bd57fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053508060031a60f81b8260048151811061160057fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053508060021a60f81b8260058151811061164357fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053508060011a60f81b8260068151811061168657fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a9053508060001a60f81b826007815181106116c957fe5b60200101907effffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff1916908160001a90535050919050565b6000808585111561170d578182fd5b83861115611719578182fd5b505082019391909203915056fe4465706f736974436f6e74726163743a206d65726b6c6520747265652066756c6c4465706f736974436f6e74726163743a207265636f6e7374727563746564204465706f7369744461746120646f6573206e6f74206d6174636820737570706c696564206465706f7369745f646174615f726f6f744465706f736974436f6e74726163743a20696e76616c6964207769746864726177616c5f63726564656e7469616c73206c656e6774684465706f736974436f6e74726163743a206465706f7369742076616c7565206e6f74206d756c7469706c65206f6620677765694465706f736974436f6e74726163743a20696e76616c6964207075626b6579206c656e6774684465706f736974436f6e74726163743a206465706f7369742076616c756520746f6f20686967684465706f736974436f6e74726163743a206465706f7369742076616c756520746f6f206c6f774465706f736974436f6e74726163743a20696e76616c6964207369676e6174757265206c656e677468a2646970667358221220dceca8706b29e917dacf25fceef95acac8d90d765ac926663ce4096195952b6164736f6c634300060b0033',
}

export const MAINNET_FORK = {
  enabled: process.env.ENABLE_MAINNET_FORK === 'true',
  blockNumber: 19012280,
  rpcUrl: process.env.MAINNET_FORK_RPC_URL,
  vaults: {
    ethVaultOwnMevEscrow: '0xe6d8d8aC54461b1C5eD15740EEe322043F696C08',
    ethVaultSharedMevEscrow: '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56',
    ethPrivVaultOwnMevEscrow: '0x91804d6d10f2BD4E03338f40Dee01cF294085CD1',
    ethPrivVaultSharedMevEscrow: '0xD66A71A68392767F26b7EE47e9a0293191A23072',
    ethErc20VaultOwnMevEscrow: '0x3102B4013cB506481e959c8F4500B994D2bFF22e',
    ethErc20VaultSharedMevEscrow: '0x9c29c571847A68A947AceC8bacd303e36bC72ec5',
    ethPrivErc20VaultOwnMevEscrow: '0x3F202096c3A3f544Bd8f5ca2793E83d5642D5bFb',
    ethPrivErc20VaultSharedMevEscrow: '0xFB22Ded2bd69aff0907e195F23E448aB44E3cA97',
    ethGenesisVault: '0xAC0F906E433d58FA868F936E8A43230473652885',
  },
  harvestParams: {
    '0xe6d8d8aC54461b1C5eD15740EEe322043F696C08': {
      rewardsRoot: '0xf24684590e66a751f1369ed9bd7b46325fb03df25ce0c211582e58ae282fd808',
      reward: 12193827463000000000n,
      unlockedMevReward: 0n,
      proof: [
        '0xa789f77833f49a4c08d075a0c6ce91e93b652e579c6b1d3b83a3e573c7503ac8',
        '0x573b7f530c55b8f96d32c5548dafe1018bb89493fc4a08e2404f12e11568cafa',
        '0xbbb5439fba0a7d441ced6516492bad37d659a329a97c5acb41179b050d79437f',
        '0x38533c2bdb179c5dbf3804c8a88b19f15b2b4936db5d335873ddd402041dcc5a',
        '0xbb2867f6b729ce7e751aa886c90021867d9df13fab2cef1e535b7e4626a8ae15',
      ],
    },
    '0x8A93A876912c9F03F88Bc9114847cf5b63c89f56': {
      rewardsRoot: '0xf24684590e66a751f1369ed9bd7b46325fb03df25ce0c211582e58ae282fd808',
      reward: 2454616986562373318n,
      unlockedMevReward: 352469286728823941n,
      proof: [
        '0x142c76086a20070be8f8ed9b9dc3191b04833d1f75b3e240ba2f8d2c71bd6e5f',
        '0x5ae1bddf72733796effee063d8e8508a1c2db045375ae4e06405bafdf35b8bc8',
        '0x38616186a9c2c14a99f89e89c655515627774aa31c89a8fcd972a4e4254b1689',
        '0x6100a52818bc2067d8e642c7737e2d062a82aa63ac1a4bbcd3dad94dab5922b8',
        '0xf577e06ce6b0c222327083d59046f56542dda7c781a3cff459a0e89447474757',
      ],
    },
    '0x91804d6d10f2BD4E03338f40Dee01cF294085CD1': {
      rewardsRoot: '0xf24684590e66a751f1369ed9bd7b46325fb03df25ce0c211582e58ae282fd808',
      reward: 70752248000000000n,
      unlockedMevReward: 0n,
      proof: [
        '0xbb4ba011e69d534200d8014999062af8a2bacc318abb2f9143ff9587ed040230',
        '0xfef8773b0fb12da89120d18156b021e6ace975124a3a46bf917da6328dd56a90',
        '0x95e53d76000e47c6c44437754513400f8d247b881590d7787baf125d097d469f',
        '0x38533c2bdb179c5dbf3804c8a88b19f15b2b4936db5d335873ddd402041dcc5a',
        '0xbb2867f6b729ce7e751aa886c90021867d9df13fab2cef1e535b7e4626a8ae15',
      ],
    },
    '0xAC0F906E433d58FA868F936E8A43230473652885': {
      rewardsRoot: '0xf24684590e66a751f1369ed9bd7b46325fb03df25ce0c211582e58ae282fd808',
      reward: 8383761555912451103948n,
      unlockedMevReward: 91276098803317533293n,
      proof: [
        '0x3a8bb1f6f01f4edf8b87be619fdb330880f6c6932fff6c1189d3c9b2416826a9',
        '0xbfffdd3e06acac2a3f5a97c8709088e699f0601e7a459618a6bb97c3ecd2f60d',
        '0xb6ef861d80221583a9d9bb58c95417ac19e768d9fe71a54f054131f6aecde30c',
        '0xdc1c0714d1ad61ef6d07d8c5a5747b850286d3b7f7730845a1809d3e14e9a1f3',
        '0xbb2867f6b729ce7e751aa886c90021867d9df13fab2cef1e535b7e4626a8ae15',
      ],
    },
    '0xD66A71A68392767F26b7EE47e9a0293191A23072': {
      rewardsRoot: '0xf24684590e66a751f1369ed9bd7b46325fb03df25ce0c211582e58ae282fd808',
      reward: 17651468000000000n,
      unlockedMevReward: 0n,
      proof: [
        '0x80e3ff27d3ee86a8e196ae314acd21007b211f8e2cf523be80cd61a0ebdd631d',
        '0x6f37f0ddaba0d2dcb311c800c6e0701b7bc7659937f27335ae71023fd117330a',
        '0x55004ab210dcd74047f0ca737188ae45cb9446497851804cef94076174522bca',
        '0xdc1c0714d1ad61ef6d07d8c5a5747b850286d3b7f7730845a1809d3e14e9a1f3',
        '0xbb2867f6b729ce7e751aa886c90021867d9df13fab2cef1e535b7e4626a8ae15',
      ],
    },
    '0x3102B4013cB506481e959c8F4500B994D2bFF22e': {
      rewardsRoot: '0xf24684590e66a751f1369ed9bd7b46325fb03df25ce0c211582e58ae282fd808',
      reward: 12422163000000000n,
      unlockedMevReward: 0n,
      proof: [
        '0x978b7e534c10266572479f741cdbdf3c4d6ea937b2df3c0d5e1da7fa37749894',
        '0x9f227b3e66cce0f15623aa5544c37388851a4457f0d4200303e97a47ecf7094a',
        '0xbbb5439fba0a7d441ced6516492bad37d659a329a97c5acb41179b050d79437f',
        '0x38533c2bdb179c5dbf3804c8a88b19f15b2b4936db5d335873ddd402041dcc5a',
        '0xbb2867f6b729ce7e751aa886c90021867d9df13fab2cef1e535b7e4626a8ae15',
      ],
    },
    '0x9c29c571847A68A947AceC8bacd303e36bC72ec5': {
      rewardsRoot: '0xf24684590e66a751f1369ed9bd7b46325fb03df25ce0c211582e58ae282fd808',
      reward: 72586591703159932n,
      unlockedMevReward: 0n,
      proof: [
        '0xb5b71f51795dc8e3af6bd7d6f3ab57b30477b2245693effd462eada47a092e5f',
        '0xfef8773b0fb12da89120d18156b021e6ace975124a3a46bf917da6328dd56a90',
        '0x95e53d76000e47c6c44437754513400f8d247b881590d7787baf125d097d469f',
        '0x38533c2bdb179c5dbf3804c8a88b19f15b2b4936db5d335873ddd402041dcc5a',
        '0xbb2867f6b729ce7e751aa886c90021867d9df13fab2cef1e535b7e4626a8ae15',
      ],
    },
  },
  oracles: [
    '0x6D403394848EaD12356C9Bb667ED27bCe1945914',
    '0xED5a1c366984215A28a95bE95A9a49d59a065e91',
    '0x20B04EcB2bc5E44Ac5AaAd9c8DD3cd04d9Fb87c8',
    '0x4E81bfde2eb1574bf0839aDEFb65cEA0D8B07EFC',
    '0x49F436341dbB3ffFce92C59fBcfcAEdaD22D0b0e',
    '0x624EC1141Eb0C3bE58b382737718852665c35Cf0',
    '0x671D846eCd7D945011912a6fa42E6F3E39eD0569',
    '0x3F77cC37b5F49561E84e36D87FAe1F032E1f771e',
    '0xa9Ccb8ba942C45F6Fa786F936679812591dA012a',
    '0xb5dBd61DAb7138aF20A61614e0A4587566C2A15A',
    '0x8Ce4f2800dE6476F42a070C79AfA58E0E209173e',
  ],
  v2PoolHolder: '0x56556075Ab3e2Bb83984E90C52850AFd38F20883',
}
