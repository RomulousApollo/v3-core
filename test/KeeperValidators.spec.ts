import { ethers, waffle } from 'hardhat'
import { Contract, Wallet } from 'ethers'
import { hexlify, parseEther } from 'ethers/lib/utils'
import { Keeper, EthVault, Oracles, IKeeperValidators } from '../typechain-types'
import { ThenArg } from '../helpers/types'
import { ethVaultFixture } from './shared/fixtures'
import { expect } from './shared/expect'
import { ORACLES } from './shared/constants'
import {
  createEthValidatorsData,
  getEthValidatorsSigningData,
  getValidatorProof,
  getValidatorsMultiProof,
  getWithdrawalCredentials,
  ValidatorsMultiProof,
  EthValidatorsData,
  exitSignatureIpfsHashes,
} from './shared/validators'
import snapshotGasCost from './shared/snapshotGasCost'

const createFixtureLoader = waffle.createFixtureLoader

describe('KeeperValidators', () => {
  const capacity = parseEther('1000')
  const feePercent = 1000
  const name = 'SW ETH Vault'
  const symbol = 'SW-ETH-1'
  const validatorsRoot = '0x059a8487a1ce461e9670c4646ef85164ae8791613866d28c972fb351dc45c606'
  const metadataIpfsHash = 'bafkreidivzimqfqtoqxkrpge6bjyhlvxqs3rhe73owtmdulaxr5do5in7u'
  const depositAmount = parseEther('32')

  let loadFixture: ReturnType<typeof createFixtureLoader>
  let createVault: ThenArg<ReturnType<typeof ethVaultFixture>>['createVault']
  let getSignatures: ThenArg<ReturnType<typeof ethVaultFixture>>['getSignatures']

  let sender: Wallet, owner: Wallet, admin: Wallet
  let keeper: Keeper, oracles: Oracles, vault: EthVault, validatorsRegistry: Contract
  let validatorsData: EthValidatorsData
  let validatorsRegistryRoot: string

  before('create fixture loader', async () => {
    ;[sender, admin, owner] = await (ethers as any).getSigners()
    loadFixture = createFixtureLoader([owner])
  })

  beforeEach(async () => {
    ;({ oracles, keeper, validatorsRegistry, createVault, getSignatures } = await loadFixture(
      ethVaultFixture
    ))
    vault = await createVault(admin, {
      capacity,
      validatorsRoot,
      feePercent,
      name,
      symbol,
      metadataIpfsHash,
    })
    validatorsData = await createEthValidatorsData(vault)
    validatorsRegistryRoot = await validatorsRegistry.get_deposit_root()
    await vault.connect(admin).setValidatorsRoot(validatorsData.root)
  })

  it('fails to initialize', async () => {
    await expect(keeper.initialize(owner.address)).revertedWith(
      'Initializable: contract is already initialized'
    )
  })

  describe('register single validator', () => {
    let validator: Buffer
    let proof: string[]
    let signingData: any
    let approveParams: IKeeperValidators.ApprovalParamsStruct

    beforeEach(async () => {
      validator = validatorsData.validators[0]
      const exitSignatureIpfsHash = exitSignatureIpfsHashes[0]
      proof = getValidatorProof(validatorsData.tree, validator, 0)
      await vault.connect(sender).deposit(sender.address, { value: depositAmount })
      signingData = getEthValidatorsSigningData(
        validator,
        exitSignatureIpfsHash,
        oracles,
        vault,
        validatorsRegistryRoot
      )
      approveParams = {
        validatorsRegistryRoot,
        validators: validator,
        signatures: getSignatures(signingData, ORACLES.length),
        exitSignaturesIpfsHash: exitSignatureIpfsHash,
      }
    })

    it('fails for invalid vault', async () => {
      await expect(keeper.approveValidators(approveParams)).revertedWith('AccessDenied')
    })

    it('fails for invalid validators registry root', async () => {
      await validatorsRegistry.deposit(
        validator.subarray(0, 48),
        getWithdrawalCredentials(vault.address),
        validator.subarray(48, 144),
        validator.subarray(144, 176),
        { value: depositAmount }
      )
      await expect(vault.registerValidator(approveParams, proof)).revertedWith(
        'InvalidValidatorsRegistryRoot'
      )
    })

    it('fails for invalid signatures', async () => {
      await expect(
        vault.registerValidator(
          {
            ...approveParams,
            signatures: getSignatures(signingData, ORACLES.length - 1),
          },
          proof
        )
      ).revertedWith('NotEnoughSignatures')
    })

    it('fails for invalid validator', async () => {
      await expect(
        vault.registerValidator(
          {
            ...approveParams,
            validators: validatorsData.validators[1],
          },
          proof
        )
      ).revertedWith('InvalidOracle')
    })

    it('fails for invalid proof', async () => {
      await expect(
        vault.registerValidator(
          approveParams,
          getValidatorProof(validatorsData.tree, validatorsData.validators[1], 1)
        )
      ).revertedWith('InvalidProof')
    })

    it('succeeds', async () => {
      let rewardsSync = await keeper.rewards(vault.address)
      expect(rewardsSync.nonce).to.eq(0)
      expect(rewardsSync.reward).to.eq(0)

      let receipt = await vault.registerValidator(approveParams, proof)
      const timestamp = (await waffle.provider.getBlock(receipt.blockNumber as number)).timestamp
      await expect(receipt)
        .to.emit(keeper, 'ValidatorsApproval')
        .withArgs(
          vault.address,
          hexlify(validator),
          approveParams.exitSignaturesIpfsHash,
          timestamp
        )

      // collateralize vault
      rewardsSync = await keeper.rewards(vault.address)
      expect(rewardsSync.nonce).to.eq(1)
      expect(rewardsSync.reward).to.eq(0)

      await snapshotGasCost(receipt)

      const newValidatorsRegistryRoot = await validatorsRegistry.get_deposit_root()

      // fails to register twice
      await expect(vault.registerValidator(approveParams, proof)).revertedWith(
        'InvalidValidatorsRegistryRoot'
      )

      const newValidator = validatorsData.validators[1]
      const newExitSignatureIpfsHash = exitSignatureIpfsHashes[1]
      const newProof = getValidatorProof(validatorsData.tree, newValidator, 1)
      await vault.connect(sender).deposit(sender.address, { value: depositAmount })

      const newSigningData = getEthValidatorsSigningData(
        newValidator,
        newExitSignatureIpfsHash,
        oracles,
        vault,
        newValidatorsRegistryRoot
      )
      const newSignatures = getSignatures(newSigningData, ORACLES.length)
      receipt = await vault.registerValidator(
        {
          validatorsRegistryRoot: newValidatorsRegistryRoot,
          validators: newValidator,
          signatures: newSignatures,
          exitSignaturesIpfsHash: newExitSignatureIpfsHash,
        },
        newProof
      )

      // doesn't collateralize twice
      rewardsSync = await keeper.rewards(vault.address)
      expect(rewardsSync.nonce).to.eq(1)
      expect(rewardsSync.reward).to.eq(0)

      await snapshotGasCost(receipt)
    })
  })

  describe('register multiple validators', () => {
    let validators: Buffer[]
    let indexes: number[]
    let proof: ValidatorsMultiProof
    let signingData: any
    let approveParams: IKeeperValidators.ApprovalParamsStruct

    beforeEach(async () => {
      proof = getValidatorsMultiProof(validatorsData.tree, validatorsData.validators, [
        ...Array(validatorsData.validators.length).keys(),
      ])
      validators = validatorsData.validators
      const sortedVals = proof.leaves.map((v) => v[0])
      indexes = validators.map((v) => sortedVals.indexOf(v))
      await vault
        .connect(sender)
        .deposit(sender.address, { value: depositAmount.mul(validators.length) })
      const exitSignaturesIpfsHash = exitSignatureIpfsHashes[0]
      signingData = getEthValidatorsSigningData(
        Buffer.concat(validators),
        exitSignaturesIpfsHash,
        oracles,
        vault,
        validatorsRegistryRoot
      )
      approveParams = {
        validatorsRegistryRoot,
        validators: hexlify(Buffer.concat(validators)),
        signatures: getSignatures(signingData, ORACLES.length),
        exitSignaturesIpfsHash,
      }
    })

    it('fails for invalid vault', async () => {
      await expect(keeper.approveValidators(approveParams)).revertedWith('AccessDenied')
    })

    it('fails for invalid validators registry root', async () => {
      const validator = validators[0]
      await validatorsRegistry.deposit(
        validator.subarray(0, 48),
        getWithdrawalCredentials(vault.address),
        validator.subarray(48, 144),
        validator.subarray(144, 176),
        { value: depositAmount }
      )
      await expect(
        vault.registerValidators(approveParams, indexes, proof.proofFlags, proof.proof)
      ).revertedWith('InvalidValidatorsRegistryRoot')
    })

    it('fails for invalid signatures', async () => {
      await expect(
        vault.registerValidators(
          {
            ...approveParams,
            signatures: getSignatures(signingData, ORACLES.length - 1),
          },
          indexes,
          proof.proofFlags,
          proof.proof
        )
      ).revertedWith('NotEnoughSignatures')
    })

    it('fails for invalid validators', async () => {
      await expect(
        vault.registerValidators(
          {
            ...approveParams,
            validators: validators[0],
          },
          indexes,
          proof.proofFlags,
          proof.proof
        )
      ).revertedWith('InvalidOracle')
    })

    it('fails for invalid proof', async () => {
      const invalidProof = getValidatorsMultiProof(validatorsData.tree, [validators[0]], [0])
      const exitSignaturesIpfsHash = approveParams.exitSignaturesIpfsHash as string
      await expect(
        vault.registerValidators(
          {
            validatorsRegistryRoot,
            validators: validators[1],
            exitSignaturesIpfsHash,
            signatures: getSignatures(
              getEthValidatorsSigningData(
                validators[1],
                exitSignaturesIpfsHash,
                oracles,
                vault,
                validatorsRegistryRoot
              ),
              ORACLES.length
            ),
          },
          [0],
          invalidProof.proofFlags,
          invalidProof.proof
        )
      ).revertedWith('InvalidProof')
    })

    it('succeeds', async () => {
      let rewardsSync = await keeper.rewards(vault.address)
      expect(rewardsSync.nonce).to.eq(0)
      expect(rewardsSync.reward).to.eq(0)
      const validatorsConcat = Buffer.concat(validators)

      let receipt = await vault.registerValidators(
        approveParams,
        indexes,
        proof.proofFlags,
        proof.proof
      )
      const timestamp = (await waffle.provider.getBlock(receipt.blockNumber as number)).timestamp
      await expect(receipt)
        .to.emit(keeper, 'ValidatorsApproval')
        .withArgs(
          vault.address,
          hexlify(validatorsConcat),
          approveParams.exitSignaturesIpfsHash,
          timestamp
        )

      rewardsSync = await keeper.rewards(vault.address)
      expect(rewardsSync.nonce).to.eq(1)
      expect(rewardsSync.reward).to.eq(0)

      await snapshotGasCost(receipt)

      const newValidatorsRegistryRoot = await validatorsRegistry.get_deposit_root()

      // fails to register twice
      await expect(
        vault.registerValidators(approveParams, indexes, proof.proofFlags, proof.proof)
      ).revertedWith('InvalidValidatorsRegistryRoot')

      await vault
        .connect(sender)
        .deposit(sender.address, { value: depositAmount.mul(validators.length) })

      // reset validator index
      await vault.connect(admin).setValidatorsRoot(validatorsData.root)
      const newSigningData = getEthValidatorsSigningData(
        validatorsConcat,
        approveParams.exitSignaturesIpfsHash as string,
        oracles,
        vault,
        newValidatorsRegistryRoot
      )
      const newSignatures = getSignatures(newSigningData, ORACLES.length)
      receipt = await vault.registerValidators(
        {
          validatorsRegistryRoot: newValidatorsRegistryRoot,
          validators: validatorsConcat,
          signatures: newSignatures,
          exitSignaturesIpfsHash: approveParams.exitSignaturesIpfsHash,
        },
        indexes,
        proof.proofFlags,
        proof.proof
      )

      // doesn't collateralize twice
      rewardsSync = await keeper.rewards(vault.address)
      expect(rewardsSync.nonce).to.eq(1)
      expect(rewardsSync.reward).to.eq(0)

      await snapshotGasCost(receipt)
    })
  })
})
