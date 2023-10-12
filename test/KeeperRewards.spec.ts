import { ethers } from 'hardhat'
import { Contract, Wallet } from 'ethers'
import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers'
import { EthVault, IKeeperRewards, Keeper, OsToken, SharedMevEscrow } from '../typechain-types'
import { ThenArg } from '../helpers/types'
import { ethVaultFixture, getOraclesSignatures } from './shared/fixtures'
import { expect } from './shared/expect'
import {
  MAX_AVG_REWARD_PER_SECOND,
  ORACLES,
  REWARDS_DELAY,
  REWARDS_MIN_ORACLES,
  ZERO_ADDRESS,
  ZERO_BYTES32,
} from './shared/constants'
import snapshotGasCost from './shared/snapshotGasCost'
import { getKeeperRewardsUpdateData, getRewardsRootProof, VaultReward } from './shared/rewards'
import { increaseTime, setBalance, toHexString } from './shared/utils'
import { registerEthValidator } from './shared/validators'

describe('KeeperRewards', () => {
  const capacity = ethers.parseEther('1000')
  const feePercent = 1000
  const metadataIpfsHash = 'bafkreidivzimqfqtoqxkrpge6bjyhlvxqs3rhe73owtmdulaxr5do5in7u'

  let createVault: ThenArg<ReturnType<typeof ethVaultFixture>>['createEthVault']

  let dao: Wallet, admin: Wallet, oracle: Wallet, other: Wallet
  let keeper: Keeper,
    validatorsRegistry: Contract,
    sharedMevEscrow: SharedMevEscrow,
    osToken: OsToken

  beforeEach(async () => {
    ;[dao, admin, oracle, other] = await (ethers as any).getSigners()
    ;({
      keeper,
      createEthVault: createVault,
      validatorsRegistry,
      sharedMevEscrow,
      osToken,
    } = await loadFixture(ethVaultFixture))
    await setBalance(oracle.address, ethers.parseEther('10000'))
  })

  describe('update rewards', () => {
    let vaultReward: VaultReward
    let rewardsUpdateParams: IKeeperRewards.RewardsUpdateParamsStruct
    let vault: EthVault

    beforeEach(async () => {
      vault = await createVault(admin, {
        capacity,
        feePercent,
        metadataIpfsHash,
      })
      vaultReward = {
        reward: ethers.parseEther('5'),
        unlockedMevReward: ethers.parseEther('1'),
        vault: await vault.getAddress(),
      }
      const rewardsUpdate = await getKeeperRewardsUpdateData([vaultReward], keeper)
      rewardsUpdateParams = {
        rewardsRoot: rewardsUpdate.root,
        updateTimestamp: rewardsUpdate.updateTimestamp,
        rewardsIpfsHash: rewardsUpdate.ipfsHash,
        avgRewardPerSecond: rewardsUpdate.avgRewardPerSecond,
        signatures: getOraclesSignatures(rewardsUpdate.signingData),
      }
    })

    it('fails with invalid IPFS hash', async () => {
      await expect(
        keeper
          .connect(oracle)
          .updateRewards({ ...rewardsUpdateParams, rewardsIpfsHash: ZERO_BYTES32 })
      ).to.be.revertedWithCustomError(keeper, 'InvalidOracle')
    })

    it('fails with invalid avgRewardPerSecond', async () => {
      await expect(
        keeper.connect(oracle).updateRewards({
          ...rewardsUpdateParams,
          avgRewardPerSecond: MAX_AVG_REWARD_PER_SECOND + 1,
        })
      ).to.be.revertedWithCustomError(keeper, 'InvalidAvgRewardPerSecond')
    })

    it('fails with invalid nonce', async () => {
      await keeper.connect(oracle).updateRewards(rewardsUpdateParams)

      const newVaultReward = {
        reward: ethers.parseEther('3'),
        unlockedMevReward: ethers.parseEther('2'),
        vault: await vault.getAddress(),
      }
      const newRewardsUpdate = await getKeeperRewardsUpdateData([newVaultReward], keeper)
      await increaseTime(REWARDS_DELAY)
      await expect(
        keeper.connect(oracle).updateRewards({
          rewardsRoot: newRewardsUpdate.root,
          rewardsIpfsHash: newRewardsUpdate.ipfsHash,
          updateTimestamp: newRewardsUpdate.updateTimestamp,
          avgRewardPerSecond: newRewardsUpdate.avgRewardPerSecond,
          signatures: getOraclesSignatures(newRewardsUpdate.signingData),
        })
      ).to.be.revertedWithCustomError(keeper, 'InvalidOracle')
    })

    it('fails if too early', async () => {
      await keeper.connect(oracle).updateRewards(rewardsUpdateParams)
      const newVaultReward = {
        reward: ethers.parseEther('5'),
        unlockedMevReward: ethers.parseEther('1'),
        vault: await vault.getAddress(),
      }
      const newRewardsUpdate = await getKeeperRewardsUpdateData([newVaultReward], keeper, {
        nonce: 2,
        updateTimestamp: 1680255895,
      })
      expect(await keeper.canUpdateRewards()).to.eq(false)
      await expect(
        keeper.connect(oracle).updateRewards({
          rewardsRoot: newRewardsUpdate.root,
          rewardsIpfsHash: newRewardsUpdate.ipfsHash,
          updateTimestamp: newRewardsUpdate.updateTimestamp,
          avgRewardPerSecond: newRewardsUpdate.avgRewardPerSecond,
          signatures: getOraclesSignatures(newRewardsUpdate.signingData),
        })
      ).to.be.revertedWithCustomError(keeper, 'TooEarlyUpdate')
    })

    it('fails with invalid number of oracle signatures', async () => {
      const rewardsUpdate = await getKeeperRewardsUpdateData([vaultReward], keeper)
      const params = {
        ...rewardsUpdateParams,
        signatures: getOraclesSignatures(rewardsUpdate.signingData, REWARDS_MIN_ORACLES - 1),
      }
      await expect(keeper.connect(oracle).updateRewards(params)).to.be.revertedWithCustomError(
        keeper,
        'NotEnoughSignatures'
      )
    })

    it('fails with repeated signature', async () => {
      const rewardsUpdate = await getKeeperRewardsUpdateData([vaultReward], keeper)
      const params = {
        ...rewardsUpdateParams,
      }
      params.signatures = Buffer.concat([
        getOraclesSignatures(rewardsUpdate.signingData, REWARDS_MIN_ORACLES - 1),
        getOraclesSignatures(rewardsUpdate.signingData, 1),
      ])
      await expect(keeper.connect(oracle).updateRewards(params)).to.be.revertedWithCustomError(
        keeper,
        'InvalidOracle'
      )
    })

    it('fails with invalid oracle', async () => {
      await keeper
        .connect(dao)
        .removeOracle(new Wallet(toHexString(ORACLES[1]), ethers.provider).address)
      await expect(
        keeper.connect(oracle).updateRewards(rewardsUpdateParams)
      ).to.be.revertedWithCustomError(keeper, 'InvalidOracle')
    })

    it('succeeds with all signatures', async () => {
      const rewardsUpdate = await getKeeperRewardsUpdateData([vaultReward], keeper)
      const params = {
        ...rewardsUpdateParams,
        signatures: getOraclesSignatures(rewardsUpdate.signingData, ORACLES.length),
      }
      const receipt = await keeper.connect(oracle).updateRewards(params)
      await snapshotGasCost(receipt)
    })

    it('succeeds', async () => {
      expect(await keeper.lastRewardsTimestamp()).to.eq(0)
      expect(await keeper.canUpdateRewards()).to.eq(true)
      let receipt = await keeper.connect(oracle).updateRewards(rewardsUpdateParams)
      await expect(receipt)
        .to.emit(keeper, 'RewardsUpdated')
        .withArgs(
          oracle.address,
          rewardsUpdateParams.rewardsRoot,
          rewardsUpdateParams.avgRewardPerSecond,
          rewardsUpdateParams.updateTimestamp,
          1,
          rewardsUpdateParams.rewardsIpfsHash
        )
      await expect(receipt)
        .to.emit(osToken, 'AvgRewardPerSecondUpdated')
        .withArgs(rewardsUpdateParams.avgRewardPerSecond)
      expect(await keeper.prevRewardsRoot()).to.eq(ZERO_BYTES32)
      expect(await keeper.rewardsRoot()).to.eq(rewardsUpdateParams.rewardsRoot)
      expect(await keeper.rewardsNonce()).to.eq(2)
      expect(await osToken.avgRewardPerSecond()).to.eq(rewardsUpdateParams.avgRewardPerSecond)
      expect(await keeper.lastRewardsTimestamp()).to.not.eq(0)
      expect(await keeper.canUpdateRewards()).to.eq(false)
      await snapshotGasCost(receipt)

      // check keeps previous rewards root
      const newVaultReward = {
        reward: ethers.parseEther('3'),
        unlockedMevReward: ethers.parseEther('2'),
        vault: await vault.getAddress(),
      }
      const newRewardsUpdate = await getKeeperRewardsUpdateData([newVaultReward], keeper, {
        nonce: 2,
        updateTimestamp: 1670256000,
      })
      await increaseTime(REWARDS_DELAY)
      receipt = await keeper.connect(oracle).updateRewards({
        rewardsRoot: newRewardsUpdate.root,
        rewardsIpfsHash: newRewardsUpdate.ipfsHash,
        updateTimestamp: newRewardsUpdate.updateTimestamp,
        avgRewardPerSecond: newRewardsUpdate.avgRewardPerSecond,
        signatures: getOraclesSignatures(newRewardsUpdate.signingData),
      })
      await expect(receipt)
        .to.emit(keeper, 'RewardsUpdated')
        .withArgs(
          oracle.address,
          newRewardsUpdate.root,
          newRewardsUpdate.avgRewardPerSecond,
          newRewardsUpdate.updateTimestamp,
          2,
          newRewardsUpdate.ipfsHash
        )
      expect(await keeper.prevRewardsRoot()).to.eq(rewardsUpdateParams.rewardsRoot)
      expect(await keeper.rewardsRoot()).to.eq(newRewardsUpdate.root)
      expect(await keeper.rewardsNonce()).to.eq(3)
      await snapshotGasCost(receipt)
    })
  })

  describe('is harvest required', () => {
    let vault: EthVault

    beforeEach(async () => {
      vault = await createVault(admin, {
        capacity,
        feePercent,
        metadataIpfsHash,
      })
    })

    it('returns false for uncollateralized vault', async () => {
      expect(await keeper.isCollateralized(await vault.getAddress())).to.equal(false)
      expect(await keeper.isHarvestRequired(await vault.getAddress())).to.equal(false)
      expect(await keeper.canHarvest(await vault.getAddress())).to.equal(false)
      expect(await vault.isStateUpdateRequired()).to.equal(false)
    })

    it('returns true for collateralized two times unharvested vault', async () => {
      // collateralize vault
      const validatorDeposit = ethers.parseEther('32')
      await vault.connect(admin).deposit(admin.address, ZERO_ADDRESS, { value: validatorDeposit })
      await registerEthValidator(vault, keeper, validatorsRegistry, admin)

      expect(await keeper.isCollateralized(await vault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await vault.getAddress())).to.equal(false)
      expect(await keeper.isHarvestRequired(await vault.getAddress())).to.equal(false)
      expect(await vault.isStateUpdateRequired()).to.equal(false)

      // update rewards first time
      let newVaultReward = {
        reward: ethers.parseEther('3'),
        unlockedMevReward: ethers.parseEther('0.5'),
        vault: await vault.getAddress(),
      }
      let newRewardsUpdate = await getKeeperRewardsUpdateData([newVaultReward], keeper, {
        updateTimestamp: 1670258895,
      })
      await keeper.connect(oracle).updateRewards({
        rewardsRoot: newRewardsUpdate.root,
        rewardsIpfsHash: newRewardsUpdate.ipfsHash,
        updateTimestamp: newRewardsUpdate.updateTimestamp,
        avgRewardPerSecond: newRewardsUpdate.avgRewardPerSecond,

        signatures: getOraclesSignatures(newRewardsUpdate.signingData),
      })

      expect(await keeper.isCollateralized(await vault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await vault.getAddress())).to.equal(true)
      expect(await keeper.isHarvestRequired(await vault.getAddress())).to.equal(false)
      expect(await vault.isStateUpdateRequired()).to.equal(false)

      // update rewards second time
      const newTimestamp = newRewardsUpdate.updateTimestamp + 1
      newVaultReward = {
        reward: ethers.parseEther('4'),
        unlockedMevReward: ethers.parseEther('2'),
        vault: await vault.getAddress(),
      }
      newRewardsUpdate = await getKeeperRewardsUpdateData([newVaultReward], keeper, {
        nonce: 2,
        updateTimestamp: newTimestamp,
      })
      await increaseTime(REWARDS_DELAY)
      await keeper.connect(oracle).updateRewards({
        rewardsRoot: newRewardsUpdate.root,
        rewardsIpfsHash: newRewardsUpdate.ipfsHash,
        updateTimestamp: newRewardsUpdate.updateTimestamp,
        avgRewardPerSecond: newRewardsUpdate.avgRewardPerSecond,

        signatures: getOraclesSignatures(newRewardsUpdate.signingData),
      })

      expect(await keeper.isCollateralized(await vault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await vault.getAddress())).to.equal(true)
      expect(await keeper.isHarvestRequired(await vault.getAddress())).to.equal(true)
      expect(await vault.isStateUpdateRequired()).to.equal(true)
    })
  })

  describe('harvest (own escrow)', () => {
    let harvestParams: IKeeperRewards.HarvestParamsStruct
    let ownMevVault: EthVault

    beforeEach(async () => {
      ownMevVault = await createVault(
        admin,
        {
          capacity,
          feePercent,
          metadataIpfsHash,
        },
        true
      )
      const vaultReward = {
        reward: ethers.parseEther('5'),
        unlockedMevReward: 0n,
        vault: await ownMevVault.getAddress(),
      }
      const vaultRewards = [vaultReward]
      for (let i = 1; i < 11; i++) {
        const vlt = await createVault(
          admin,
          {
            capacity,
            feePercent,
            metadataIpfsHash,
          },
          true
        )
        vaultRewards.push({
          reward: ethers.parseEther(i.toString()),
          unlockedMevReward: 0n,
          vault: await vlt.getAddress(),
        })
      }

      const rewardsUpdate = await getKeeperRewardsUpdateData(vaultRewards, keeper)
      await keeper.connect(oracle).updateRewards({
        rewardsRoot: rewardsUpdate.root,
        updateTimestamp: rewardsUpdate.updateTimestamp,
        rewardsIpfsHash: rewardsUpdate.ipfsHash,
        avgRewardPerSecond: rewardsUpdate.avgRewardPerSecond,
        signatures: getOraclesSignatures(rewardsUpdate.signingData),
      })
      harvestParams = {
        rewardsRoot: rewardsUpdate.root,
        reward: vaultReward.reward,
        unlockedMevReward: vaultReward.unlockedMevReward,
        proof: getRewardsRootProof(rewardsUpdate.tree, vaultReward),
      }
    })

    it('only vault can harvest', async () => {
      await expect(keeper.harvest(harvestParams)).to.be.revertedWithCustomError(
        keeper,
        'AccessDenied'
      )
    })

    it('fails for invalid reward', async () => {
      await expect(
        ownMevVault.updateState({ ...harvestParams, reward: 0 })
      ).to.be.revertedWithCustomError(ownMevVault, 'InvalidProof')
    })

    it('fails for invalid proof', async () => {
      await expect(
        ownMevVault.updateState({ ...harvestParams, proof: [] })
      ).to.be.revertedWithCustomError(ownMevVault, 'InvalidProof')
    })

    it('fails for invalid root', async () => {
      const invalidRoot = '0x' + '1'.repeat(64)
      await expect(
        ownMevVault.updateState({ ...harvestParams, rewardsRoot: invalidRoot })
      ).to.be.revertedWithCustomError(keeper, 'InvalidRewardsRoot')
    })

    it('ignores unlocked mev reward', async () => {
      const sharedMevEscrowBalance = ethers.parseEther('1')
      await setBalance(await sharedMevEscrow.getAddress(), sharedMevEscrowBalance)
      await increaseTime(REWARDS_DELAY)

      // update rewards root
      const vaultReward = {
        reward: ethers.parseEther('10'),
        vault: await ownMevVault.getAddress(),
        unlockedMevReward: sharedMevEscrowBalance,
      }
      const rewardsUpdate = await getKeeperRewardsUpdateData([vaultReward], keeper, {
        nonce: 2,
        updateTimestamp: 1680255895,
      })
      await keeper.connect(oracle).updateRewards({
        rewardsRoot: rewardsUpdate.root,
        updateTimestamp: rewardsUpdate.updateTimestamp,
        rewardsIpfsHash: rewardsUpdate.ipfsHash,
        avgRewardPerSecond: rewardsUpdate.avgRewardPerSecond,
        signatures: getOraclesSignatures(rewardsUpdate.signingData),
      })
      const harvestParams = {
        rewardsRoot: rewardsUpdate.root,
        reward: vaultReward.reward,
        unlockedMevReward: vaultReward.unlockedMevReward,
        proof: getRewardsRootProof(rewardsUpdate.tree, vaultReward),
      }

      const receipt = await ownMevVault.updateState(harvestParams)
      await expect(receipt)
        .to.emit(keeper, 'Harvested')
        .withArgs(
          await ownMevVault.getAddress(),
          harvestParams.rewardsRoot,
          harvestParams.reward,
          0
        )
      expect(await ethers.provider.getBalance(await sharedMevEscrow.getAddress())).to.equal(
        sharedMevEscrowBalance
      )
    })

    it('succeeds for latest rewards root', async () => {
      const receipt = await ownMevVault.updateState(harvestParams)
      await expect(receipt)
        .to.emit(keeper, 'Harvested')
        .withArgs(
          await ownMevVault.getAddress(),
          harvestParams.rewardsRoot,
          harvestParams.reward,
          harvestParams.unlockedMevReward
        )

      const rewards = await keeper.rewards(await ownMevVault.getAddress())
      expect(rewards.nonce).to.equal(2)
      expect(rewards.assets).to.equal(harvestParams.reward)

      const unlockedMevRewards = await keeper.unlockedMevRewards(await ownMevVault.getAddress())
      expect(unlockedMevRewards.nonce).to.equal(0)
      expect(unlockedMevRewards.assets).to.equal(0)

      expect(await keeper.isCollateralized(await ownMevVault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await ownMevVault.getAddress())).to.equal(false)
      expect(await keeper.isHarvestRequired(await ownMevVault.getAddress())).to.equal(false)
      await snapshotGasCost(receipt)

      // does not fail for harvesting twice
      const mevEscrow = await ownMevVault.mevEscrow()
      await other.sendTransaction({
        to: mevEscrow,
        value: ethers.parseEther('5'),
      })
      const totalAssets = await ownMevVault.totalAssets()
      const ownMevEscrowAssets = await ethers.provider.getBalance(mevEscrow)
      await expect(await ownMevVault.updateState(harvestParams)).to.not.emit(keeper, 'Harvested')
      expect(await ethers.provider.getBalance(mevEscrow)).to.equal(ownMevEscrowAssets)
      expect(await ownMevVault.totalAssets()).to.equal(totalAssets)
    })

    it('succeeds for previous rewards root', async () => {
      const prevHarvestParams = harvestParams
      await increaseTime(REWARDS_DELAY)

      // update rewards root
      const vaultReward = {
        reward: ethers.parseEther('10'),
        vault: await ownMevVault.getAddress(),
        unlockedMevReward: 0n,
      }
      const rewardsUpdate = await getKeeperRewardsUpdateData([vaultReward], keeper, {
        nonce: 2,
        updateTimestamp: 1680255895,
      })
      await keeper.connect(oracle).updateRewards({
        rewardsRoot: rewardsUpdate.root,
        updateTimestamp: rewardsUpdate.updateTimestamp,
        rewardsIpfsHash: rewardsUpdate.ipfsHash,
        avgRewardPerSecond: rewardsUpdate.avgRewardPerSecond,
        signatures: getOraclesSignatures(rewardsUpdate.signingData),
      })
      const currHarvestParams = {
        rewardsRoot: rewardsUpdate.root,
        reward: vaultReward.reward,
        unlockedMevReward: 0n,
        proof: getRewardsRootProof(rewardsUpdate.tree, vaultReward),
      }

      let receipt = await ownMevVault.updateState(prevHarvestParams)
      await expect(receipt)
        .to.emit(keeper, 'Harvested')
        .withArgs(
          await ownMevVault.getAddress(),
          prevHarvestParams.rewardsRoot,
          prevHarvestParams.reward,
          0
        )

      let rewards = await keeper.rewards(await ownMevVault.getAddress())
      expect(rewards.nonce).to.equal(2)
      expect(rewards.assets).to.equal(prevHarvestParams.reward)

      expect(await keeper.isCollateralized(await ownMevVault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await ownMevVault.getAddress())).to.equal(true)
      expect(await keeper.isHarvestRequired(await ownMevVault.getAddress())).to.equal(false)
      await snapshotGasCost(receipt)

      receipt = await ownMevVault.updateState(currHarvestParams)
      await expect(receipt)
        .to.emit(keeper, 'Harvested')
        .withArgs(
          await ownMevVault.getAddress(),
          currHarvestParams.rewardsRoot,
          currHarvestParams.reward - BigInt(prevHarvestParams.reward),
          0
        )

      rewards = await keeper.rewards(await ownMevVault.getAddress())
      expect(rewards.nonce).to.equal(3)
      expect(rewards.assets).to.equal(currHarvestParams.reward)

      expect(await keeper.isCollateralized(await ownMevVault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await ownMevVault.getAddress())).to.equal(false)
      expect(await keeper.isHarvestRequired(await ownMevVault.getAddress())).to.equal(false)
      await snapshotGasCost(receipt)

      // does not fail for harvesting twice
      const mevEscrow = await ownMevVault.mevEscrow()
      await other.sendTransaction({
        to: mevEscrow,
        value: ethers.parseEther('5'),
      })
      const totalAssets = await ownMevVault.totalAssets()
      const ownMevEscrowAssets = await ethers.provider.getBalance(mevEscrow)
      await expect(await ownMevVault.updateState(prevHarvestParams)).to.not.emit(
        keeper,
        'Harvested'
      )
      expect(await ethers.provider.getBalance(mevEscrow)).to.equal(ownMevEscrowAssets)
      expect(await ownMevVault.totalAssets()).to.equal(totalAssets)
    })
  })

  describe('harvest (shared escrow)', () => {
    let harvestParams: IKeeperRewards.HarvestParamsStruct
    let sharedMevVault: EthVault

    beforeEach(async () => {
      sharedMevVault = await createVault(
        admin,
        {
          capacity,
          feePercent,
          metadataIpfsHash,
        },
        false
      )
      const vaultReward = {
        reward: ethers.parseEther('5'),
        unlockedMevReward: ethers.parseEther('2'),
        vault: await sharedMevVault.getAddress(),
      }
      const vaultRewards = [vaultReward]
      for (let i = 1; i < 11; i++) {
        const vlt = await createVault(
          admin,
          {
            capacity,
            feePercent,
            metadataIpfsHash,
          },
          true
        )
        const amount = ethers.parseEther(i.toString())
        vaultRewards.push({
          reward: amount,
          unlockedMevReward: amount,
          vault: await vlt.getAddress(),
        })
      }

      const rewardsUpdate = await getKeeperRewardsUpdateData(vaultRewards, keeper)
      await keeper.connect(oracle).updateRewards({
        rewardsRoot: rewardsUpdate.root,
        updateTimestamp: rewardsUpdate.updateTimestamp,
        rewardsIpfsHash: rewardsUpdate.ipfsHash,
        avgRewardPerSecond: rewardsUpdate.avgRewardPerSecond,
        signatures: getOraclesSignatures(rewardsUpdate.signingData),
      })
      harvestParams = {
        rewardsRoot: rewardsUpdate.root,
        reward: vaultReward.reward,
        unlockedMevReward: vaultReward.unlockedMevReward,
        proof: getRewardsRootProof(rewardsUpdate.tree, vaultReward),
      }
      await setBalance(await sharedMevEscrow.getAddress(), BigInt(harvestParams.unlockedMevReward))
    })

    it('only vault can harvest', async () => {
      await expect(keeper.harvest(harvestParams)).to.be.revertedWithCustomError(
        keeper,
        'AccessDenied'
      )
    })

    it('fails for invalid unlocked MEV reward', async () => {
      await expect(
        sharedMevVault.updateState({ ...harvestParams, unlockedMevReward: 0n })
      ).to.be.revertedWithCustomError(sharedMevVault, 'InvalidProof')
    })

    it('fails for invalid proof', async () => {
      await expect(
        sharedMevVault.updateState({ ...harvestParams, proof: [] })
      ).to.be.revertedWithCustomError(sharedMevVault, 'InvalidProof')
    })

    it('fails for invalid root', async () => {
      const invalidRoot = '0x' + '1'.repeat(64)
      await expect(
        sharedMevVault.updateState({ ...harvestParams, rewardsRoot: invalidRoot })
      ).to.be.revertedWithCustomError(keeper, 'InvalidRewardsRoot')
    })

    it('succeeds for latest rewards root', async () => {
      const receipt = await sharedMevVault.updateState(harvestParams)
      await expect(receipt)
        .to.emit(keeper, 'Harvested')
        .withArgs(
          await sharedMevVault.getAddress(),
          harvestParams.rewardsRoot,
          harvestParams.reward,
          harvestParams.unlockedMevReward
        )
      expect(await ethers.provider.getBalance(await sharedMevEscrow.getAddress())).to.equal(0)
      await expect(receipt)
        .to.emit(sharedMevEscrow, 'Harvested')
        .withArgs(await sharedMevVault.getAddress(), harvestParams.unlockedMevReward)

      const rewards = await keeper.rewards(await sharedMevVault.getAddress())
      expect(rewards.nonce).to.equal(2)
      expect(rewards.assets).to.equal(harvestParams.reward)

      const unlockedMevRewards = await keeper.unlockedMevRewards(await sharedMevVault.getAddress())
      expect(unlockedMevRewards.nonce).to.equal(2)
      expect(unlockedMevRewards.assets).to.equal(harvestParams.unlockedMevReward)

      expect(await keeper.isCollateralized(await sharedMevVault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await sharedMevVault.getAddress())).to.equal(false)
      expect(await keeper.isHarvestRequired(await sharedMevVault.getAddress())).to.equal(false)
      await snapshotGasCost(receipt)

      // does not fail for harvesting twice
      await expect(await sharedMevVault.updateState(harvestParams)).to.not.emit(keeper, 'Harvested')
    })

    it('succeeds for previous rewards root', async () => {
      const prevHarvestParams = harvestParams
      await increaseTime(REWARDS_DELAY)

      // update rewards root
      const vaultReward = {
        reward: ethers.parseEther('10'),
        vault: await sharedMevVault.getAddress(),
        unlockedMevReward: ethers.parseEther('4'),
      }
      await setBalance(await sharedMevEscrow.getAddress(), vaultReward.unlockedMevReward)
      const rewardsUpdate = await getKeeperRewardsUpdateData([vaultReward], keeper, {
        nonce: 2,
        updateTimestamp: 1680255895,
      })
      await keeper.connect(oracle).updateRewards({
        rewardsRoot: rewardsUpdate.root,
        updateTimestamp: rewardsUpdate.updateTimestamp,
        rewardsIpfsHash: rewardsUpdate.ipfsHash,
        avgRewardPerSecond: rewardsUpdate.avgRewardPerSecond,
        signatures: getOraclesSignatures(rewardsUpdate.signingData),
      })
      const currHarvestParams = {
        rewardsRoot: rewardsUpdate.root,
        reward: vaultReward.reward,
        unlockedMevReward: vaultReward.unlockedMevReward,
        proof: getRewardsRootProof(rewardsUpdate.tree, vaultReward),
      }

      let receipt = await sharedMevVault.updateState(prevHarvestParams)
      await expect(receipt)
        .to.emit(keeper, 'Harvested')
        .withArgs(
          await sharedMevVault.getAddress(),
          prevHarvestParams.rewardsRoot,
          prevHarvestParams.reward,
          prevHarvestParams.unlockedMevReward
        )
      expect(await ethers.provider.getBalance(await sharedMevEscrow.getAddress())).to.equal(
        ethers.parseEther('2')
      )
      await expect(receipt)
        .to.emit(sharedMevEscrow, 'Harvested')
        .withArgs(await sharedMevVault.getAddress(), prevHarvestParams.unlockedMevReward)

      let rewards = await keeper.rewards(await sharedMevVault.getAddress())
      expect(rewards.nonce).to.equal(2)
      expect(rewards.assets).to.equal(prevHarvestParams.reward)

      expect(await keeper.isCollateralized(await sharedMevVault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await sharedMevVault.getAddress())).to.equal(true)
      expect(await keeper.isHarvestRequired(await sharedMevVault.getAddress())).to.equal(false)
      await snapshotGasCost(receipt)

      receipt = await sharedMevVault.updateState(currHarvestParams)
      const sharedMevDelta =
        currHarvestParams.unlockedMevReward - BigInt(prevHarvestParams.unlockedMevReward)
      await expect(receipt)
        .to.emit(keeper, 'Harvested')
        .withArgs(
          await sharedMevVault.getAddress(),
          currHarvestParams.rewardsRoot,
          currHarvestParams.reward - BigInt(prevHarvestParams.reward),
          sharedMevDelta
        )
      await expect(receipt)
        .to.emit(sharedMevEscrow, 'Harvested')
        .withArgs(await sharedMevVault.getAddress(), sharedMevDelta)
      expect(await ethers.provider.getBalance(await sharedMevEscrow.getAddress())).to.equal(0)

      rewards = await keeper.rewards(await sharedMevVault.getAddress())
      expect(rewards.nonce).to.equal(3)
      expect(rewards.assets).to.equal(currHarvestParams.reward)

      expect(await keeper.isCollateralized(await sharedMevVault.getAddress())).to.equal(true)
      expect(await keeper.canHarvest(await sharedMevVault.getAddress())).to.equal(false)
      expect(await keeper.isHarvestRequired(await sharedMevVault.getAddress())).to.equal(false)
      await snapshotGasCost(receipt)

      // does not fail for harvesting twice
      await expect(await sharedMevVault.updateState(harvestParams)).to.not.emit(keeper, 'Harvested')
    })
  })

  describe('set min rewards oracles', () => {
    it('fails if not owner', async () => {
      await expect(keeper.connect(other).setRewardsMinOracles(1)).revertedWithCustomError(
        keeper,
        'OwnableUnauthorizedAccount'
      )
    })

    it('fails with number larger than total oracles', async () => {
      await expect(
        keeper.connect(dao).setRewardsMinOracles(ORACLES.length + 1)
      ).revertedWithCustomError(keeper, 'InvalidOracles')
    })

    it('fails with zero', async () => {
      await expect(keeper.connect(dao).setRewardsMinOracles(0)).revertedWithCustomError(
        keeper,
        'InvalidOracles'
      )
    })

    it('succeeds', async () => {
      const receipt = await keeper.connect(dao).setRewardsMinOracles(1)
      await expect(receipt).to.emit(keeper, 'RewardsMinOraclesUpdated').withArgs(1)
      expect(await keeper.rewardsMinOracles()).to.be.eq(1)
      await snapshotGasCost(receipt)
    })
  })
})
