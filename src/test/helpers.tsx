import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { HashRouter } from 'react-router-dom';

// Custom render that includes providers
export function renderWithRouter(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return render(ui, {
    wrapper: ({ children }) => <HashRouter>{children}</HashRouter>,
    ...options,
  });
}

// Re-export testing library utilities for convenience
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';
