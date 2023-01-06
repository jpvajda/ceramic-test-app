import { TileDocument } from '@ceramicnetwork/stream-tile'
import type Ceramic from '@ceramicnetwork/http-client'
import type { IDX } from '@ceramicstudio/idx'
import { useCallback, useReducer } from 'react'

import { schemas } from './config.json'
import { getIDX } from './idx'
import type { IDXInit, NotesList } from './idx'
import { CeramicClient } from '@ceramicnetwork/http-client'

type AuthStatus = 'pending' | 'loading' | 'failed'
export type DraftStatus = 'unsaved' | 'saving' | 'failed' | 'saved'
type NoteLoadingStatus = 'init' | 'loading' | 'loading failed'
type NoteSavingStatus = 'loaded' | 'saving' | 'saving failed' | 'saved'

type UnauthenticatedState = { status: AuthStatus }
type AuthenticatedState = { status: 'done'; ceramic: CeramicClient; idx: IDX }
export type AuthState = UnauthenticatedState | AuthenticatedState

type NavDefaultState = { type: 'default' }
type NavDraftState = { type: 'draft' }
type NavNoteState = { type: 'note'; streamID: string }

export type IndexLoadedNote = { status: NoteLoadingStatus; title: string }
export type StoredNote = {
  status: NoteSavingStatus
  title: string
  doc: TileDocument
}

type Store = {
  draftStatus: DraftStatus
  notes: Record<string, IndexLoadedNote | StoredNote>
}
type DefaultState = {
  auth: AuthState
  nav: NavDefaultState
}
type NoteState = {
  auth: AuthenticatedState
  nav: NavDraftState | NavNoteState
}
export type State = Store & (DefaultState | NoteState)

type AuthAction = { type: 'auth'; status: AuthStatus }
type AuthSuccessAction = { type: 'auth success' } & IDXInit
type NavResetAction = { type: 'nav reset' }
type NavDraftAction = { type: 'nav draft' }
type NavNoteAction = { type: 'nav note'; streamID: string }
type DraftDeleteAction = { type: 'draft delete' }
type DraftStatusAction = { type: 'draft status'; status: 'saving' | 'failed' }
type DraftSavedAction = {
  type: 'draft saved'
  title: string
  streamID: string
  doc: TileDocument
}
type NoteLoadedAction = { type: 'note loaded'; streamID: string; doc: TileDocument }
type NoteLoadingStatusAction = {
  type: 'note loading status'
  streamID: string
  status: NoteLoadingStatus
}
type NoteSavingStatusAction = {
  type: 'note saving status'
  streamID: string
  status: NoteSavingStatus
}
type Action =
  | AuthAction
  | AuthSuccessAction
  | NavResetAction
  | NavDraftAction
  | NavNoteAction
  | DraftDeleteAction
  | DraftStatusAction
  | DraftSavedAction
  | NoteLoadedAction
  | NoteLoadingStatusAction
  | NoteSavingStatusAction

  function reducer(state: State, action: Action): State {
    switch (action.type) {
      case 'auth':
        return {
          ...state,
          nav: { type: 'default' },
          auth: { status: action.status },
        }
      case 'auth success': {
        const auth = {
          status: 'done',
          ceramic: action.ceramic,
          idx: action.idx,
        } as AuthenticatedState
        return action.notes.length
          ? {
              ...state,
              auth,
              notes: action.notes.reduce((acc, item) => {
                acc[item.id] = { status: 'init', title: item.title }
                return acc
              }, {} as Record<string, IndexLoadedNote>),
            }
          : {
              auth,
              draftStatus: 'unsaved',
              nav: { type: 'draft' },
              notes: {},
            }
      }
      case 'nav reset':
        return { ...state, nav: { type: 'default' } }
      case 'nav draft':
        return {
          ...state,
          auth: state.auth as AuthenticatedState,
          nav: { type: 'draft' },
        }
      case 'draft status':
        return {
          ...state,
          auth: state.auth as AuthenticatedState,
          draftStatus: action.status,
        }
      case 'draft delete':
        return {
          ...state,
          draftStatus: 'unsaved',
          nav: { type: 'default' },
        }
      case 'draft saved': {
        return {
          auth: state.auth as AuthenticatedState,
          draftStatus: 'unsaved',
          nav: { type: 'note', streamID: action.streamID },
          notes: {
            ...state.notes,
            [action.streamID]: {
              status: 'saved',
              title: action.title,
              doc: action.doc,
            },
          },
        }
      }
      case 'nav note':
        return {
          ...state,
          auth: state.auth as AuthenticatedState,
          nav: {
            type: 'note',
            streamID: action.streamID,
          },
        }
      case 'note loaded': {
        const id = (state.nav as NavNoteState).streamID
        const noteState = state.notes[id]
        return {
          ...state,
          auth: state.auth as AuthenticatedState,
          notes: {
            ...state.notes,
            [id]: {
              status: 'loaded',
              title: noteState.title,
              doc: action.doc,
            },
          },
        }
      }
      case 'note loading status': {
        const id = (state.nav as NavNoteState).streamID
        const noteState = state.notes[id] as IndexLoadedNote
        return {
          ...state,
          auth: state.auth as AuthenticatedState,
          notes: {
            ...state.notes,
            [id]: { ...noteState, status: action.status },
          },
        }
      }
      case 'note saving status': {
        const id = (state.nav as NavNoteState).streamID
        const noteState = state.notes[id] as StoredNote
        return {
          ...state,
          auth: state.auth as AuthenticatedState,
          notes: {
            ...state.notes,
            [id]: { ...noteState, status: action.status },
          },
        }
      }
    }
  }

  export function useApp() {
    const [state, dispatch] = useReducer(reducer, {
      auth: { status: 'pending' },
      draftStatus: 'unsaved',
      nav: { type: 'default' },
      notes: {},
    })

    const authenticate = useCallback((seed: Uint8Array) => {
      dispatch({ type: 'auth', status: 'loading' })
      getIDX(seed).then(
        (init) => {
          dispatch({ type: 'auth success', ...init })
        },
        (err) => {
          console.warn('authenticate call failed', err)
          dispatch({ type: 'auth', status: 'failed' })
        },
      )
    }, [])

    const openDraft = useCallback(() => {
      dispatch({ type: 'nav draft' })
    }, [])

    const deleteDraft = useCallback(() => {
      dispatch({ type: 'draft delete' })
    }, [])

    const saveDraft = useCallback(
      (title: string, text: string) => {
        dispatch({ type: 'draft status', status: 'saving' })
        const { ceramic, idx } = state.auth as AuthenticatedState
        Promise.all([
          TileDocument.create(
            ceramic,
            { date: new Date().toISOString(), text },
            { controllers: [idx.id], schema: schemas.Note },
          ),
          idx.get<NotesList>('notes'),
        ])
          .then(([doc, notesList]) => {
            const notes = notesList?.notes ?? []
            return idx
              .set('notes', {
                notes: [{ id: doc.id.toUrl(), title }, ...notes],
              })
              .then(() => {
                const streamID = doc.id.toString()
                dispatch({ type: 'draft saved', streamID, title, doc })
              })
          })
          .catch((err) => {
            console.log('failed to save draft', err)
            dispatch({ type: 'draft status', status: 'failed' })
          })
      },
      [state.auth],
    )

    const openNote = useCallback(
      (streamID: string) => {
        dispatch({ type: 'nav note', streamID })

        if (state.notes[streamID] == null || state.notes[streamID].status === 'init') {
          const { ceramic } = state.auth as AuthenticatedState
          ceramic.loadStream<TileDocument>(streamID).then(
            (doc: any) => {
              dispatch({ type: 'note loaded', streamID, doc })
            },
            () => {
              dispatch({
                type: 'note loading status',
                streamID,
                status: 'loading failed',
              })
            },
          )
        }
      },
      [state.auth, state.notes],
    )

    const saveNote = useCallback((doc: TileDocument, text: string) => {
      const streamID = doc.id.toString()
      dispatch({ type: 'note saving status', streamID, status: 'saving' })
      doc.update({ date: new Date().toISOString(), text }).then(
        () => {
          dispatch({ type: 'note saving status', streamID, status: 'saved' })
        },
        () => {
          dispatch({ type: 'note saving status', streamID, status: 'saving failed' })
        },
      )
    }, [])

    return {
      authenticate,
      deleteDraft,
      openDraft,
      openNote,
      saveDraft,
      saveNote,
      state,
    }
  }