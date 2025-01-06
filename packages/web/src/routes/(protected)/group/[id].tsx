import { getGroupDetails } from './[id]/index.data';

import { Button } from '@/components/ui/button';
import { navigation } from '@/lib/signals';
import { useZero } from '@/lib/zero';
import { useQuery } from '@rocicorp/zero/solid';
import { A, RouteSectionProps, useLocation, useParams } from '@solidjs/router';
import { useUser } from 'clerk-solidjs';
import { For, Show } from 'solid-js';

type Params = { id: string };

// const SkeletonTable = () => {
//   const columns: ColumnDef<string>[] = Object.values(headers).map(
//     (display) => ({
//       header: display,
//       cell: () => {
//         return (
//           <Switch fallback={<Skeleton class="w-5/6 h-5" />}>
//             <Match when={display === headers.description}>
//               <Skeleton class="w-20 h-5" />
//             </Match>
//             <Match when={display === headers.cost}>
//               <Skeleton class="w-12 h-5" />
//             </Match>
//           </Switch>
//         );
//       },
//     }),
//   );

//   const skeletonData = () => Array.from({ length: 12 }).map(() => '');

//   return (
//     <TransactionTable
//       dialogs={{
//         create: { open: () => {}, state: () => 'closed' },
//         edit: { open: () => {}, state: () => 'closed' },
//       }}
//       rows={null}
//       columns={columns}
//       data={skeletonData}
//     />
//   );
// };

// function PageSkeleton() {
//   return (
//     <>
//       <div class="flex flex-col gap-2 py-1 w-full sm:flex-row sm:justify-between sm:items-center">
//         {/* Button Bar */}
//         <div class="flex items-center gap-2 w-full sm:w-fit">
//           <Button
//             class="w-1/3 sm:w-20"
//             disabled={true}
//             variant="outline"
//             size="sm"
//           >
//             New
//           </Button>
//           <Button
//             variant="destructive"
//             size="sm"
//             class="w-1/3 sm:w-20"
//             disabled={true}
//           >
//             Delete
//           </Button>
//           <Button variant="ghost" size="sm" disabled={true}>
//             *
//           </Button>
//         </div>
//       </div>
//       <SkeletonTable />
//     </>
//   );
// }

interface BreadcrumbPartProps {
  title: string;
  to: string;
}

function BreadcrumbPart(props: BreadcrumbPartProps) {
  return (
    <A
      class="hover:text-ui-foreground h-full px-2"
      activeClass="text-ui-foreground"
      inactiveClass="text-ui-foreground/50 "
      end
      href={props.to}
    >
      {props.title}
    </A>
  );
}

function BreadcrumbSeparator() {
  const SEPARATOR = ' > ';

  return <span class="text-ui-foreground/50 ">{SEPARATOR}</span>;
}

// interface UserBelongsToGroupViewProps extends ParentProps {
//   userId: string;
//   groupId?: string;
// }

// TODO: reimplement at a later date, causing infinite render loop as of now
// function UserBelongsToGroupView(props: UserBelongsToGroupViewProps) {
//   const z = useZero();
//   const navigate = useNavigate();

//   const member = useQuery(() =>
//     z.query.member
//       .where('userId', props.userId)
//       .where('groupId', props.groupId ?? '')
//       .one(),
//   );

//   // TODO: fix when cache read status gets added
//   // createEffect(() => {
//   //   if (!member()) {
//   //     navigate('/');
//   //   }
//   // });

//   return <Show when={member()}>{props.children}</Show>;
// }

export default function GroupLayout(props: RouteSectionProps) {
  const session = useUser();
  const z = useZero();

  const subpages = ['members', 'settings'];

  const params = useParams<Params>();
  const path = useLocation();

  const group = useQuery(() =>
    getGroupDetails(z, params.id, session.user()?.id ?? ''),
  );

  const userOwnsGroup = () => group()?.ownerId === session.user()?.id;

  function getSubpage() {
    const fromPath = path.pathname.split('/').at(-1) ?? 'dashboard';
    const subpage = subpages.includes(fromPath) ? fromPath : null;

    return subpage ?? 'group';
  }
  const breadcrumbs = {
    home: {
      text: 'Home',
      to: '/',
    },
    group: {
      text: () => group()?.title ?? '',
      to: '', // relative to [id]
    },
    subpage: {
      text: getSubpage,
      to: getSubpage, // this doesn't need to be used, at least for now, as the Show will give us the same thing for text() and to()
    },
  };

  return (
    <>
      <div class="flex flex-col gap-2 py-1 w-full sm:flex-row sm:justify-between sm:items-center flex-wrap">
        <h1 class="text-left text-xl uppercase text-ui-foreground">
          <BreadcrumbPart
            title={breadcrumbs.home.text}
            to={breadcrumbs.home.to}
          />
          <BreadcrumbSeparator />
          <Show
            when={group()}
            fallback={
              <BreadcrumbPart
                title={navigation.groupClicked ?? ''}
                to={breadcrumbs.group.to}
              />
            }
          >
            <BreadcrumbPart
              title={breadcrumbs.group.text()}
              to={breadcrumbs.group.to}
            />
            <Show when={breadcrumbs.subpage.text() !== 'group'}>
              <Show
                when={
                  breadcrumbs.subpage.text() !== 'settings' || userOwnsGroup()
                }
              >
                <BreadcrumbSeparator />
                <BreadcrumbPart
                  title={breadcrumbs.subpage.text()}
                  to={breadcrumbs.subpage.to()}
                />
              </Show>
            </Show>
          </Show>
        </h1>
        <div class="flex gap-1 sm:flex-row sm:justify-end">
          <For
            each={
              [
                ['Dashboard', '', () => true],
                ['Members', 'members', () => true],
                ['Settings', 'settings', () => userOwnsGroup()],
              ] as const
            }
          >
            {([display, to, check]) => (
              <Show when={check()}>
                <Button
                  as={A}
                  variant={'link'}
                  size="sm"
                  class="px-2"
                  activeClass="underline"
                  href={to}
                  end
                >
                  {display}
                </Button>
              </Show>
            )}
          </For>
        </div>
      </div>
      {/* <UserBelongsToGroupView
        userId={session.user()?.id ?? ''}
        groupId={group()?.id}
      > */}
      <div class="flex flex-col px-2 text-center gap-4 w-full">
        {props.children}
      </div>
      {/* </UserBelongsToGroupView> */}
    </>
  );
}
