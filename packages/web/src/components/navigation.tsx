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
import { useServerFn } from "@tanstack/start";
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
}>;

function SidebarMenuItemChunk(props: SidebarMenuItemChunkProps) {
  const Icon = props.nested ? ChevronRight : Plus;
  return (
    <>
      <SidebarMenuItem key={props.item.title}>
        <SidebarMenuButton
          onClick={props.item.type === "fn" ? props.item.function : undefined}
          className={cn(props.className, "uppercase")}
          asChild={props.item.type === "link"}
        >
          {props.item.type === "link" ? (
            <Link
              activeOptions={{ exact: true }}
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

function QuickActions() {
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
      {quickActions.map((item) => (
        <SidebarMenuItemChunk key={item.title} item={item} />
      ))}
    </>
  );
}

function Groups() {
  // TODO: replace w/ data fetching
  const mockGroups: SidebarItemChunk[] = [
    { type: "link", title: "la familia", path: "/groups/la-familia" },
    { type: "link", title: "the apartment", path: "/groups/the-aprtment" },
    { type: "link", title: "homies", path: "/groups/homies" },
  ];

  return (
    <>
      {mockGroups.map((item) => (
        <SidebarMenuItemChunk key={item.title} item={item} nested />
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

export function SideNavigation(props: SideNavigationProps) {
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
            <QuickActions />
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel
            asChild
            className={cn("uppercase ", underline_defaults)}
          >
            <Link to="/groups">
              <span>All Groups</span>
            </Link>
          </SidebarGroupLabel>
          <SidebarMenu>
            <Groups />
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
              <Link to="/">
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
