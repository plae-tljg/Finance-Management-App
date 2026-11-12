/**
 * The amount field used to *reject* a keystroke whenever the sanitised text
 * had more than one decimal separator or more than two decimal places:
 *
 *   if (parts.length > 2) return;
 *   if (parts[1] && parts[1].length > 2) return;
 *
 * Because the field is controlled, rejecting the update means the displayed
 * value never changes — the key press is swallowed, which is exactly the
 * "the number box is extremely insensitive" symptom.
 *
 * The field now truncates instead of rejecting, so every keystroke is
 * accepted and the value visibly changes.
 */
import React from 'react';
import { act, create } from 'react-test-renderer';
import { TextInput } from 'react-native';

import { AmountInput } from '@/components/ui/form/AmountInput';

function typeInto(tree: ReturnType<typeof create>, text: string) {
  const input = tree.root.findByType(TextInput);
  act(() => {
    input.props.onChangeText(text);
  });
  return input.props.value as string;
}

describe('AmountInput', () => {
  it('accepts every keystroke and truncates extra decimals instead of dropping input', () => {
    const changes: string[] = [];
    let tree: ReturnType<typeof create> | undefined;

    act(() => {
      tree = create(
        <AmountInput value="" onChange={(value) => changes.push(value)} />,
      );
    });

    // A third decimal digit must not swallow the keystroke.
    typeInto(tree!, '12.345');
    expect(changes[changes.length - 1]).toBe('12.34');

    // A second decimal separator must not swallow the keystroke either.
    typeInto(tree!, '12.34.5');
    expect(changes[changes.length - 1]).toBe('12.345'.slice(0, 5));

    // Non-numeric characters are stripped, not rejected.
    typeInto(tree!, '1a2b');
    expect(changes[changes.length - 1]).toBe('12');

    tree?.unmount();
  });

  it('keeps a trailing decimal point so the user can keep typing', () => {
    const changes: string[] = [];
    let tree: ReturnType<typeof create> | undefined;

    act(() => {
      tree = create(
        <AmountInput value="" onChange={(value) => changes.push(value)} />,
      );
    });

    typeInto(tree!, '12.');
    expect(changes[changes.length - 1]).toBe('12.');

    tree?.unmount();
  });
});
