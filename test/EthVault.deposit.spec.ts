import { ethers, waffle } from 'hardhat'
import { Contract, Wallet } from 'ethers'
import { parseEther } from 'ethers/lib/utils'
import { EthKeeper, EthVault, EthVaultMock, Oracles } from '../typechain-types'
import { ThenArg } from '../helpers/types'
import snapshotGasCost from './shared/snapshotGasCost'
import { ethVaultFixture } from './shared/fixtures'
import { expect } from './shared/expect'
import { PANIC_CODES, ZERO_ADDRESS } from './shared/constants'
import { updateRewardsRoot } from './shared/rewards'
import { registerEthValidator } from './shared/validators'

const createFixtureLoader = waffle.createFixtureLoader
const ether = parseEther('1')

describe('EthVault - deposit', () => {
  const maxTotalAssets = parseEther('1000')
  const feePercent = 1000
  const vaultName = 'SW ETH Vault'
  const vaultSymbol = 'SW-ETH-1'
  const validatorsRoot = '0x059a8487a1ce461e9670c4646ef85164ae8791613866d28c972fb351dc45c606'
  const validatorsIpfsHash = '/ipfs/QmfPnyNojfyqoi9yqS3jMp16GGiTQee4bdCXJC64KqvTgc'
  let dao: Wallet, sender: Wallet, receiver: Wallet, operator: Wallet, other: Wallet
  let vault: EthVault, keeper: EthKeeper, oracles: Oracles, validatorsRegistry: Contract

  let loadFixture: ReturnType<typeof createFixtureLoader>
  let createVault: ThenArg<ReturnType<typeof ethVaultFixture>>['createVault']
  let getSignatures: ThenArg<ReturnType<typeof ethVaultFixture>>['getSignatures']
  let createVaultMock: ThenArg<ReturnType<typeof ethVaultFixture>>['createVaultMock']

  before('create fixture loader', async () => {
    ;[dao, sender, receiver, operator, other] = await (ethers as any).getSigners()
    loadFixture = createFixtureLoader([dao])
  })

  beforeEach('deploy fixtures', async () => {
    ;({ createVault, createVaultMock, keeper, oracles, validatorsRegistry, getSignatures } =
      await loadFixture(ethVaultFixture))
    vault = await createVault(
      operator,
      maxTotalAssets,
      validatorsRoot,
      feePercent,
      vaultName,
      vaultSymbol,
      validatorsIpfsHash
    )
  })

  describe('empty vault: no assets & no shares', () => {
    it('status', async () => {
      expect(await vault.totalAssets()).to.equal(0)
      expect(await vault.totalSupply()).to.equal(0)
    })

    it('deposit', async () => {
      const amount = ether
      expect(await vault.convertToShares(amount)).to.eq(amount)
      const receipt = await vault.connect(sender).deposit(receiver.address, { value: amount })
      expect(await vault.balanceOf(receiver.address)).to.eq(amount)

      await expect(receipt)
        .to.emit(vault, 'Transfer')
        .withArgs(ZERO_ADDRESS, receiver.address, amount)
      await expect(receipt)
        .to.emit(vault, 'Deposit')
        .withArgs(sender.address, receiver.address, amount, amount)
      await snapshotGasCost(receipt)
    })
  })

  describe('partially empty vault: assets & no shares', () => {
    let ethVaultMock: EthVaultMock
    beforeEach(async () => {
      ethVaultMock = await createVaultMock(
        operator,
        maxTotalAssets,
        validatorsRoot,
        feePercent,
        vaultName,
        vaultSymbol,
        validatorsIpfsHash
      )
      await ethVaultMock._setTotalAssets(ether)
    })

    it('status', async () => {
      expect(await ethVaultMock.totalAssets()).to.eq(ether)
    })

    it('deposit', async () => {
      const amount = ether
      expect(await ethVaultMock.convertToShares(amount)).to.eq(amount)
      const receipt = await ethVaultMock
        .connect(sender)
        .deposit(receiver.address, { value: amount })
      expect(await ethVaultMock.balanceOf(receiver.address)).to.eq(amount)

      await expect(receipt)
        .to.emit(ethVaultMock, 'Transfer')
        .withArgs(ZERO_ADDRESS, receiver.address, amount)
      await expect(receipt)
        .to.emit(ethVaultMock, 'Deposit')
        .withArgs(sender.address, receiver.address, amount, amount)
      await snapshotGasCost(receipt)
    })
  })

  describe('partially empty vault: shares & no assets', () => {
    let ethVaultMock: EthVaultMock

    beforeEach(async () => {
      ethVaultMock = await createVaultMock(
        operator,
        maxTotalAssets,
        validatorsRoot,
        feePercent,
        vaultName,
        vaultSymbol,
        validatorsIpfsHash
      )
      await ethVaultMock.mockMint(receiver.address, ether)
    })

    it('status', async () => {
      expect(await ethVaultMock.totalAssets()).to.eq('0')
    })

    it('deposit', async () => {
      await expect(
        ethVaultMock.connect(sender).deposit(receiver.address, { value: ether })
      ).to.be.revertedWith(PANIC_CODES.DIVISION_BY_ZERO)
    })
  })

  describe('full vault: assets & shares', () => {
    beforeEach(async () => {
      await vault.connect(other).deposit(other.address, { value: parseEther('10') })
    })

    it('status', async () => {
      expect(await vault.totalAssets()).to.eq(parseEther('10'))
    })

    it('fails with exceeded max total assets', async () => {
      await expect(
        vault.connect(sender).deposit(receiver.address, { value: parseEther('999') })
      ).to.be.revertedWith('MaxTotalAssetsExceeded()')
    })

    it('fails when not harvested', async () => {
      await vault.connect(other).deposit(other.address, { value: parseEther('32') })
      await registerEthValidator(
        vault,
        oracles,
        keeper,
        validatorsRegistry,
        operator,
        getSignatures
      )
      await updateRewardsRoot(keeper, oracles, getSignatures, [
        { reward: parseEther('5'), vault: vault.address },
      ])
      await updateRewardsRoot(keeper, oracles, getSignatures, [
        { reward: parseEther('10'), vault: vault.address },
      ])
      await expect(
        vault.connect(sender).deposit(receiver.address, { value: parseEther('10') })
      ).to.be.revertedWith('NotHarvested()')
    })

    it('deposit', async () => {
      const amount = parseEther('100')
      const expectedShares = parseEther('100')
      expect(await vault.convertToShares(amount)).to.eq(expectedShares)

      const receipt = await vault.connect(sender).deposit(receiver.address, { value: amount })
      expect(await vault.balanceOf(receiver.address)).to.eq(expectedShares)

      await expect(receipt)
        .to.emit(vault, 'Transfer')
        .withArgs(ZERO_ADDRESS, receiver.address, expectedShares)
      await expect(receipt)
        .to.emit(vault, 'Deposit')
        .withArgs(sender.address, receiver.address, amount, expectedShares)
      await snapshotGasCost(receipt)
    })
  })
})
