import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import DashboardView from './DashboardView.vue'
import * as usageApi from '@/services/usage.api'

vi.mock('@/services/usage.api')

describe('DashboardView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('fetches usage on mount and renders the KPI card', async () => {
    vi.mocked(usageApi.fetchUsage).mockResolvedValue({
      totalCalls: 100,
      usageLimit: 1000,
      percentage: 0.1,
      alertThreshold: 0.8,
      history: [],
    })

    const wrapper = mount(DashboardView)
    await flushPromises()

    expect(usageApi.fetchUsage).toHaveBeenCalled()
    expect(wrapper.text()).toContain('100')
  })

  it('calls simulate() when the button is clicked', async () => {
    vi.mocked(usageApi.fetchUsage).mockResolvedValue({
      totalCalls: 0,
      usageLimit: 1000,
      percentage: 0,
      alertThreshold: 0.8,
      history: [],
    })
    vi.mocked(usageApi.simulateUsage).mockResolvedValue({
      totalCalls: 20,
      usageLimit: 1000,
      percentage: 0.02,
      alertThreshold: 0.8,
      history: [],
    })

    const wrapper = mount(DashboardView)
    await flushPromises()

    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(usageApi.simulateUsage).toHaveBeenCalled()
    expect(wrapper.text()).toContain('20')
  })
})
