//main.js

import { CeramicClient } from "@ceramicnetwork/http-client";
import { EthereumAuthProvider } from "@ceramicnetwork/blockchain-utils-linking";
import { DIDDataStore } from "@glazed/did-datastore";
import { DIDSession } from "@glazed/did-session";

//cache a reference to the DOM Elements
const profileForm = document.getElementById("profileForm");
const walletBtn = document.getElementById("walletBtn");
const profileName = document.getElementById("profileName");
const profileGender = document.getElementById("profileGender");
const profileCountry = document.getElementById("profileCountry");
const submitBtn = document.getElementById("submitBtn");

walletBtn.innerHTML = "Connect Wallet";
profileName.innerHTML = "Name: ";
profileGender.innerHTML = "Gender: ";
profileCountry.innerHTML = "Country: ";

// creates a new CeramicClient instance
const ceramic = new CeramicClient("https://ceramic-clay.3boxlabs.com");

// basic Profiles tiles
const aliases = {
  schemas: {
    basicProfile:
      "ceramic://k3y52l7qbv1frxt706gqfzmq6cbqdkptzk8uudaryhlkf6ly9vx21hqu4r6k1jqio",
  },
  definitions: {
    BasicProfile:
      "kjzl6cwe1jw145cjbeko9kil8g9bxszjhyde21ob8epxuxkaon1izyqsu8wgcic",
  },
  tiles: {},
};

const datastore = new DIDDataStore({ ceramic, model: aliases });

//sign-in with Ethereum
async function authenticateWithEthereum(ethereumProvider) {
  const accounts = await ethereumProvider.request({
    method: "eth_requestAccounts",
  });

  const authProvider = new EthereumAuthProvider(ethereumProvider, accounts[0]);

  const session = new DIDSession({ authProvider });

  const did = await session.authorize();

  ceramic.did = did;
}

//authorizes with Ethereum
async function auth() {
  if (window.ethereum == null) {
    throw new Error("No injected Ethereum provider found");
  }
  await authenticateWithEthereum(window.ethereum);
}

// retrieves data from the Ceramic network
async function getProfileFromCeramic() {
  try {
    //use the DIDDatastore to get profile data from Ceramic
    const profile = await datastore.get("BasicProfile");

    //render profile data to the DOM (not written yet)
    renderProfileData(profile);
  } catch (error) {
    console.error(error);
  }
}

// extract this profile data
function renderProfileData(data) {
  if (!data) return;
  data.name
    ? (profileName.innerHTML = "Name:     " + data.name)
    : (profileName.innerHTML = "Name:     ");
  data.gender
    ? (profileGender.innerHTML = "Gender:     " + data.gender)
    : (profileGender.innerHTML = "Gender:     ");
  data.country
    ? (profileCountry.innerHTML = "Country:     " + data.country)
    : (profileCountry.innerHTML = "Country:     ");
}

// writes data to the Ceramic Network
async function updateProfileOnCeramic() {
  try {
    const updatedProfile = getFormProfile();
    submitBtn.value = "Updating...";

    //use the DIDDatastore to merge profile data to Ceramic
    await datastore.merge("BasicProfile", updatedProfile);

    //use the DIDDatastore to get profile data from Ceramic
    const profile = await datastore.get("BasicProfile");

    renderProfileData(profile);

    submitBtn.value = "Submit";
  } catch (error) {
    console.error(error);
  }
}

//gets form profile
function getFormProfile() {
  const name = document.getElementById("name").value;
  const country = document.getElementById("country").value;
  const gender = document.getElementById("gender").value;

  return {
    name,
    country,
    gender,
  };
}

// connect wallet button
async function connectWallet(authFunction, callback) {
  try {
    walletBtn.innerHTML = "Connecting...";
    await authFunction();
    await callback();
    walletBtn.innerHTML = "Wallet Connected";
  } catch (error) {
    console.error(error);
  }
}

//event listners for button clicks
walletBtn.addEventListener(
  "click",
  async () => await connectWallet(auth, getProfileFromCeramic)
);

profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  await updateProfileOnCeramic();
});
