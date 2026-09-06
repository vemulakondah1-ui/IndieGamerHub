import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Footer from './Footer';

describe('Footer', () => {
  it('renders the disclaimer text and a link to /privacy', () => {
    render(<Footer />);
    expect(screen.getByText(/independent fan project/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /privacy policy/i });
    expect(link).toHaveAttribute('href', '/privacy');
  });
});
