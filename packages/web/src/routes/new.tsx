import { A } from "@solidjs/router";
import Counter from "~/components/CreateTransaction";

export default function NewPage() {
  function handleCreateNaturalLangaugeTransaction(e: SubmitEvent) {
    e.preventDefault();
  }
  return (
    <main class="text-center mx-auto text-gray-700 p-4">
      <h1 class="max-6-xs text-6xl text-sky-700 font-thin uppercase my-16">
        Splitting something ?
      </h1>
      <form
        class="w-full max-w-md mx-auto mt-8"
        onSubmit={handleCreateNaturalLangaugeTransaction}
      >
        <div class="mb-4 text-left">
          <label
            for="transaction-name"
            class="block text-sm font-medium text-gray-700 mb-2"
          >
            Transaction Description
          </label>
          <input
            type="text"
            id="transaction-name"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition duration-150 ease-in-out"
            placeholder="coffee, $18, split with..."
          />
        </div>
        <button
          type="submit"
          class="w-full bg-sky-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition duration-150 ease-in-out"
        >
          Create Transaction
        </button>
      </form>
    </main>
  );
}
