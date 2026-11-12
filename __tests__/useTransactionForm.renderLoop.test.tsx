/**
 * Regression test for the "number input feels unresponsive" bug.
 *
 * Root cause: `useTransactionForm` creates its service objects inline
 * (`useAccountService(databaseService)` etc.). Those factories return a NEW
 * object literal on every render, so the service identity changes on every
 * render. The `loadAccounts` effect lists that service in its dependency
 * array, so the effect re-runs on every render; it then calls
 * `setAccountList(accounts)` with a brand-new array, which schedules another
 * render. The result is an unbounded render + SQL-query loop that keeps the
 * JS thread saturated, so keystrokes land late.
 *
 * `accountList` is never consumed by any component, so the whole cycle is
 * pure waste.
 *
 * The test asserts that mounting the form settles: the number of renders must
 * stay small. Before the fix this number grows without bound.
 */

import React from 'react';
import { act, create } from 'react-test-renderer';

const mockAccountRows = [
  {
    id: 1,
    name: '现金',
    type: 'cash',
    icon: '💵',
    color: '#4CAF50',
    balance: 100,
    isActive: 1,
    sortOrder: 0,
  },
];

const mockDb = {
  executeQuery: jest.fn(async (query: string) => {
    if (query.includes('FROM accounts')) {
      // A real query always yields a fresh array instance.
      return {
        rows: { _array: mockAccountRows.map((row) => ({ ...row })) },
        insertId: 1,
        changes: 1,
      };
    }
    return { rows: { _array: [] }, insertId: 1, changes: 0 };
  }),
};

jest.mock('@/hooks/useDatabaseSetup', () => ({
  useDatabaseSetup: () => ({
    isReady: true,
    error: null,
    databaseService: mockDb,
    retry: jest.fn(),
  }),
}));

import { useTransactionForm } from '@/hooks/useTransactionForm';

describe('useTransactionForm render stability', () => {
  it('does not enter a render/query loop after mount', async () => {
    let renderCount = 0;
    const RENDER_CAP = 100;

    function Harness() {
      useTransactionForm();
      renderCount += 1;
      if (renderCount > RENDER_CAP) {
        throw new Error(
          `Render loop detected: ${renderCount}+ renders for a single mount (cap ${RENDER_CAP}).`,
        );
      }
      return null;
    }

    let tree: ReturnType<typeof create> | undefined;

    await act(async () => {
      tree = create(<Harness />);
    });

    // Let any pending effects/promises settle.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const queriesAfterMount = mockDb.executeQuery.mock.calls.length;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    const queriesLater = mockDb.executeQuery.mock.calls.length;

    // eslint-disable-next-line no-console
    console.log(
      `[render-loop] renders=${renderCount} queriesAfterMount=${queriesAfterMount} queriesLater=${queriesLater}`,
    );

    expect(renderCount).toBeLessThan(10);
    expect(queriesLater - queriesAfterMount).toBeLessThan(5);

    tree?.unmount();
  });
});
