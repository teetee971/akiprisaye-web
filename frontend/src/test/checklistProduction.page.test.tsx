import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import '@testing-library/jest-dom/vitest';
import ChecklistProduction from '../pages/ChecklistProduction';

describe('ChecklistProduction page', () => {
  it('indicates clearly what remains to finish the site', () => {
    render(
      <HelmetProvider>
        <ChecklistProduction />
      </HelmetProvider>,
    );

    expect(
      screen.getByText((_, element) => {
        if (!element || element.tagName.toLowerCase() !== 'p') return false;
        const content = element.textContent?.replace(/\s+/g, ' ').trim() ?? '';
        return /^Il reste \d+ tâches? pour finir le site, dont \d+ critiques?\.$/i.test(content);
      }),
    ).toBeInTheDocument();
  });
});
