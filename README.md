# Fast Notes

**Take notes fast. Never lose a thought.**

Fast Notes is a browser extension that gives you a persistent side panel for capturing and organizing notes as you browse. Notes are grouped into categories and edited with a rich text editor — everything stays in sync across sessions via Firebase, with end-to-end encryption so only you can read your data.

Built with Vue 3, WXT, Pinia, and Tailwind CSS.

## End-to-End Encryption

All notes and categories are encrypted on your device before being stored in the cloud. The server never sees your plaintext data.

### How it works

When you sign in for the first time, you choose a **passphrase**. This passphrase is used to derive an encryption key locally using PBKDF2 (a standard key-derivation function). The key is used to encrypt every note and category with AES-GCM 256-bit encryption before it leaves your device.

On subsequent sign-ins, you enter your passphrase again to unlock your data. The passphrase is cached locally so you only need to enter it once per browser session.

### What this means for you

- **Only you can read your notes.** Without your passphrase, the encrypted data stored in Firebase is unreadable — even to us.
- **Your passphrase is never transmitted.** It exists only on your device. There is no "forgot password" recovery mechanism because we have no way to decrypt your data on your behalf.
- **If you lose your passphrase, your data cannot be recovered.** You can reset your account, which permanently deletes all encrypted data and lets you start fresh with a new passphrase.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar).
