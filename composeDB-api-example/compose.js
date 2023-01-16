import { CeramicClient } from "@ceramicnetwork/http-client";
import { Composite } from "@composedb/devtools";
import { writeEncodedComposite } from "@composedb/devtools-node";
import { readEncodedComposite } from "@composedb/devtools-node";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays/from-string";
import * as dotenv from "dotenv";
import { serveEncodedDefinition } from "@composedb/devtools-node";

dotenv.config();

// CLIENT CONFIGURATION
const ceramic = new CeramicClient("http://localhost:7007");
const composite = await Composite.fromModels({
  ceramic,
  models: ["kjzl6hvfrbw6c7keo17n66rxyo21nqqaa9lh491jz16od43nokz7ksfcvzi6bwc"],
});

// write composite output to a file called my-first-composite.json
await writeEncodedComposite(composite, "my-first-composite.json");

// Hexadecimal-encoded private key for a DID having admin access to the target Ceramic node
// Replace the example key here by your admin private key

const privateKey = fromString(process.env.DID_PRIVATE_KEY, "base16");

const did = new DID({
  resolver: getResolver(),
  provider: new Ed25519Provider(privateKey),
});
await did.authenticate();

// An authenticated DID with admin access must be set on the Ceramic instance
ceramic.did = did;
// Replace by the path to the local encoded composite file, reads the file you just created
await readEncodedComposite(ceramic, "my-first-composite.json");

// Notify the Ceramic node to index the models present in the composite
await composite.startIndexingOn(ceramic);

// SERVER CONFIGURATION
const server = await serveEncodedDefinition({
  ceramicURL: "http://localhost:7007",
  graphiql: true,
  path: new URL("my-first-composite.json", import.meta.url),
  port: 5001,
  did: did,
});

console.log(`Server started on ${server.url}`);

process.on("SIGTERM", () => {
  server.close(() => {
    console.log("Server stopped");
  });
});
