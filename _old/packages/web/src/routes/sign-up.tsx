import { SignUp } from 'clerk-solidjs';

export default function SignUpPage() {
  return (
    <main class="px-4 mx-auto max-w-5xl text-center min-h-screen flex">
      <section class="py-24 mx-auto">
        <SignUp signInUrl="/sign-in" />
      </section>
    </main>
  );
}
