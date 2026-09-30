import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UsageKpiCard from './UsageKpiCard.vue'

describe('UsageKpiCard', () => {
  it('renders the totals and percentage label', () => {
    const wrapper = mount(UsageKpiCard, {
      props: { totalCalls: 400, usageLimit: 1000, percentageLabel: '40%', alertActive: false },
    })

    expect(wrapper.text()).toContain('400')
    expect(wrapper.text()).toContain('1,000')
    expect(wrapper.text()).toContain('40%')
    expect(wrapper.text()).not.toContain('Alerta de consumo alto')
  })

  it('shows the alert styling and message once the threshold is crossed', () => {
    const wrapper = mount(UsageKpiCard, {
      props: { totalCalls: 900, usageLimit: 1000, percentageLabel: '90%', alertActive: true },
    })

    expect(wrapper.text()).toContain('Alerta de consumo alto')
    expect(wrapper.find('div.rounded-xl').classes()).toContain('border-amber-300')
  })
})
