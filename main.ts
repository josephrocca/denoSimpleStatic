/*
 * This is a simple server that will serve static content out of the $CWD.
 */

import { Application, HttpError, send, Status } from "https://deno.land/x/oak@v10.4.0/mod.ts";

const app = new Application();

// Error handler middleware
app.use(async (context, next) => {
  try {
    await next();
  } catch (e) {
    if (e instanceof HttpError) {
      context.response.status = e.status as any;
      if (e.expose) {
        context.response.body = `${e.status} - ${e.message}`;
      } else {
        context.response.body = `${e.status} - ${Status[e.status]}`;
      }
    } else if (e instanceof Error) {
      context.response.status = 500;
      context.response.body = `500 - Internal Server Error`;
      console.log("Unhandled Error:", e.message);
      console.log(e.stack);
    }
  }
});

// Logger
app.use(async (context, next) => {
  await next();
  const rt = context.response.headers.get("X-Response-Time");
  console.log(`${context.request.method} ${context.request.url.pathname} - ${String(rt)}`);
});

// Response Time
app.use(async (context, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  context.response.headers.set("X-Response-Time", `${ms}ms`);
});

app.use(async (context, next) => {
  try {
    
    // To allow SharedArrayBuffer use, and other features: https://web.dev/coop-coep/
    context.response.headers.set("Cross-Origin-Embedder-Policy", "credentialless"); // we use "credentialless" instead of "require-corp" because former allows embedding cross-origin stuff
    context.response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
    
    await context.send({
      root: Deno.cwd(),
      index: "index.html",
    });
  } catch {
    next();
  }
});

let portArg = Deno.args.find(a => a.startsWith("--port="));
let port = portArg ? Number(portArg.split("=")[1]) : 8000;

console.log(`Listening at localhost:${port}`);
await app.listen({ port });
