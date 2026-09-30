import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import LicensesView from './LicensesView.vue'
import * as licensesApi from '@/services/licenses.api'

vi.mock('@/services/licenses.api')

function user(overrides: Partial<{ id: string; email: string; hasActiveLicense: boolean }> = {}) {
  return {
    id: 'user-1',
    email: 'employee@acme.test',
    role: 'USER' as const,
    companyId: 'company-1',
    createdAt: new Date().toISOString(),
    hasActiveLicense: false,
    ...overrides,
  }
}

describe('LicensesView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  it('loads users on mount and renders the table', async () => {
    vi.mocked(licensesApi.fetchUsers).mockResolvedValue([user()])

    const wrapper = mount(LicensesView)
    await flushPromises()

    expect(licensesApi.fetchUsers).toHaveBeenCalled()
    expect(wrapper.text()).toContain('employee@acme.test')
  })

  it('creates a new employee from the form and shows a success message', async () => {
    vi.mocked(licensesApi.fetchUsers).mockResolvedValue([])
    vi.mocked(licensesApi.createEmployee).mockResolvedValue(user({ email: 'new@acme.test' }))

    const wrapper = mount(LicensesView)
    await flushPromises()

    await wrapper.find('input[type="email"]').setValue('new@acme.test')
    await wrapper.find('input[type="password"]').setValue('Password123!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(licensesApi.createEmployee).toHaveBeenCalledWith('new@acme.test', 'Password123!')
    expect(wrapper.text()).toContain('Empleado creado correctamente')
  })

  it('shows an error message when assigning a license fails', async () => {
    vi.mocked(licensesApi.fetchUsers).mockResolvedValue([user()])
    vi.mocked(licensesApi.assignLicense).mockRejectedValue(new Error('límite alcanzado'))

    const wrapper = mount(LicensesView)
    await flushPromises()

    await wrapper.find('button.border-brand-600').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('No se pudo asignar la licencia')
  })
})
