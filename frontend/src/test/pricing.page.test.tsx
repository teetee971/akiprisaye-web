import { describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import '@testing-library/jest-dom/vitest'
import PricingPage from '../pages/Pricing'

describe('Pricing page', () => {
  it('explains contributor remuneration systems in FAQ', () => {
    render(
      <HelmetProvider>
        <MemoryRouter>
          <PricingPage />
        </MemoryRouter>
      </HelmetProvider>,
    )

    const question = /quels systèmes de rémunération avez-vous mis en place pour les contributeurs/i
    const answer = /trois systèmes de rémunération/i

    expect(screen.getByRole('button', { name: question })).toBeInTheDocument()
    expect(screen.queryByText(answer)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: question }))

    expect(screen.getByText(answer)).toBeInTheDocument()
  })
})
