import { NetworkConfig, Networks } from './types'

export const NETWORKS: {
  [network in Networks]: NetworkConfig
} = {
  [Networks.goerli]: {
    url: process.env.GOERLI_RPC_URL || '',
    chainId: 5,
    governor: '0x1867c96601bc5fE24F685d112314B8F3Fe228D5A',
    validatorsRegistry: '0xff50ed3d0ec03aC01D4C79aAd74928BFF48a7b2b',
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
    requiredOracles: 6,
    rewardsDelay: 12 * 60 * 60,
    oraclesConfigIpfsHash: 'QmZHT64Aauy8quU3nvsUoRp7cSmQQCmPD1fHhPuP3JMTHL',
  },
  [Networks.gnosis]: {
    url: process.env.GNOSIS_RPC_URL || '',
    chainId: 100,
    governor: '0x8737f638E9af54e89ed9E1234dbC68B115CD169e',
    validatorsRegistry: '0x0B98057eA310F4d31F2a452B414647007d1645d9',
    oracles: [], // TODO: update with oracles' addresses
    requiredOracles: 6,
    rewardsDelay: 12 * 60 * 60,
    oraclesConfigIpfsHash: '',
  },
  [Networks.mainnet]: {
    url: process.env.MAINNET_RPC_URL || '',
    chainId: 1,
    governor: '0x144a98cb1CdBb23610501fE6108858D9B7D24934',
    validatorsRegistry: '0x00000000219ab540356cBB839Cbe05303d7705Fa',
    oracles: [], // TODO: update with oracles' addresses
    rewardsDelay: 12 * 60 * 60,
    requiredOracles: 6,
    oraclesConfigIpfsHash: '',
  },
}
