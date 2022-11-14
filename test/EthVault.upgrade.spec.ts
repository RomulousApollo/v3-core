import { ethers, upgrades, waffle } from 'hardhat'
import { Wallet } from 'ethers'
import { defaultAbiCoder, parseEther } from 'ethers/lib/utils'
import { EthVault, EthVaultV2Mock } from '../typechain-types'
import snapshotGasCost from './shared/snapshotGasCost'
import { ethVaultFixture } from './shared/fixtures'
import { expect } from './shared/expect'
import { MAX_UINT256, ZERO_ADDRESS } from './shared/constants'

const createFixtureLoader = waffle.createFixtureLoader

describe('EthVault - upgrade', () => {
  const maxTotalAssets = parseEther('1000')
  const feePercent = 1000
  const vaultName = 'SW ETH Vault'
  const vaultSymbol = 'SW-ETH-1'
  const validatorsRoot = '0x059a8487a1ce461e9670c4646ef85164ae8791613866d28c972fb351dc45c606'
  const validatorsIpfsHash = '/ipfs/QmfPnyNojfyqoi9yqS3jMp16GGiTQee4bdCXJC64KqvTgc'
  let operator: Wallet, dao: Wallet, other: Wallet
  let vault: EthVault
  let updatedVault: EthVaultV2Mock
  let currImpl: string
  let newImpl: string
  let callData: string

  let loadFixture: ReturnType<typeof createFixtureLoader>

  before('create fixture loader', async () => {
    ;[dao, operator, other] = await (ethers as any).getSigners()
    loadFixture = createFixtureLoader([dao])
  })

  beforeEach('deploy fixture', async () => {
    const { createVault, registry, validatorsRegistry, keeper } = await loadFixture(ethVaultFixture)
    vault = await createVault(
      operator,
      maxTotalAssets,
      validatorsRoot,
      feePercent,
      vaultName,
      vaultSymbol,
      validatorsIpfsHash
    )
    const ethVaultMock = await ethers.getContractFactory('EthVaultV2Mock')
    newImpl = (await upgrades.deployImplementation(ethVaultMock, {
      unsafeAllow: ['delegatecall'],
      constructorArgs: [keeper.address, registry.address, validatorsRegistry.address],
    })) as string
    currImpl = await vault.implementation()
    callData = defaultAbiCoder.encode(['uint128'], [100])
    await registry.connect(dao).addUpgrade(currImpl, newImpl)
    updatedVault = (await ethVaultMock.attach(vault.address)) as EthVaultV2Mock
  })

  it('fails without the call', async () => {
    await expect(vault.connect(operator).upgradeTo(newImpl)).to.revertedWith(
      'NotImplementedError()'
    )
    expect(await vault.version()).to.be.eq(1)
  })

  it('fails from not operator', async () => {
    await expect(vault.connect(other).upgradeToAndCall(newImpl, callData)).to.revertedWith(
      'AccessDenied()'
    )
    expect(await vault.version()).to.be.eq(1)
  })

  it('fails with zero new implementation address', async () => {
    await expect(vault.connect(operator).upgradeToAndCall(ZERO_ADDRESS, callData)).to.revertedWith(
      'UpgradeFailed()'
    )
    expect(await vault.version()).to.be.eq(1)
  })

  it('fails for the same implementation', async () => {
    await expect(vault.connect(operator).upgradeToAndCall(currImpl, callData)).to.revertedWith(
      'UpgradeFailed()'
    )
    expect(await vault.version()).to.be.eq(1)
  })

  it('fails for not approved implementation', async () => {
    await expect(vault.connect(operator).upgradeToAndCall(other.address, callData)).to.revertedWith(
      'UpgradeFailed()'
    )
    expect(await vault.version()).to.be.eq(1)
  })

  it('fails with invalid call data', async () => {
    await expect(
      vault
        .connect(operator)
        .upgradeToAndCall(newImpl, defaultAbiCoder.encode(['uint256'], [MAX_UINT256]))
    ).to.revertedWith('Address: low-level delegate call failed')
    expect(await vault.version()).to.be.eq(1)
  })

  it('works with valid call data', async () => {
    const receipt = await vault.connect(operator).upgradeToAndCall(newImpl, callData)
    expect(await vault.version()).to.be.eq(2)
    expect(await vault.implementation()).to.be.eq(newImpl)
    expect(await updatedVault.newVar()).to.be.eq(100)
    expect(await updatedVault.somethingNew()).to.be.eq(true)
    await expect(vault.connect(operator).upgradeToAndCall(newImpl, callData)).to.revertedWith(
      'UpgradeFailed()'
    )
    await expect(updatedVault.connect(operator).upgrade(callData)).to.revertedWith(
      'Initializable: contract is already initialized'
    )
    await snapshotGasCost(receipt)
  })
})