import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_static/about/")({
  ssr: true,
  component: AboutRoute,
});

function AboutRoute() {
  return (
    <main className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-8 px-6 text-center">
      <img src="/blank-logo.svg" alt="blank logo" className="h-16 w-16" />
      <h1 className="text-4xl font-semibold tracking-tight">
        <span className="uppercase">about</span> blank
      </h1>
      <p className="max-w-prose text-lg text-muted-foreground lowercase">
        blank helps you handle your expenses without the hassle—as easy as
        sending a text.
      </p>
      <p className="max-w-prose text-lg text-muted-foreground lowercase">
        our mission is to streamline your financial tasks so you can spend more
        time on what matters.
      </p>
    </main>
  );
}
