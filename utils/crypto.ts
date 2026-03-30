export async function deriveKey(passphrase: string, uid: string): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey'],
  )
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(uid),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<{ iv: string, ciphertext: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext),
  )
  return {
    iv: btoa(String.fromCharCode(...iv)),
    ciphertext: btoa(String.fromCharCode(...new Uint8Array(encrypted))),
  }
}

export async function decrypt(key: CryptoKey, iv: string, ciphertext: string): Promise<string> {
  const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0))
  const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0))
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes },
    key,
    ciphertextBytes,
  )
  return new TextDecoder().decode(decrypted)
}
