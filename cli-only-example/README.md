# CLI only example

- [Glaze CLI Docs](https://developers.ceramic.network/build/cli/quick-start/)
- [key vs seed troubleshooting](https://forum.ceramic.network/t/problem-on-creating-a-stream/343/2)

## Overview

- Once a stream is generated you can use the `seed id` as the `-key` to interact with the data.
- A stream also has a `stream id` which is used to identify which stream to interact with.
- Schemas can also be defined and used when creating streams, they have `stream ids` that can be used to identify which schemas to interact with.

See commands below and the Glaze CLI docs for a tutorial on running these commands.

## Commands

- `glaze tile:create`
- `glaze tile:update`
- `glaze tile:show`
- `glaze tile:update`
- `glaze stream:commits`
- `glaze stream:state`

### Example to creates a Schema

```bash
glaze tile:create --key xxxxx --content '{
   "$schema": "http://json-schema.org/draft-07/schema#",
   "title": "Reward",
   "type": "object",
   "properties": {
     "title": {"type": "string"},
     "message": {"type": "string"}
   },
   "required": [
     "message",
     "title"
   ]
 }'
```

### Creates a stream using a schema

``` bash
 glaze tile:create --key xxxxx --content '{
    "title": "My first document with schema",
    "message": "Hello World"
  }' --metadata '{"schema":"xxxx"}'
```