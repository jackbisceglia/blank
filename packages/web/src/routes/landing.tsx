export default function LandingPage() {
  return (
    <main class="px-4 mx-auto max-w-5xl text-center min-h-screen flex font-mono">
      {/* Update the text color to match your brand */}
      <section class="py-24 space-y-6 mt-24 mx-auto">
        <h1 class="lowercase text-4xl font-bold text-brand-primary">
          Split Expenses, Effortlessly
        </h1>
        <div>
          <p class="lowercase font-light text-gray-300 px-12">
            Split expenses with friends and family, as easy as sending a text.
          </p>
        </div>
        <div class="flex justify-center gap-4 mb-10 text-xs uppercase">
          <a
            href="/sign-up"
            class="text-white py-3 px-6 rounded-md hover:bg-brand-secondary transition"
          >
            Get Started
          </a>
          <a
            href="/about"
            class="border border-brand-primary py-3 px-6 rounded-md hover:bg-brand-primary hover:text-white transition"
          >
            Learn More
          </a>
        </div>
      </section>
    </main>
  );
}
