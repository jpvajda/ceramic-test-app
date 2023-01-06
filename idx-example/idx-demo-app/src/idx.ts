import {CeramicClient} from '@ceramicnetwork/http-client'
import { IDX } from '@ceramicstudio/idx'
import { Ed25519Provider } from 'key-did-provider-ed25519'
import { getResolver } from '@ceramicnetwork/3id-did-resolver';
import KeyDidResolver from 'key-did-resolver';
import { Resolver } from 'did-resolver';
import { DID } from 'dids';

import { definitions } from './config.json'

const CERAMIC_URL = 'http://localhost:7007'

export type NoteItem = {
  id: string
  title: string
}

export type NotesList = { notes: Array<NoteItem> }

export type IDXInit = NotesList & {
  ceramic: CeramicClient
  idx: IDX
}

export async function getIDX(seed: Uint8Array): Promise<IDXInit> {
  // Create the Ceramic instance and inject DID provider and resolver
  const ceramic = new CeramicClient(CERAMIC_URL)
  const resolver = new Resolver({
      ...KeyDidResolver.getResolver(),
      ...getResolver(ceramic) })
  const provider = new Ed25519Provider(seed)
  const did = new DID({ provider, resolver })
  await ceramic.setDID(did)
  await did.authenticate()
   // Mount the DID object to your Ceramic object
   ceramic.did = did

  // Create the IDX instance with the definitions aliases from the config
  const idx = new IDX({ceramic, aliases: definitions })

  // Load the existing notes
  const notesList = await idx.get<{ notes: Array<NoteItem> }>('notes')
  return { ceramic, idx, notes: notesList?.notes ?? [] }
}