import { SignIn } from 'clerk-solidjs';

export default function SignInPage() {
  return (
    <main class="px-4 mx-auto max-w-5xl text-center min-h-screen flex">
      <section class="py-24 mx-auto">
        <SignIn signUpUrl="/sign-up" />
      </section>
    </main>
  );
}
