import { describe, expect, it } from 'vitest'
import { decrypt, deriveKey, encrypt } from './crypto'

describe('deriveKey(passphrase, uid)', () => {
  it('returns a CryptoKey object', async () => {
    const key = await deriveKey('my-passphrase', 'user-123')
    expect(key).toBeInstanceOf(CryptoKey)
  })

  it('is deterministic — same inputs produce keys that decrypt each other\'s ciphertext', async () => {
    const keyA = await deriveKey('secret', 'uid-abc')
    const keyB = await deriveKey('secret', 'uid-abc')
    const { iv, ciphertext } = await encrypt(keyA, 'verification-payload')
    const result = await decrypt(keyB, iv, ciphertext)
    expect(result).toBe('verification-payload')
  })

  it('different passphrase → decryption fails', async () => {
    const keyA = await deriveKey('correct-passphrase', 'uid-abc')
    const keyB = await deriveKey('wrong-passphrase', 'uid-abc')
    const { iv, ciphertext } = await encrypt(keyA, 'secret data')
    await expect(decrypt(keyB, iv, ciphertext)).rejects.toThrow()
  })

  it('different uid (salt) → decryption fails', async () => {
    const keyA = await deriveKey('same-passphrase', 'uid-alice')
    const keyB = await deriveKey('same-passphrase', 'uid-bob')
    const { iv, ciphertext } = await encrypt(keyA, 'secret data')
    await expect(decrypt(keyB, iv, ciphertext)).rejects.toThrow()
  })
})

describe('encrypt', () => {
  it('returns an object with iv and ciphertext as base64 strings', async () => {
    const key = await deriveKey('pass', 'uid-test')
    const result = await encrypt(key, 'plaintext')
    expect(typeof result.iv).toBe('string')
    expect(typeof result.ciphertext).toBe('string')
    expect(() => atob(result.iv)).not.toThrow()
    expect(() => atob(result.ciphertext)).not.toThrow()
  })

  it('does not include plaintext in the ciphertext output', async () => {
    const key = await deriveKey('pass', 'uid-test')
    const plaintext = 'supersecret'
    const { ciphertext } = await encrypt(key, plaintext)
    expect(ciphertext).not.toContain(plaintext)
    expect(atob(ciphertext)).not.toContain(plaintext)
  })
})

describe('decrypt', () => {
  it('correctly decrypts encrypted plaintext', async () => {
    const key = await deriveKey('pass', 'uid-test')
    const plaintext = 'Hello, World!'
    const { iv, ciphertext } = await encrypt(key, plaintext)
    const result = await decrypt(key, iv, ciphertext)
    expect(result).toBe(plaintext)
  })

  it('throws when decrypting with wrong key', async () => {
    const correctKey = await deriveKey('correct', 'uid-correct')
    const wrongKey = await deriveKey('wrong', 'uid-wrong')
    const { iv, ciphertext } = await encrypt(correctKey, 'secret data')
    await expect(decrypt(wrongKey, iv, ciphertext)).rejects.toThrow()
  })
})
