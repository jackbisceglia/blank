import { useNavigate, useSearch } from "@tanstack/react-router";
import { useCallback, useEffect } from "react";

// haven't found a nice way to merge the two without it being a conditional mess
// can probably wrap up things like open/close/sync to be re-used in the future
// TODO: add linkOptions export to the route that can be added to ui based navs

type ViewState = "open" | "closed";

type UseSearchRouteOptions = {
  hooks?: {
    onOpen?: () => void;
    onClose?: () => void;
  };
};

export type UseSearchRoute = {
  open: (value: unknown) => void;
  close: () => void;
  view: () => ViewState;
  state: () => unknown;
  sync: (opening: boolean) => void;
};

type SearchRoute = {
  useSearchRoute: () => UseSearchRoute;
};

/**
 * Creates a search route that manages dialog state through URL search parameters.
 *
 * This creates a dialog state system where:
 * - Open state: search param has a value (key: value)
 * - Closed state: search param is undefined (automatically stripped from URL)
 *
 * The search params act as a global store, treating dialogs like their own routes.
 * This enables deep linking, browser back/forward navigation, and shareable dialog states.
 *
 * @param key - The search parameter key to use for state management
 *
 * @example
 * ```typescript
 * // Create a search route for a user dialog
 * const userDialog = createSearchRoute("user");
 *
 * function UserComponent() {
 *   const { open, close, view, state } = userDialog.useSearchRoute();
 *
 *   // Opens dialog with user ID: ?user=123
 *   const handleOpenUser = () => open("123");
 *
 *   // Closes dialog: removes ?user param entirely
 *   const handleClose = () => close();
 *
 *   const isOpen = view() === "open";
 *   const userId = state(); // "123" when open, undefined when closed
 * }
 * ```
 */
export function createSearchRoute(key: string): SearchRoute {
  /**
   * Hook that provides state management for the search route dialog.
   *
   * Returns functions to open/close the dialog and track its state.
   * The dialog state is synchronized with URL search parameters, making it
   * a global store that persists across navigation and can be shared via URL.
   *
   * @param options - Optional configuration including lifecycle hooks
   *
   * @example
   * ```typescript
   * const { open, close, view, state, sync } = useSearchRoute({
   *   hooks: {
   *     onOpen: () => console.log("Dialog opened"),
   *     onClose: () => console.log("Dialog closed")
   *   }
   * });
   *
   * // Check if dialog is open
   * const isOpen = view() === "open";
   *
   * // Get the current state value
   * const currentValue = state();
   *
   * // Open with a specific value
   * open({ userId: "123", mode: "edit" });
   *
   * // Close the dialog
   * close();
   *
   * // Sync with external dialog state (useful for controlled components)
   * sync(externalDialogOpen);
   * ```
   */
  function useSearchRoute(options?: UseSearchRouteOptions) {
    const navigate = useNavigate();
    const search = useSearch({
      strict: false,
      select: (state) => state[key as keyof typeof state],
      structuralSharing: true,
    });

    // nav utility for open/close to use
    function go(k: string, v?: unknown) {
      return void navigate({
        to: ".",
        search: (prev) => ({ ...prev, [key]: v }),
      });
    }

    function state() {
      return search;
    }

    const view = useCallback(() => {
      return !!search ? "open" : "closed";
    }, [search]);

    const open = useCallback(
      function open(value: unknown) {
        go(key, value);
      },
      [go, key]
    );

    const close = useCallback(
      function close() {
        go(key, undefined);
      },
      [go, key]
    );

    function sync(opening: boolean) {
      // this is typically never opened directly via dialog trigger, but rather via search param nav
      // so we only need to handle close state
      if (!opening) {
        close();
      }
    }

    useEffect(() => {
      if (view() === "open") {
        options?.hooks?.onOpen?.();
      } else {
        options?.hooks?.onClose?.();
      }
    }, [view()]);

    return { open, close, view, state, sync };
  }

  return { useSearchRoute };
}

/**
 * Creates a stackable search route that manages multiple dialog states with the same key.
 *
 * This creates a dialog state system where:
 * - Multiple dialogs can be open simultaneously using an array of values
 * - Open state: when the specific value is present in the array (key: [value1, value2])
 * - Closed state: when the specific value is not in the array or array is empty/undefined
 *
 * Useful for scenarios like having multiple modals open at once, or tracking
 * multiple selected items that each have their own dialog state.
 *
 * @param key - The search parameter key to use for the array of values
 * @param value - The specific value this instance tracks within the array
 *
 * @example
 * ```typescript
 * // Create stackable dialogs for different user actions
 * const editUserDialog = createStackableSearchRoute("dialogs", "edit-user");
 * const deleteUserDialog = createStackableSearchRoute("dialogs", "delete-user");
 *
 * function UserActions() {
 *   const editDialog = editUserDialog.useSearchRoute();
 *   const deleteDialog = deleteUserDialog.useSearchRoute();
 *
 *   // URL becomes: ?dialogs=["edit-user"]
 *   const handleEdit = () => editDialog.open();
 *
 *   // URL becomes: ?dialogs=["edit-user","delete-user"]
 *   const handleDelete = () => deleteDialog.open();
 *
 *   // Both dialogs can be open simultaneously
 *   const editOpen = editDialog.view() === "open";
 *   const deleteOpen = deleteDialog.view() === "open";
 * }
 * ```
 */
export function createStackableSearchRoute(key: string, value: string) {
  function assertAsArray(search: unknown) {
    if (search && !Array.isArray(search)) {
      throw new Error("Stackable search route requires an array schema");
    }
    return search as string[] | undefined;
  }

  /**
   * Hook that provides state management for a stackable search route dialog.
   *
   * Each instance tracks whether its specific value is present in the shared array.
   * Multiple instances can be open simultaneously, and each manages its own state
   * within the shared search parameter array.
   *
   * @param options - Optional configuration including lifecycle hooks
   *
   * @example
   * ```typescript
   * const { open, close, view, state, sync } = useSearchRoute({
   *   hooks: {
   *     onOpen: () => console.log("This specific dialog opened"),
   *     onClose: () => console.log("This specific dialog closed")
   *   }
   * });
   *
   * // Check if this specific dialog is open
   * const isOpen = view() === "open";
   *
   * // Get the current array state
   * const allOpenDialogs = state(); // ["edit-user", "delete-user"]
   *
   * // Open this dialog (adds to array)
   * open(); // Regular mode: adds to existing array
   * open(true); // Solo mode: replaces entire array with just this value
   *
   * // Close this dialog (removes from array)
   * close();
   *
   * // Sync with external dialog state
   * sync(externalDialogOpen);
   * ```
   */
  function useSearchRoute(options?: UseSearchRouteOptions) {
    const navigate = useNavigate();
    const search = useSearch({
      strict: false,
      select: (s) => s[key as keyof typeof s],
      structuralSharing: true,
    });
    const stack = assertAsArray(search);

    // nav utility for open/close to use
    function go(k: string, v?: unknown) {
      return navigate({
        to: ".",
        search: (prev) => ({ ...prev, [k]: v }),
      });
    }

    function state() {
      return search;
    }

    const view = useCallback(() => {
      return stack?.includes(value) ? "open" : "closed";
    }, [stack, value]);

    const open = useCallback(
      (solo?: boolean) => {
        const current = !solo ? (stack ?? []) : [];
        const added = new Set([...current, value]);
        void go(key, Array.from(added));
      },
      [stack, value, go, key]
    );

    const close = useCallback(() => {
      const removed = stack?.filter((v) => v !== value) ?? [];
      void go(key, removed.length > 0 ? removed : undefined);
    }, [stack, go, key]);

    const sync = (opening: boolean) => (opening ? open() : close());

    useEffect(() => {
      if (view() === "open") {
        options?.hooks?.onOpen?.();
      } else {
        options?.hooks?.onClose?.();
      }
    }, [view()]);

    return { open, close, sync, view, state };
  }

  return { useSearchRoute };
}
