# Encrypted signing accounts

Raw private key environment values are no longer used by the migrated Node entry points.
Import each EVM signing key from a trusted terminal:

```sh
cast wallet import <account-name> --interactive
```

Use the hidden prompts; never pass a key or password on the command line. Select
accounts under `~/.foundry/keystores/` with these nonsecret variables:

| Previous raw variable (unsupported) | Account name selector |
| --- | --- |
| `BUNDLER_PRIVATE_KEY` | `BUNDLER_KEYSTORE_ACCOUNT` |
| `SMART_WALLET_OWNER_PRIVATE_KEY` | `SMART_WALLET_OWNER_KEYSTORE_ACCOUNT` |

Each selector also accepts a full file path through its `_KEYSTORE` counterpart
(replace `KEYSTORE_ACCOUNT` with `KEYSTORE`). A selected account that fails to
unlock is an error: no raw key or alternative identity is tried.

The CLI uses `cast wallet decrypt-keystore` for its hidden password prompt and
captures the result in memory. Install Foundry before interactive use. Unattended
services require `ETH_PASSWORD` to be a mounted password **file path**; decryption
uses the project's `ethers` Wallet API in process. Mount keystores and password
files read-only, separately, with access restricted to the service identity.
Never put keys or passwords in `.env`, CI variables, logs or container images.

Remove legacy raw variables from local `.env`, shell startup files, CI and deployed
secret payloads after verifying imported public addresses. Provision these files
before deploying this change; old raw-only configurations fail closed. Rotate
keys that were committed or exposed; encryption does not revoke earlier copies.

Hardhat network accounts remain empty when no keystore is selected, allowing
read-only compilation and local tests. A network operation needing a signer
requires its account selector. Decrypted private material exists only in process
memory for the duration of the run.
