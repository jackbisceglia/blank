import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { logoutRPC } from "@/rpc/auth";
import { ChevronFirst, ChevronRight, Plus } from "lucide-react";
import { underline_defaults } from "./ui/utils";
import { cn, PropsWithClassname } from "@/lib/utils";

function createExpense() {
  console.log("created expense: ");
}

type SidebarItemChunk =
  | {
      type: "link";
      title: string;
      path: string;
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
              to={props.item.path}
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
    { type: "link", title: "Home", path: "/" },
    { type: "link", title: "Groups", path: "/groups" },
    {
      type: "fn",
      title: "New Expense",
      function: createExpense,
    },
    { type: "link", title: "Account", path: "/account" },
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
};

function Groups(props: GroupsProps) {
  // TODO: replace w/ data fetching
  const mockGroups: SidebarItemChunk[] = [
    { type: "link", title: "la familia", path: "/groups/la-familia" },
    { type: "link", title: "the apartment", path: "/groups/the-aprtment" },
    { type: "link", title: "homies", path: "/groups/homies" },
  ];

  return (
    <>
      {mockGroups.map((item, index) => (
        <SidebarMenuItemChunk
          key={item.title}
          item={item}
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

export function GlobalSidebar(props: SideNavigationProps) {
  const logout = useServerFn(logoutRPC);

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
              <Link
                to="/"
                search={(prev) => ({ cmd: prev.cmd, action: undefined })}
              >
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
              <span>All Groups</span>
            </Link>
          </SidebarGroupLabel>
          <SidebarMenu>
            <Groups position={2} />
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => void logout()}
              size="lg"
              asChild
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:no-underline"
            >
              <Link
                to="/"
                search={(prev) => ({ cmd: prev.cmd, action: undefined })}
              >
                <div className="flex aspect-square size-[30px] items-center justify-center rounded-lg text-base ">
                  <ChevronFirst />
                </div>
                <span className="uppercase mx-1">Logout</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
