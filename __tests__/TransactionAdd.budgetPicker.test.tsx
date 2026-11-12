/**
 * Regression test for "clicking 模板 (use template) makes the budget picker
 * disappear".
 *
 * `TransactionAdd` used to render the budget card only when
 * `selectedCategory && !templateMode`. In template mode the card vanished
 * entirely, so the user could not see or change which budget the transaction
 * would be filed under — and because `transactions.budgetId` is NOT NULL, a
 * category without a budget for the current month made the save fail with a
 * raw SQLite constraint error.
 *
 * The budget picker is now always shown once a category is selected.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';

jest.mock('@/components/ui/form', () => {
  const ReactLib = require('react');
  const { Text, View } = require('react-native');
  const stub = (name: string) => () =>
    ReactLib.createElement(Text, { testID: name }, name);
  return {
    // FormCard must keep its children, otherwise everything nested inside it
    // would never render.
    FormCard: (props: any) =>
      ReactLib.createElement(View, { testID: 'FormCard' }, props.children),
    TypeSelector: stub('TypeSelector'),
    AmountInput: stub('AmountInput'),
    AccountSelector: stub('AccountSelector'),
    DateTimeSelector: stub('DateTimeSelector'),
    NameInput: stub('NameInput'),
    DescriptionInput: stub('DescriptionInput'),
    CategoryInput: stub('CategoryInput'),
    BudgetInput: stub('BudgetInput'),
    TemplateToggle: stub('TemplateToggle'),
    SubmitButton: stub('SubmitButton'),
  };
});

const mockFormState = {
  type: 'expense' as const,
  name: '',
  amount: '',
  selectedCategory: 7 as number | null,
  selectedCategoryName: '餐饮',
  selectedBudget: 3 as number | null,
  selectedAccount: 1 as number | null,
  description: '',
  date: new Date('2026-11-12'),
  time: new Date('2026-11-12'),
  templateMode: false,
  isLoading: false,
  setType: jest.fn(),
  setName: jest.fn(),
  setAmount: jest.fn(),
  setSelectedCategory: jest.fn(),
  setSelectedBudget: jest.fn(),
  setSelectedAccount: jest.fn(),
  setDescription: jest.fn(),
  setDate: jest.fn(),
  setTime: jest.fn(),
  setTemplateMode: jest.fn(),
  submit: jest.fn(),
};

jest.mock('@/hooks/useTransactionForm', () => ({
  useTransactionForm: () => mockFormState,
}));

import { TransactionAdd } from '@/components/finance/transactions/TransactionAdd';

function hasBudgetPicker(tree: ReturnType<typeof create>): boolean {
  return tree.root.findAllByProps({ testID: 'BudgetInput' }).length > 0;
}

describe('TransactionAdd budget picker', () => {
  it('shows the budget picker in template mode', () => {
    mockFormState.templateMode = true;

    let tree: ReturnType<typeof create> | undefined;
    act(() => {
      tree = create(<TransactionAdd onSubmit={jest.fn()} />);
    });

    expect(hasBudgetPicker(tree!)).toBe(true);
    tree?.unmount();
  });

  it('shows the budget picker in normal mode', () => {
    mockFormState.templateMode = false;

    let tree: ReturnType<typeof create> | undefined;
    act(() => {
      tree = create(<TransactionAdd onSubmit={jest.fn()} />);
    });

    expect(hasBudgetPicker(tree!)).toBe(true);
    tree?.unmount();
  });

  it('hides the budget picker until a category is chosen', () => {
    mockFormState.templateMode = false;
    mockFormState.selectedCategory = null;

    let tree: ReturnType<typeof create> | undefined;
    act(() => {
      tree = create(<TransactionAdd onSubmit={jest.fn()} />);
    });

    expect(hasBudgetPicker(tree!)).toBe(false);
    tree?.unmount();
  });
});
