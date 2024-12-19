import { useCreateGroup } from './index.data';

import { Button, ButtonLoadable } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TextFieldLabel, TextFieldRoot } from '@/components/ui/textfield';
import { createSignalBoundTextField } from '@/lib/util.client';
import { useSearchParams } from '@solidjs/router';

export type DialogState = 'open' | 'closed';

// note: this is an action we invoke locally (/contacts)- as such, we export only a hook with everything needed
function useDialogState() {
  const [searchParams, setSearchParams] = useSearchParams<{
    action?: 'new-contact';
  }>();

  const state = () => {
    if (searchParams.action === 'new-contact') {
      return 'open';
    }

    return 'closed';
  };

  const open = () => {
    setSearchParams({ action: 'new-contact' });
  };
  const close = () => {
    setSearchParams({ ...searchParams, action: undefined });
  };

  const actions = {
    state,
    open,
    close,
    toggle: () => {
      if (state() === 'open') {
        close();
      } else {
        open();
      }
    },
  };

  return actions;
}

export function useNewGroupDialog() {
  const state = useDialogState();

  return {
    ...state,
    Component: GroupDialog,
  };
}

type GroupDialogProps = {
  numGroupsUserIsAMemberOf: number;
};

export const GroupDialog = (props: GroupDialogProps) => {
  const { state, close, toggle } = useNewGroupDialog();
  const [[title, setTitle], TitleInput] =
    createSignalBoundTextField<string>('');

  const createGroup = useCreateGroup();

  return (
    <Dialog
      open={state() === 'open'}
      onOpenChange={() => {
        setTitle('');
        toggle();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle class="uppercase">New Group</DialogTitle>
        </DialogHeader>
        <form
          action={createGroup.raw.with(
            title(),
            props.numGroupsUserIsAMemberOf,
            close,
          )}
          method="post"
        >
          <div class="mb-6 text-left space-y-2">
            <TextFieldRoot class="lowercase w-full">
              <TextFieldLabel>title</TextFieldLabel>
              <TitleInput
                type="name"
                name="title"
                id="group-title"
                class="w-full px-3 py-2 border  rounded-md bg-ui-muted focus:outline-none focus:ring-1 focus:ring-gray-400 transition duration-150 ease-in-out"
                placeholder="jane doe's cool group"
              />
            </TextFieldRoot>
          </div>
          <DialogFooter>
            <ButtonLoadable
              class="w-full uppercase"
              type="submit"
              size="sm"
              disabled={createGroup.ctx.pending}
              loading={createGroup.ctx.pending}
            >
              Create
            </ButtonLoadable>
            <Button
              class="w-full uppercase"
              variant="outline"
              size="sm"
              onClick={close}
              disabled={createGroup.ctx.pending}
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
