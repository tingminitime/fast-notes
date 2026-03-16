import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import NoteEditor from './NoteEditor.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('noteEditor', () => {
  it('renders title input', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('input#note-title').exists()).toBe(true)
  })

  it('emits save with empty title when not filled', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    await wrapper.find('textarea').setValue('My note')
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.emitted('save')?.[0]).toEqual(['My note', null, ''])
  })

  it('emits save with trimmed title when filled', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    await wrapper.find('input#note-title').setValue('  My Title  ')
    await wrapper.find('textarea').setValue('My note')
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.emitted('save')?.[0]).toEqual(['My note', null, 'My Title'])
  })

  it('renders SelectTrigger for category selection', async () => {
    const wrapper = mount(NoteEditor, {
      attachTo: document.body,
    })
    await nextTick()
    // SelectTrigger renders as role="combobox"
    expect(wrapper.find('[role="combobox"]').exists()).toBe(true)
  })

  it('defaults to null selectedCategoryId (Uncategorized)', async () => {
    const wrapper = mount(NoteEditor, {
      attachTo: document.body,
    })
    await nextTick()
    const trigger = wrapper.find('[role="combobox"]')
    // SelectValue placeholder shown when no value selected
    expect(trigger.text()).toContain('Uncategorized')
  })

  it('emits save with null categoryId when no category is selected', async () => {
    const wrapper = mount(NoteEditor, {
      attachTo: document.body,
    })
    await nextTick()

    await wrapper.find('textarea').setValue('My note')
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()

    expect(wrapper.emitted('save')?.[0]).toEqual(['My note', null, ''])
  })

  it('emits save with correct categoryId after selection', async () => {
    const categoriesStore = useCategoriesStore()
    categoriesStore.addCategory('Work')
    const catId = categoriesStore.categories[0].id

    const wrapper = mount(NoteEditor, {
      attachTo: document.body,
    })
    await nextTick()

    await wrapper.find('textarea').setValue('Work note')

    // Simulate SelectRoot v-model update
    const selectRoot = wrapper.findComponent({ name: 'SelectRoot' })
    await selectRoot.vm.$emit('update:modelValue', catId)
    await nextTick()

    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()

    expect(wrapper.emitted('save')?.[0]).toEqual(['Work note', catId, ''])
  })
})
