import { Transaction } from '@blank/core/zero';

import { Accessor, createSignal } from 'solid-js';

export const useRows = (data: Accessor<readonly Transaction[] | undefined>) => {
  const [rowSelection, setRowSelection] = createSignal<Record<string, boolean>>(
    {},
  );

  const resetRows = () => setRowSelection({});

  const selectedIndices = () =>
    Object.keys(rowSelection()).map((stringIndex) => parseInt(stringIndex));

  const selectedIds = () =>
    selectedIndices()
      .map((index) => data()?.at(index)?.id ?? '')
      .filter((id) => id !== '');

  return {
    reset: resetRows,
    selected: {
      size: () => selectedIds().length,
      ids: selectedIds,
      // TODO: need to create a mapping so that on delete, we can only toggle off the deleted guys
      indices: selectedIndices,
    },
    get: rowSelection,
    set: setRowSelection,
  };
};
