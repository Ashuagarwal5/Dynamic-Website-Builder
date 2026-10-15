import { registerHooks } from "node:module";

// Next.js implements this build-time guard internally. Node unit tests do not
// run its bundler, so only the marker is replaced in the test process.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") {
      return { url: "data:text/javascript,export {};", shortCircuit: true };
    }
    return nextResolve(specifier, context);
  },
});
