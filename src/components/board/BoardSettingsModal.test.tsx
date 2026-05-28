import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, waitFor, getByText, getByDisplayValue, queryByText } from '@testing-library/dom';
import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';
import { useAuthStore } from '../../store/useAuthStore';

// Mock react-router navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const sampleProfile = {
  id: 'p1',
  name: 'Test Profile',
  can_label: 'できる',
  cannot_label: 'できない',
  risk_label: '危険を伴う',
  request_label: '頼みたい',
};

describe('BoardSettingsModal', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);

    // Reset minimal parts of the store used by the component
    useAuthStore.setState({
      updateProfileLabels: vi.fn().mockResolvedValue(undefined),
      checkAuth: vi.fn().mockResolvedValue(undefined),
      currentRoles: { [sampleProfile.id]: 'owner' },
    } as any);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('does not render when isOpen is false', async () => {
    const { BoardSettingsModal } = await import('./BoardSettingsModal');
    act(() => {
      const root = createRoot(container);
      root.render(<BoardSettingsModal isOpen={false} onClose={() => {}} profile={sampleProfile as any} />);
    });
    expect(queryByText(container, 'ボード設定')).toBeNull();
  });

  it('renders fields and saves changes', async () => {
    const { BoardSettingsModal } = await import('./BoardSettingsModal');
    const updateProfileLabels = vi.fn().mockResolvedValue(undefined);
    const checkAuth = vi.fn().mockResolvedValue(undefined);

    useAuthStore.setState({
      updateProfileLabels,
      checkAuth,
      currentRoles: { [sampleProfile.id]: 'owner' },
    } as any);

    await act(async () => {
      const root = createRoot(container);
      root.render(<BoardSettingsModal isOpen={true} onClose={() => {}} profile={sampleProfile as any} />);
    });

    // fields should be present
    expect(getByDisplayValue(container, 'Test Profile')).toBeTruthy();
    expect(getByDisplayValue(container, 'できる')).toBeTruthy();

    // change a label
    const canInput = getByDisplayValue(container, 'できる') as HTMLInputElement;
    fireEvent.change(canInput, { target: { value: 'CanDo' } });
    expect(canInput.value).toBe('CanDo');

    // click save
    const saveButton = getByText(container, /保存/);
    await act(async () => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(updateProfileLabels).toHaveBeenCalledWith(sampleProfile.id, expect.objectContaining({ can: 'CanDo' }));
      expect(checkAuth).toHaveBeenCalled();
    });
  });

  it('owner can delete board and navigates to dashboard', async () => {
    const checkAuth = vi.fn().mockResolvedValue(undefined);
    useAuthStore.setState({
      updateProfileLabels: vi.fn().mockResolvedValue(undefined),
      checkAuth,
      currentRoles: { [sampleProfile.id]: 'owner' },
    } as any);

    // mock confirm to allow deletion
    const confirmSpy = vi.spyOn(window, 'confirm').mockImplementation(() => true);

    // mock supabase delete for this test only
    vi.doMock('../../lib/supabase', () => {
      const fromMock = vi.fn((table: string) => ({ delete: () => ({ eq: () => Promise.resolve({ error: null }) }) }));
      return {
        supabase: {
          from: fromMock,
        },
      };
    });

    // After doMock, import the mocked module so that module cache uses mock
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { supabase } = await import('../../lib/supabase');

    // re-import BoardSettingsModal after mocking supabase
    const { BoardSettingsModal } = await import('./BoardSettingsModal');

    await act(async () => {
      const root = createRoot(container);
      root.render(<BoardSettingsModal isOpen={true} onClose={() => {}} profile={sampleProfile as any} />);
    });

    const deleteButton = getByText(container, /ボードを削除/);
    await act(async () => {
      fireEvent.click(deleteButton);
    });

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
      expect(checkAuth).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    confirmSpy.mockRestore();

    // cleanup module mock to avoid affecting other tests
    vi.resetModules();
  });
});
