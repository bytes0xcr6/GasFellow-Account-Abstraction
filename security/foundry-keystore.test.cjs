const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

test('Foundry V3 keystore unlock, fail closed, and no raw env fallback', async () => {
  const ethers = require('ethers');
  const { loadPrivateKey, loadPrivateKeys } = await import(pathToFileURL(path.join(__dirname, 'foundry-keystore.js')).href);
  const names = ['PRIVATE_KEY', 'ETH_KEYSTORE_ACCOUNT', 'ETH_KEYSTORE', 'ETH_PASSWORD'];
  const previous = new Map(names.map(n => [n, process.env[n]]));
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'keystore-test-'));
  try {
    for (const n of names) delete process.env[n];
    process.env.PRIVATE_KEY = 'RAW_VALUE_MUST_NEVER_BE_USED';
    assert.equal(loadPrivateKey('PRIVATE_KEY', false), undefined);
    assert.deepEqual(loadPrivateKeys('PRIVATE_KEY', 'SECOND_PRIVATE_KEY'), []);
    assert.throws(() => loadPrivateKey(), /No encrypted signer configured/);
    process.env.ETH_KEYSTORE_ACCOUNT = '../escape';
    assert.throws(() => loadPrivateKey(), /must be an account name/);
    delete process.env.ETH_KEYSTORE_ACCOUNT;
    const wallet = ethers.Wallet.createRandom();
    const password = 'temporary test password';
    const json = ethers.encryptKeystoreJsonSync
      ? ethers.encryptKeystoreJsonSync({ address: wallet.address, privateKey: wallet.privateKey }, password, { scrypt: { N: 1024, r: 8, p: 1 } })
      : await wallet.encrypt(password, { scrypt: { N: 1024, r: 8, p: 1 } });
    const file = path.join(dir, 'wallet.json');
    const pw = path.join(dir, 'password');
    fs.writeFileSync(file, json, { mode: 0o600 });
    fs.writeFileSync(pw, 'wrong password', { mode: 0o600 });
    process.env.ETH_KEYSTORE = file;
    process.env.ETH_PASSWORD = pw;
    assert.throws(() => loadPrivateKey(), /Cannot unlock/);
    fs.writeFileSync(pw, password + '\r\n');
    assert.equal(loadPrivateKey(), wallet.privateKey);
    assert.throws(() => loadPrivateKeys('PRIVATE_KEY', 'SECOND_PRIVATE_KEY'), /every signer role/);
    process.env.ETH_KEYSTORE = path.join(dir, 'missing.json');
    assert.throws(() => loadPrivateKey(), /Cannot unlock/);
  } finally {
    for (const [name, value] of previous) value === undefined ? delete process.env[name] : process.env[name] = value;
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
