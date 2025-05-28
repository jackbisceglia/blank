type AcceptableKeyboardEvent<T> = KeyboardEvent | React.KeyboardEvent<T>;

export function isModKey<T>(e: AcceptableKeyboardEvent<T>) {
  return e.metaKey || e.ctrlKey;
}

const isKey = (key: string, set: string[]) => set.includes(key);

const keys = {
  up: ["k", "ArrowUp"],
  down: ["j", "ArrowDown"],
  select: ["Enter", " "],
};

export const isTableNavUp = (key: string) => isKey(key, keys.up);
export const isTableNavDown = (key: string) => isKey(key, keys.down);

type TableNavigationContext =
  | false
  | {
      direction: "up" | "down";
    };

export const tableNavigationContext = <T,>(
  e: AcceptableKeyboardEvent<T>
): TableNavigationContext => {
  if (isModKey(e)) return false;
  if (!isTableNavUp(e.key) && !isTableNavDown(e.key)) return false;

  return {
    direction: isTableNavUp(e.key) ? "up" : "down",
  };
};
