import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UsageChart from './UsageChart.vue'

describe('UsageChart', () => {
  it('shows an empty-state message when there is no history yet', () => {
    const wrapper = mount(UsageChart, { props: { history: [] } })

    expect(wrapper.text()).toContain('Aún no hay datos de consumo')
    expect(wrapper.findComponent({ name: 'Line' }).exists()).toBe(false)
  })

  it('renders the chart once history data is available', () => {
    const wrapper = mount(UsageChart, {
      props: { history: [{ date: '2026-01-01', count: 10 }] },
    })

    expect(wrapper.text()).not.toContain('Aún no hay datos de consumo')
  })
})
