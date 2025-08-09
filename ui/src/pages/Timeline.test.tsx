/* @vitest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Timeline } from './Timeline';
import { afterEach, describe, expect, it, vi } from 'vitest';

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={["/capsule/123"]}>
      <Routes>
        <Route path="/capsule/:id" element={<Timeline />} />
      </Routes>
    </MemoryRouter>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Timeline component', () => {
  it('shows spinner while loading', async () => {
    let resolveFetch: any;
    vi.spyOn(global, 'fetch').mockImplementation(
      () =>
        new Promise(resolve => {
          resolveFetch = resolve;
        }) as any
    );
    renderWithRouter();
    expect(screen.getByTestId('loading-spinner')).toBeTruthy();
    resolveFetch({
      ok: true,
      json: () => Promise.resolve({ title: 'Event', items: [] })
    });
    await waitFor(() =>
      expect(screen.queryByTestId('loading-spinner')).toBeNull()
    );
  });

  it('renders not found message on 404', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 404 } as any);
    renderWithRouter();
    expect(
      await screen.findByText(/Timeline not found/i)
    ).toBeTruthy();
  });

  it('renders network error message on failure', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    renderWithRouter();
    expect(
      await screen.findByText(/Network error/i)
    ).toBeTruthy();
  });

  it('loads more items when Load More is clicked', async () => {
    const items = Array.from({ length: 15 }, (_, i) => ({
      id: String(i),
      type: 'text',
      author: { name: 'User', avatar: '' },
      timestamp: Date.now(),
      content: { text: `Item ${i}` }
    }));
    vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ title: 'Event', items })
    } as any);
    renderWithRouter();
    await screen.findByText('Item 0');
    expect(screen.queryByText('Item 10')).toBeNull();
    fireEvent.click(screen.getByTestId('load-more'));
    expect(await screen.findByText('Item 10')).toBeTruthy();
  });
});
