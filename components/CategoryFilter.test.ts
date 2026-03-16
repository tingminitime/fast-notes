import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useCategoriesStore } from '../stores/categories'
import CategoryFilter from './CategoryFilter.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

afterEach(() => {
  document.body.innerHTML = ''
})

describe('categoryFilter', () => {
  it('renders the "All" button and one item per category', async () => {
    const categoriesStore = useCategoriesStore()
    categoriesStore.addCategory('Work')
    categoriesStore.addCategory('Personal')

    const wrapper = mount(CategoryFilter, {
      props: { modelValue: null },
      attachTo: document.body,
    })
    await nextTick()

    const items = wrapper.findAll('[data-testid="filter-item"]')
    // "All" + 2 categories
    expect(items).toHaveLength(3)
    expect(items[0].text()).toBe('All')
    expect(items[1].text()).toBe('Work')
    expect(items[2].text()).toBe('Personal')
  })

  it('sets "All" item to active state when modelValue is null', async () => {
    const categoriesStore = useCategoriesStore()
    categoriesStore.addCategory('Work')

    const wrapper = mount(CategoryFilter, {
      props: { modelValue: null },
      attachTo: document.body,
    })
    await nextTick()

    const allItem = wrapper.find('[data-testid="filter-item"][value="all"]')
    expect(allItem.attributes('data-state')).toBe('on')
  })

  it('emits update:modelValue with categoryId when a category item is clicked', async () => {
    const categoriesStore = useCategoriesStore()
    categoriesStore.addCategory('Work')
    const catId = categoriesStore.categories[0].id

    const wrapper = mount(CategoryFilter, {
      props: { modelValue: null },
      attachTo: document.body,
    })
    await nextTick()

    const catItem = wrapper.find(`[data-testid="filter-item"][value="${catId}"]`)
    await catItem.trigger('click')
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([catId])
  })

  it('emits update:modelValue with null when the "All" item is clicked', async () => {
    const categoriesStore = useCategoriesStore()
    categoriesStore.addCategory('Work')
    const catId = categoriesStore.categories[0].id

    const wrapper = mount(CategoryFilter, {
      props: { modelValue: catId },
      attachTo: document.body,
    })
    await nextTick()

    const allItem = wrapper.find('[data-testid="filter-item"][value="all"]')
    await allItem.trigger('click')
    await nextTick()

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([null])
  })
})
