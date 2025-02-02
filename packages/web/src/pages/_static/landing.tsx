import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_static/landing')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/landing"!</div>
}
