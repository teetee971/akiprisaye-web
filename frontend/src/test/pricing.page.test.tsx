import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import '@testing-library/jest-dom/vitest'
import PricingPage from '../pages/Pricing'

describe('Pricing page', () => {
  it('explains CPC click commissions are not active in FAQ', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      </HelmetProvider>,
    )

    const question = /les clics cpc \/ commissions sont-ils activés/i
    const answer = /les commissions au clic ne sont pas activées actuellement/i

    expect(screen.getByRole('button', { name: question })).toBeInTheDocument()
    expect(screen.queryByText(answer)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: question }))

    expect(screen.getByText(answer)).toBeInTheDocument()
  })
})
