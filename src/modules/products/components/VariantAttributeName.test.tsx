import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import i18n from '@/config/i18'
import { FormWrapper } from '@/components/core/FormWrapper'
import { VariantAttributeName } from './VariantAttributeName'

function renderField(key = '') {
  const submit = vi.fn()
  render(
    <FormWrapper defaultValues={{ key }} onSubmit={submit}>
      <VariantAttributeName name="key" />
      <button type="submit">Save</button>
    </FormWrapper>
  )
  return submit
}

describe('VariantAttributeName', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    Element.prototype.scrollIntoView = vi.fn()
  })

  it.each([
    ['ar', 'اللون', 'اللون', 'color'],
    ['en', 'اللون', 'Color', 'color'],
    ['ar', 'Stone Type', 'نوع الحجر', 'stone_type'],
    ['en', 'flower_color', 'Flower Color', 'flower_color'],
  ])('searches %s labels using %s and stores the key', async (language, search, label, key) => {
    await i18n.changeLanguage(language)
    const user = userEvent.setup()
    renderField()
    const input = screen.getByRole('combobox')
    await user.type(input, search)
    await user.click(screen.getByRole('option', { name: label }))
    expect(input).toHaveValue(key)
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: label })).toHaveAttribute('aria-selected', 'true')
  })

  it.each(['خاصية مخصصة', ' My Custom Key ', 'Color'])('keeps custom key %s exactly on submission', async (key) => {
    const user = userEvent.setup()
    const submit = renderField()
    await user.type(screen.getByRole('combobox'), key)
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(submit).toHaveBeenCalledWith({ key }, expect.anything(), expect.anything())
  })

  it('allows editing a persisted custom key and uses arrows/Enter without submitting', async () => {
    const user = userEvent.setup()
    const submit = renderField(' Legacy Key ')
    const input = screen.getByRole('combobox', { name: 'Attribute Name' })
    expect(input).toHaveValue(' Legacy Key ')
    await user.clear(input)
    await user.type(input, 'المقاس')
    await user.keyboard('{ArrowDown}{Enter}')
    expect(input).toHaveValue('size')
    expect(submit).not.toHaveBeenCalled()
    await user.keyboard('{ArrowDown}{Escape}')
    expect(input).toHaveAttribute('aria-expanded', 'false')
    expect(input).toHaveFocus()
  })

  it('exposes all twenty localized suggestions and ignores Enter while composing', async () => {
    const user = userEvent.setup()
    renderField()
    const input = screen.getByRole('combobox')
    await user.click(input)
    expect(screen.getAllByRole('option')).toHaveLength(20)
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true })
    expect(input).toHaveValue('')
    await user.tab()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })
})
