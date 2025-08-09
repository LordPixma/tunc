import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Timeline } from './Timeline';

describe('Timeline', () => {
  const setup = async (mockData: any, ok = true) => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({
      ok,
      json: async () => mockData,
    });
    render(
      <MemoryRouter initialEntries={['/1']}>
        <Routes>
          <Route path='/:id' element={<Timeline />} />
        </Routes>
      </MemoryRouter>
    );
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  };

  it('fetches and renders timeline items', async () => {
    const data = {
      title: 'My Event',
      items: [
        {
          id: '1',
          type: 'photo',
          isLocked: false,
          author: { name: 'Alex', avatar: '' },
          timestamp: '2024-01-01T00:00:00Z',
          content: { image: 'img.jpg', caption: 'Beach' }
        },
        {
          id: '2',
          type: 'text',
          isLocked: false,
          author: { name: 'Sarah', avatar: '' },
          timestamp: '2024-01-02T00:00:00Z',
          content: { text: 'Hello world' }
        },
        {
          id: '3',
          type: 'audio',
          isLocked: false,
          author: { name: 'Alex', avatar: '' },
          timestamp: '2024-01-03T00:00:00Z',
          content: { audioTitle: 'Song', duration: '3:00' }
        }
      ]
    };
    await setup(data);
    await screen.findByText('My Event');
    expect(screen.getByAltText('Beach')).toBeInTheDocument();
    expect(screen.getByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Song')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    (global.fetch as jest.Mock) = jest.fn().mockResolvedValue({ ok: false });
    render(
      <MemoryRouter initialEntries={['/1']}>
        <Routes>
          <Route path='/:id' element={<Timeline />} />
        </Routes>
      </MemoryRouter>
    );
    await screen.findByText('Failed to load timeline');
  });

  it('filters items by author', async () => {
    const data = {
      title: 'Event',
      items: [
        {
          id: '1',
          type: 'photo',
          isLocked: false,
          author: { name: 'Alex', avatar: '' },
          timestamp: '2024-01-01T00:00:00Z',
          content: { image: 'img.jpg', caption: 'Beach' }
        },
        {
          id: '2',
          type: 'text',
          isLocked: false,
          author: { name: 'Sarah', avatar: '' },
          timestamp: '2024-01-02T00:00:00Z',
          content: { text: 'Hello world' }
        }
      ]
    };
    await setup(data);
    const select = await screen.findByRole('combobox');
    await userEvent.selectOptions(select, 'alex');
    expect(screen.queryByText('Hello world')).not.toBeInTheDocument();
    expect(screen.getByAltText('Beach')).toBeInTheDocument();
  });
});
