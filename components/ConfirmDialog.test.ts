import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import ConfirmDialog from './ConfirmDialog.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('confirmDialog', () => {
  it('does not display dialog when open is false', async () => {
    mount(ConfirmDialog, {
      props: { open: false, title: 'Test', message: 'Are you sure?' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.querySelector('[role="alertdialog"]')).toBeNull()
  })

  it('renders title and message when open is true', async () => {
    mount(ConfirmDialog, {
      props: { open: true, title: 'Confirm Delete', message: 'This cannot be undone.' },
      attachTo: document.body,
    })
    await nextTick()
    expect(document.body.textContent).toContain('Confirm Delete')
    expect(document.body.textContent).toContain('This cannot be undone.')
  })

  it('emits confirm when confirm button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { open: true, title: 'Delete', message: 'Delete this?' },
      attachTo: document.body,
    })
    await nextTick()
    const btn = document.querySelector('[data-testid="confirm-btn"]') as HTMLElement
    btn?.click()
    await nextTick()
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })

  it('emits cancel when cancel button is clicked', async () => {
    const wrapper = mount(ConfirmDialog, {
      props: { open: true, title: 'Delete', message: 'Delete this?' },
      attachTo: document.body,
    })
    await nextTick()
    const btn = document.querySelector('[data-testid="cancel-btn"]') as HTMLElement
    btn?.click()
    await nextTick()
    expect(wrapper.emitted('cancel')).toBeTruthy()
  })
})
