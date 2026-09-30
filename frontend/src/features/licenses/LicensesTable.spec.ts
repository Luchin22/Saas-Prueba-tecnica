import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import LicensesTable from './LicensesTable.vue'
import type { UserSummary } from '@/types/api'

function makeUsers(): UserSummary[] {
  return [
    {
      id: 'user-1',
      email: 'admin@acme.test',
      role: 'ADMIN',
      companyId: 'company-1',
      createdAt: new Date().toISOString(),
      hasActiveLicense: false,
    },
    {
      id: 'user-2',
      email: 'employee@acme.test',
      role: 'USER',
      companyId: 'company-1',
      createdAt: new Date().toISOString(),
      hasActiveLicense: true,
    },
  ]
}

describe('LicensesTable', () => {
  it('renders one row per user with the right license badge', () => {
    const wrapper = mount(LicensesTable, { props: { users: makeUsers() } })

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(wrapper.text()).toContain('Activa')
    expect(wrapper.text()).toContain('Sin licencia')
  })

  it('emits assign with the user id when the button is clicked', async () => {
    const wrapper = mount(LicensesTable, { props: { users: makeUsers() } })

    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')

    expect(wrapper.emitted('assign')).toEqual([['user-1']])
  })

  it('disables the assign button for users that already have a license', () => {
    const wrapper = mount(LicensesTable, { props: { users: makeUsers() } })

    const buttons = wrapper.findAll('button')
    expect((buttons[1]!.element as HTMLButtonElement).disabled).toBe(true)
  })

  it('filters rows via the search input', async () => {
    const wrapper = mount(LicensesTable, { props: { users: makeUsers() } })

    await wrapper.find('input[type="search"]').setValue('employee')

    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(1)
    expect(wrapper.text()).toContain('employee@acme.test')
  })

  it('shows an empty state when no user matches the search', async () => {
    const wrapper = mount(LicensesTable, { props: { users: makeUsers() } })

    await wrapper.find('input[type="search"]').setValue('nobody')

    expect(wrapper.text()).toContain('Sin resultados')
  })
})
