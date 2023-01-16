import { serveEncodedDefinition } from "@composedb/devtools-node";

// Configures the server
const server = await serveEncodedDefinition({
  ceramicURL: "http://localhost:7007",
  graphiql: true,
  path: new URL("my-first-composite.json", import.meta.url),
  port: 5001,
});

console.log(`Server started on ${server.url}`);

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server stopped");
  });
});
