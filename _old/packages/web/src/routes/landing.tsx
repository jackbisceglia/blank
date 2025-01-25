import { buttonVariants } from '@/components/ui/button';
import { A } from '@solidjs/router';

export default function LandingPage() {
  return (
    <main class="px-4 mx-auto max-w-5xl text-center min-h-screen flex">
      {/* Update the text color to match your brand */}
      <section class="py-24 space-y-6 mt-24 mx-auto">
        <h1 class="lowercase text-4xl text-brand-primary">
          Split Expenses{' '}
          <span class="text-ui-primary font-bold">Effortlessly</span>
        </h1>
        <div>
          <p class="lowercase font-light text-gray-300 px-12">
            Split expenses with friends and family, as easy as sending a text.
          </p>
        </div>
        <div class="flex justify-center gap-4 mb-10 text-xs uppercase">
          <A
            href="/sign-up"
            classList={{
              [buttonVariants({ variant: 'outline' })]: true,
              ['py-3 px-6']: true,
            }}
          >
            Get Started
          </A>
          <A
            href="/about"
            classList={{
              [buttonVariants({ variant: 'default' })]: true,
              ['py-3 px-6']: true,
            }}
          >
            Learn More
          </A>
        </div>
      </section>
    </main>
  );
}
