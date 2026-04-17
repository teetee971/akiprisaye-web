import { render, screen } from '@testing-library/react';
import SignalementForm from '../SignalementForm';

describe('SignalementForm', () => {
  it('renders form with required fields', () => {
    render(<SignalementForm />);

    expect(screen.getByText(/Signaler un prix observé/i)).toBeInTheDocument();

    const matches = screen.getAllByText((content) =>
      content.includes('pas publiées automatiquement')
    );
    expect(matches.length).toBeGreaterThan(0);
  });
});
