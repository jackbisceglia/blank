export default function Counter(props: {
  disabled: boolean;
  create: () => Promise<void>;
}) {
  return (
    <button
      class="w-[200px] disabled:bg-gray-400 disabled:border-gray-400 rounded-full my-3 text-gray-950 bg-gray-100 border-2 border-gray-300 focus:border-gray-400 active:border-gray-400 px-[2rem] py-[1rem]"
      onClick={props.create}
      disabled={props.disabled}
    >
      Create Random
    </button>
  );
}
