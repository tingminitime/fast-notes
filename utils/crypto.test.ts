import { describe, expect, it } from 'vitest'
import { decrypt, deriveKey, encrypt } from './crypto'

describe('deriveKey', () => {
  it('returns a CryptoKey object', async () => {
    const key = await deriveKey('test-uid')
    expect(key).toBeInstanceOf(CryptoKey)
  })

  it('produces a deterministic key for the same uid (verified via round-trip)', async () => {
    const key1 = await deriveKey('user-abc')
    const key2 = await deriveKey('user-abc')
    const { iv, ciphertext } = await encrypt(key1, 'verification-payload')
    const result = await decrypt(key2, iv, ciphertext)
    expect(result).toBe('verification-payload')
  })
})

describe('encrypt', () => {
  it('returns an object with iv and ciphertext as base64 strings', async () => {
    const key = await deriveKey('uid-test')
    const result = await encrypt(key, 'plaintext')
    expect(typeof result.iv).toBe('string')
    expect(typeof result.ciphertext).toBe('string')
    expect(() => atob(result.iv)).not.toThrow()
    expect(() => atob(result.ciphertext)).not.toThrow()
  })

  it('does not include plaintext in the ciphertext output', async () => {
    const key = await deriveKey('uid-test')
    const plaintext = 'supersecret'
    const { ciphertext } = await encrypt(key, plaintext)
    expect(ciphertext).not.toContain(plaintext)
    expect(atob(ciphertext)).not.toContain(plaintext)
  })
})

describe('decrypt', () => {
  it('correctly decrypts encrypted plaintext', async () => {
    const key = await deriveKey('uid-test')
    const plaintext = 'Hello, World!'
    const { iv, ciphertext } = await encrypt(key, plaintext)
    const result = await decrypt(key, iv, ciphertext)
    expect(result).toBe(plaintext)
  })

  it('throws when decrypting with wrong key', async () => {
    const correctKey = await deriveKey('uid-correct')
    const wrongKey = await deriveKey('uid-wrong')
    const { iv, ciphertext } = await encrypt(correctKey, 'secret data')
    await expect(decrypt(wrongKey, iv, ciphertext)).rejects.toThrow()
  })
})
