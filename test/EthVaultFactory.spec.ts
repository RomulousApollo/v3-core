import { ethers, waffle } from 'hardhat'
import { Wallet } from 'ethers'
import { EthVault, EthVaultFactory } from '../typechain-types'
import snapshotGasCost from './shared/snapshotGasCost'
import { expect } from './shared/expect'
import { ethVaultFixture } from './shared/fixtures'

const createFixtureLoader = waffle.createFixtureLoader

describe('EthVaultFactory', () => {
  const maxTotalAssets = ethers.utils.parseEther('1000')
  const feePercent = 1000
  const vaultName = 'SW ETH Vault'
  const vaultSymbol = 'SW-ETH-1'
  let operator: Wallet, keeper: Wallet
  let factory: EthVaultFactory

  let loadFixture: ReturnType<typeof createFixtureLoader>

  before('create fixture loader', async () => {
    ;[operator, keeper] = await (ethers as any).getSigners()
    loadFixture = createFixtureLoader([keeper])
  })

  beforeEach(async () => {
    ;({ vaultFactory: factory } = await loadFixture(ethVaultFixture))
  })

  it('vault deployment gas', async () => {
    await snapshotGasCost(factory.createVault(vaultName, vaultSymbol, maxTotalAssets, feePercent))
  })

  it('creates vault correctly', async () => {
    const tx = await factory
      .connect(operator)
      .createVault(vaultName, vaultSymbol, maxTotalAssets, feePercent)
    const receipt = await tx.wait()
    const vaultAddress = receipt.events?.[2].args?.vault
    await expect(tx)
      .to.emit(factory, 'VaultCreated')
      .withArgs(
        operator.address,
        vaultAddress,
        receipt.events?.[2].args?.feesEscrow,
        vaultName,
        vaultSymbol,
        maxTotalAssets,
        feePercent
      )

    const ethVault = await ethers.getContractFactory('EthVault')
    const vault = ethVault.attach(vaultAddress) as EthVault
    expect(await vault.keeper()).to.be.eq(keeper.address)
    expect(await vault.name()).to.be.eq(vaultName)
    expect(await vault.symbol()).to.be.eq(vaultSymbol)
    expect(await vault.maxTotalAssets()).to.be.eq(maxTotalAssets)
    expect(await vault.feePercent()).to.be.eq(feePercent)
    expect(await vault.operator()).to.be.eq(operator.address)
  })
})
