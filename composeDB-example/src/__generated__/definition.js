// This is an auto-generated file, do not edit manually
export const definition = {
  models: {
    SimpleProfile: {
      id: "kjzl6hvfrbw6c7keo17n66rxyo21nqqaa9lh491jz16od43nokz7ksfcvzi6bwc",
      accountRelation: { type: "single" },
    },
  },
  objects: {
    SimpleProfile: {
      displayName: { type: "string", required: true },
      owner: { type: "view", viewType: "documentAccount" },
      version: { type: "view", viewType: "documentVersion" },
    },
  },
  enums: {},
  accountData: { simpleProfile: { type: "node", name: "SimpleProfile" } },
};
