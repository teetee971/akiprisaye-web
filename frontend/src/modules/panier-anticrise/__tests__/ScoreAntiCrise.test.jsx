import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import { ScoreAntiCrise } from '../ScoreAntiCrise';

describe('ScoreAntiCrise', () => {
  it('renders score value correctly', () => {
    render(<ScoreAntiCrise score={82} />);
    expect(screen.getByText('82')).toBeDefined();
  });

  it('displays correct label for excellent score', () => {
    render(<ScoreAntiCrise score={85} />);
    expect(screen.getByText('Excellent')).toBeDefined();
  });

  it('displays correct label for good score', () => {
    render(<ScoreAntiCrise score={65} />);
    expect(screen.getByText('Bon')).toBeDefined();
  });

  it('displays correct label for medium score', () => {
    render(<ScoreAntiCrise score={45} />);
    expect(screen.getByText('Moyen')).toBeDefined();
  });

  it('displays correct label for low score', () => {
    render(<ScoreAntiCrise score={25} />);
    expect(screen.getByText('Faible')).toBeDefined();
  });

  it('displays trend indicator', () => {
    const { container } = render(<ScoreAntiCrise score={80} trend="up" />);
    expect(container.textContent).toContain('↑');
  });
});
