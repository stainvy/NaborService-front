import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card } from './Card';
import { Skeleton } from './Skeleton';
import { EmptyState } from './EmptyState';

describe('UI primitives', () => {
  it('Card rend ses enfants et applique le survol en variante interactive', () => {
    const { container } = render(
      <Card variant="interactive">
        <span>contenu</span>
      </Card>,
    );
    expect(screen.getByText('contenu')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('hover:shadow-card');
  });

  it('Skeleton est un placeholder animé', () => {
    const { container } = render(<Skeleton className="h-4 w-10" />);
    expect(container.firstChild).toHaveClass('animate-pulse');
  });

  it('EmptyState affiche titre et description', () => {
    render(<EmptyState title="Rien ici" description="Revenez plus tard" />);
    expect(screen.getByText('Rien ici')).toBeInTheDocument();
    expect(screen.getByText('Revenez plus tard')).toBeInTheDocument();
  });
});
