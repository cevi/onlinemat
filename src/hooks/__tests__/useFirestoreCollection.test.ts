import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { onSnapshot } from 'firebase/firestore';
import { message } from 'antd';
import { useFirestoreCollection } from '../useFirestoreCollection';

// Mock firebase/firestore
const mockUnsubscribe = vi.fn();
let snapshotCallback: ((snap: any) => void) | null = null;
let errorCallback: ((err: any) => void) | null = null;

vi.mock('firebase/firestore', () => ({
  onSnapshot: vi.fn((ref: any, onNext: any, onError: any) => {
    snapshotCallback = onNext;
    errorCallback = onError;
    return mockUnsubscribe;
  }),
}));

// Mock antd message
vi.mock('antd', () => ({
  message: {
    error: vi.fn(),
  },
}));

const mockedOnSnapshot = vi.mocked(onSnapshot);
const mockedMessageError = vi.mocked(message.error);

const makeSnapshot = (docs: Array<{ id: string; data: Record<string, any> }>) => ({
  docs: docs.map(d => ({
    id: d.id,
    data: () => d.data,
  })),
});

describe('useFirestoreCollection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    snapshotCallback = null;
    errorCallback = null;
  });

  it('returns empty data and loading=false when not enabled', () => {
    const { result } = renderHook(() =>
      useFirestoreCollection({
        ref: {} as any,
        enabled: false,
      })
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('returns empty data and loading=false when ref is null', () => {
    const { result } = renderHook(() =>
      useFirestoreCollection({
        ref: null,
        enabled: true,
      })
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('subscribes to onSnapshot when enabled with ref', () => {
    const mockRef = { type: 'query' } as any;

    renderHook(() =>
      useFirestoreCollection({
        ref: mockRef,
        enabled: true,
        deps: [mockRef],
      })
    );

    expect(mockedOnSnapshot).toHaveBeenCalledTimes(1);
  });

  it('sets loading=true while waiting for data', () => {
    const mockRef = { type: 'query' } as any;

    const { result } = renderHook(() =>
      useFirestoreCollection({
        ref: mockRef,
        enabled: true,
        deps: [mockRef],
      })
    );

    expect(result.current.loading).toBe(true);
  });

  it('loads data from snapshot and sets loading=false', () => {
    const mockRef = { type: 'query' } as any;

    const { result } = renderHook(() =>
      useFirestoreCollection({
        ref: mockRef,
        enabled: true,
        deps: [mockRef],
      })
    );

    act(() => {
      snapshotCallback?.(makeSnapshot([
        { id: 'doc1', data: { name: 'Item 1' } },
        { id: 'doc2', data: { name: 'Item 2' } },
      ]));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toEqual({ id: 'doc1', name: 'Item 1' });
    expect(result.current.data[1]).toEqual({ id: 'doc2', name: 'Item 2' });
  });

  it('applies transform function to each document', () => {
    const mockRef = { type: 'query' } as any;

    const { result } = renderHook(() =>
      useFirestoreCollection<{ id: string; label: string }>({
        ref: mockRef,
        enabled: true,
        transform: (data, id) => ({ id, label: data.name.toUpperCase() }),
        deps: [mockRef],
      })
    );

    act(() => {
      snapshotCallback?.(makeSnapshot([
        { id: 'doc1', data: { name: 'hello' } },
      ]));
    });

    expect(result.current.data[0]).toEqual({ id: 'doc1', label: 'HELLO' });
  });

  it('suppresses permission-denied errors silently', () => {
    const mockRef = { type: 'query' } as any;

    const { result } = renderHook(() =>
      useFirestoreCollection({
        ref: mockRef,
        enabled: true,
        deps: [mockRef],
      })
    );

    act(() => {
      errorCallback?.({ code: 'permission-denied', message: 'Access denied' });
    });

    expect(result.current.loading).toBe(false);
    expect(mockedMessageError).not.toHaveBeenCalled();
  });

  it('shows error message for non-permission errors', () => {
    const mockRef = { type: 'query' } as any;

    const { result } = renderHook(() =>
      useFirestoreCollection({
        ref: mockRef,
        enabled: true,
        deps: [mockRef],
      })
    );

    act(() => {
      errorCallback?.({ code: 'unavailable', message: 'Service unavailable' });
    });

    expect(result.current.loading).toBe(false);
    expect(mockedMessageError).toHaveBeenCalled();
  });

  it('unsubscribes when component unmounts', () => {
    const mockRef = { type: 'query' } as any;

    const { unmount } = renderHook(() =>
      useFirestoreCollection({
        ref: mockRef,
        enabled: true,
        deps: [mockRef],
      })
    );

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });
});
