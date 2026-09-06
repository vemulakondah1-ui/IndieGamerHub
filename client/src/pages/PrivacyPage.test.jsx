import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PrivacyPage from './PrivacyPage';

describe('PrivacyPage', () => {
  it('renders the privacy policy heading and section headings', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('heading', { level: 1, name: /privacy policy/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /data we store/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /third-party game data/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /contact/i })).toBeInTheDocument();
  });
});
