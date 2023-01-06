import { writeFile } from "node:fs/promises";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { ModelManager } from "@glazed/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays";

// The key must be provided as an environment variable
const key = fromString(process.env.DID_KEY, "base16");
// Create and authenticate the DID
const did = new DID({
  provider: new Ed25519Provider(key),
  resolver: getResolver(),
});
await did.authenticate();

// Connect to the local Ceramic node
const ceramic = new CeramicClient("http://localhost:7007");
ceramic.did = did;

// Create a manager for the model
const manager = new ModelManager({ ceramic });

// Creates a JSON schema for an object containing a text property
const noteSchemaID = await manager.createSchema("SimpleNote", {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "SimpleNote",
  type: "object",
  properties: {
    text: {
      type: "string",
      title: "text",
      maxLength: 4000,
    },
  },
});

// Create the definition using the created schema ID
await manager.createDefinition("myNote", {
  name: "My note",
  description: "A simple text note",
  schema: manager.getSchemaURL(noteSchemaID),
});

// Create the definition using the created schema ID
await manager.createDefinition("myNote", {
  name: "My note",
  description: "A simple text note",
  schema: manager.getSchemaURL(noteSchemaID),
});

// Create a tile using the created schema ID
await manager.createTile(
  "exampleNote",
  { text: "A simple note" },
  { schema: manager.getSchemaURL(noteSchemaID) }
);

// Deploy model to Ceramic node
const model = await manager.deploy();

// Write deployed model aliases to JSON file
await writeFile("./model.json", JSON.stringify(model));
