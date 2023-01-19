// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import {IVersioned} from './IVersioned.sol';
import {IVaultImmutables} from './IVaultImmutables.sol';
import {IVaultAdmin} from './IVaultAdmin.sol';

interface IVaultVersion is IVaultImmutables, IVersioned, IVaultAdmin {
  /**
   * @notice Vault Unique Identifier
   * @return The unique identifier of the Vault
   */
  function vaultId() external pure returns (bytes32);
}