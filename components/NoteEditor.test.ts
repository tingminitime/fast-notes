import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import NoteEditor from './NoteEditor.vue'

vi.mock('@tiptap/vue-3', () => {
  const EditorContent = defineComponent({
    name: 'EditorContent',
    props: ['editor'],
    setup: () => () => h('div', { 'data-testid': 'editor-content' }),
  })

  function useEditor(options: any) {
    const content = ref(options?.content ?? '')
    return ref({
      getHTML: () => content.value,
      commands: {
        setContent: (val: string, _emitUpdate = true) => {
          content.value = val
        },
      },
      destroy: vi.fn(),
    })
  }

  return { useEditor, EditorContent }
})

vi.mock('@tiptap/starter-kit', () => ({ default: {} }))

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

  it('renders editor content area', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('[data-testid="editor-content"]').exists()).toBe(true)
  })

  it('emits save with empty title when not filled', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    wrapper.vm.editorHtml = '<p>My note</p>'
    await nextTick()
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.emitted('save')?.[0]).toEqual(['<p>My note</p>', null, ''])
  })

  it('emits save with trimmed title when filled', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    await wrapper.find('input#note-title').setValue('  My Title  ')
    wrapper.vm.editorHtml = '<p>My note</p>'
    await nextTick()
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.emitted('save')?.[0]).toEqual(['<p>My note</p>', null, 'My Title'])
  })

  it('shows error when editor content is empty', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    wrapper.vm.editorHtml = ''
    await nextTick()
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Note cannot be empty')
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('shows error when editor content is Tiptap empty paragraph', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    wrapper.vm.editorHtml = '<p></p>'
    await nextTick()
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.text()).toContain('Note cannot be empty')
    expect(wrapper.emitted('save')).toBeUndefined()
  })

  it('clears editor after successful save in non-editing mode', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    wrapper.vm.editorHtml = '<p>My note</p>'
    await nextTick()
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.vm.editorHtml).toBe('')
  })

  it('renders SelectTrigger for category selection', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    expect(wrapper.find('[role="combobox"]').exists()).toBe(true)
  })

  it('defaults to null selectedCategoryId (Uncategorized)', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    const trigger = wrapper.find('[role="combobox"]')
    expect(trigger.text()).toContain('Uncategorized')
  })

  it('emits save with null categoryId when no category is selected', async () => {
    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    wrapper.vm.editorHtml = '<p>My note</p>'
    await nextTick()
    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()
    expect(wrapper.emitted('save')?.[0]).toEqual(['<p>My note</p>', null, ''])
  })

  it('emits save with correct categoryId after selection', async () => {
    const categoriesStore = useCategoriesStore()
    categoriesStore.addCategory('Work')
    const catId = categoriesStore.categories[0].id

    const wrapper = mount(NoteEditor, { attachTo: document.body })
    await nextTick()
    wrapper.vm.editorHtml = '<p>Work note</p>'

    const selectRoot = wrapper.findComponent({ name: 'SelectRoot' })
    await selectRoot.vm.$emit('update:modelValue', catId)
    await nextTick()

    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Add Note')
    await saveBtn?.trigger('click')
    await nextTick()

    expect(wrapper.emitted('save')?.[0]).toEqual(['<p>Work note</p>', catId, ''])
  })
})
