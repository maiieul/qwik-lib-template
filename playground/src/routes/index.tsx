import { component$ } from "@qwik.dev/core";
import { Counter, Logo } from "my-qwik-library-name";

export default component$(() => {
  return (
    <>
      <h1>Qwik Library Starter</h1>
      <p>
        This playground consumes the library from `packages/lib` exactly like an app would (imported
        by package name — aliased to src/ for HMR). It is never published.
      </p>
      <Logo />
      <Counter />
    </>
  );
});
