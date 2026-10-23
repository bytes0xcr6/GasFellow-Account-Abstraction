'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const unlocked = new Map();

// Legacy variable names identify roles only. Their values are never read.
function accountVariable(role) {
  if (role === 'PRIVATE_KEY') return 'ETH_KEYSTORE_ACCOUNT';
  return role.replace(/PRIVATE_KEY|SECRET_KEY|MNEMONIC|_PK$/, match => match === '_PK' ? '_KEYSTORE_ACCOUNT' : 'KEYSTORE_ACCOUNT');
}

function loadPrivateKey(role = 'PRIVATE_KEY', required = true) {
  const selector = accountVariable(role);
  const fileSelector = selector.replace('KEYSTORE_ACCOUNT', 'KEYSTORE');
  const account = process.env[selector];
  const selectedFile = process.env[fileSelector];
  if (!account && !selectedFile) {
    if (!required) return undefined;
    throw new Error(`No encrypted signer configured: set ${selector} or ${fileSelector}. Raw ${role} is unsupported.`);
  }
  if (account && (account === '.' || account === '..' || /[\\/]/.test(account))) {
    throw new Error(`${selector} must be an account name; use ${fileSelector} for a file path.`);
  }
  const file = account ? path.join(os.homedir(), '.foundry', 'keystores', account) : path.resolve(selectedFile);
  if (unlocked.has(file)) return unlocked.get(file);
  let key;
  if (process.env.ETH_PASSWORD) {
    // ETH_PASSWORD follows Foundry: a password FILE path, never the password.
    // Decrypt in-process so neither secret reaches argv, env, or a temporary file.
    try {
      const { Wallet } = require('ethers');
      const password = fs.readFileSync(process.env.ETH_PASSWORD, 'utf8').replace(/[\r\n]+$/, '');
      const wallet = Wallet.fromEncryptedJsonSync(fs.readFileSync(file, 'utf8'), password);
      key = wallet.privateKey;
    } catch (_) {
      throw new Error(`Cannot unlock ${selector}: check the keystore and ETH_PASSWORD file.`);
    }
  } else {
    if (!process.stdin.isTTY || !process.stderr.isTTY) {
      throw new Error(`${selector} requires ETH_PASSWORD pointing to a mounted password file in noninteractive runs.`);
    }
    try {
      // cast owns the hidden TTY password prompt. Its decrypted stdout is captured
      // only in memory; never inherit stdout or rethrow the child-process error.
      const output = execFileSync('cast', ['wallet', 'decrypt-keystore', path.basename(file), '--keystore-dir', path.dirname(file)], {
        encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'], windowsHide: true,
      });
      const match = output.match(/\b(?:0x)?[a-fA-F0-9]{64}\b/);
      if (!match) throw new Error('No key returned');
      key = match[0].startsWith('0x') ? match[0] : `0x${match[0]}`;
    } catch (_) {
      throw new Error(`Cannot unlock ${selector} with cast; no other signer was tried.`);
    }
  }
  if (!/^0x[a-fA-F0-9]{64}$/.test(key)) throw new Error(`Invalid decrypted signer for ${selector}.`);
  unlocked.set(file, key);
  return key;
}

exports.loadPrivateKey = loadPrivateKey;
exports.accountVariable = accountVariable;

function loadPrivateKeys(...roles) {
  const keys = roles.map(role => loadPrivateKey(role, false));
  if (keys.every(key => key === undefined)) return [];
  if (keys.some(key => key === undefined)) throw new Error('Configure every signer role in this network account list; account positions must not change.');
  return keys;
}
exports.loadPrivateKeys = loadPrivateKeys;
