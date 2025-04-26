import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  sidebarMenuButtonVariants,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link, LinkOptions } from "@tanstack/react-router";
import { ChevronFirst, ChevronRight, Plus } from "lucide-react";
import { underline_defaults } from "./ui/utils";
import { cn, PropsWithClassname } from "@/lib/utils";
import { Group } from "@blank/zero";
import { useGetGroupsList } from "@/pages/_protected/groups/@data";
import { useAuthentication } from "@/lib/auth.provider";
import { QueryStatus } from "@/lib/zero.provider";
import { useLogout } from "@/lib/auth.provider";

function createExpense() {}

type SidebarItemChunk =
  | {
      type: "link";
      title: string;
      opts: LinkOptions;
      function?: never;
    }
  | {
      type: "fn";
      title: string;
      function: () => void;
      path?: never;
    };

type SidebarMenuItemChunkProps = PropsWithClassname<{
  item: SidebarItemChunk;
  nested?: boolean;
  index: number;
}>;

function SidebarMenuItemChunk(props: SidebarMenuItemChunkProps) {
  const states = {
    default: {
      icon: Plus,
      fontSizeOverride: "",
    },
    nested: {
      icon: ChevronRight,
    },
  };

  const Icon = props.nested ? states.nested.icon : states.default.icon;

  return (
    <>
      <SidebarMenuItem key={props.item.title}>
        <SidebarMenuButton
          onClick={props.item.type === "fn" ? props.item.function : undefined}
          className={cn(props.className, "uppercase")}
          asChild={props.item.type === "link"}
          data-sidebar-index={props.index}
        >
          {props.item.type === "link" ? (
            <Link
              activeOptions={{ exact: true, includeSearch: false }}
              activeProps={{ className: `${underline_defaults} text-primary` }}
              {...props.item.opts}
            >
              <Icon />
              <span>{props.item.title}</span>
            </Link>
          ) : (
            <>
              <Icon />
              <span>{props.item.title}</span>
            </>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    </>
  );
}

type QuickActionsProps = {
  position: number;
};

function QuickActions(props: QuickActionsProps) {
  const quickActions: SidebarItemChunk[] = [
    { type: "link", title: "Home", opts: { to: "/" } },
    {
      type: "fn",
      title: "New Expense",
      function: createExpense,
    },
    { type: "link", title: "Account", opts: { to: "/account" } },
  ];

  return (
    <>
      {quickActions.map((item, index) => (
        <SidebarMenuItemChunk
          key={item.title}
          item={item}
          index={props.position + index}
        />
      ))}
    </>
  );
}

type GroupsProps = {
  position: number;
  groups: Group[];
  status: QueryStatus;
};

function Groups(props: GroupsProps) {
  // if (props.status === "loading")
  //   return <Loading omitBaseText className="h-min min-h-0 w-fit p-2" />;

  if (props.status === "empty") {
    return (
      <SidebarMenuItem
        className={cn(
          sidebarMenuButtonVariants({}),
          "text-muted-alt active:text-muted-alt hover:text-muted-alt active:bg-transparent hover:no-underline lowercase"
        )}
      >
        No Groups Yet
      </SidebarMenuItem>
    );
  }

  return (
    <>
      {props.groups.map((item, index) => (
        <SidebarMenuItemChunk
          key={item.title}
          item={{
            title: item.title,
            type: "link",
            opts: { to: `/groups/$title`, params: { title: item.title } },
          }}
          index={props.position + index}
          nested
        />
      ))}
    </>
  );
}

type SideNavigationProps = React.ComponentProps<typeof Sidebar> & {
  groups: {
    id: string;
    title: string;
    members: {
      name: string;
      email: string;
      avatar: string;
    }[];
    url: string;
  }[];
};

// TODO: FIX NAVIGATION TO GROUPS
export function GlobalSidebar(props: SideNavigationProps) {
  const { user } = useAuthentication();
  const logout = useLogout();

  const groups = useGetGroupsList(user.id);

  return (
    <Sidebar {...props} className="overflow-x-hidden">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:no-underline"
            >
              <Link to="/">
                <div
                  className="flex aspect-square size-[30px] items-center justify-center rounded-lg bg-blank-theme text-primary-foreground font-bold text-base "
                  aria-hidden="true"
                >
                  B
                </div>
                <span className="font-semibold uppercase text-lg mx-1">
                  Blank
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="overflow-x-hidden">
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            <QuickActions position={0} />
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel
            asChild
            className={cn("uppercase ", underline_defaults)}
            data-sidebar-index={1}
          >
            <Link
              to="/groups"
              search={(prev) => ({ cmd: prev.cmd, action: undefined })}
            >
              <span>Groups</span>
            </Link>
          </SidebarGroupLabel>
          <SidebarMenu>
            <Groups position={2} groups={groups.data} status={groups.status} />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => void logout.fn()}
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:no-underline"
            >
              <div className="flex aspect-square size-[30px] items-center justify-center rounded-lg text-base ">
                <ChevronFirst />
              </div>
              <span className="uppercase mx-1">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
