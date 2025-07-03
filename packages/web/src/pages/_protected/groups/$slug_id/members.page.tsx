import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_protected/groups/$slug_id/members/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_protected/groups/$slug::$id/members/"!</div>
}
