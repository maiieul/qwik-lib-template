import { component$, useSignal, useStyles$ } from "@qwik.dev/core";
import styles from "./counter.css?inline";

export const Counter = component$(() => {
  // ?inline + useStyles$ keeps sideEffects:false truthful
  useStyles$(styles);
  const count = useSignal(0);

  return (
    <div class="counter">
      <p>Count: {count.value}</p>
      <p>
        <button onClick$={() => count.value++}>Increment</button>
      </p>
    </div>
  );
});
