import {applyMiddleware, compose, createStore, Dispatch, Middleware, Reducer} from "redux";

import {INITIAL_STATE, State} from "../state/store-structure";
import {ActionByType, AllActionTypes} from "../actions/all-actions";
// import {setAutoFreeze} from "immer";

export * from "../state/store-structure";

type MiniReducer<Action extends AllActionTypes = AllActionTypes> = (state: State, action: Action) => State;
type MiniReducerTest = (action: AllActionTypes) => boolean;

type u = AllActionTypes["type"];
const oo: AllActionTypes = {
  type: "store-initialized"
}
const k: u = "store-initialized";

type RegisteredReducer = {
  test: MiniReducerTest;
  reducer: Reducer;
};

const allRawReducer: RegisteredReducer[] = [];

export function addRawActionReducer<Attr extends AllActionTypes["type"]>(
  type: Attr,
  reducer: MiniReducer<ActionByType<Attr>>
) {
  allRawReducer.push({
    test: a => a.type == type,
    reducer: reducer as MiniReducer,
  });
}

// TODO unify addActionReducer and addActionListener

// setAutoFreeze(false);

const defReducer: Reducer<State, AllActionTypes> = (state, action): State => {
  if (state == undefined) return INITIAL_STATE;

  for (const reducer of allRawReducer) {
    if (reducer.test(action)) {
      state = reducer.reducer(state, action);
    }
  }

  return state as State;
};

type ActionListener<Action extends AllActionTypes> = (
  action: Action,
  dispatch: Dispatch<AllActionTypes>,
  getState: () => State
) => Promise<void> | void;

const allListener: {
  test: (action: any) => boolean;
  listener: ActionListener<AllActionTypes>;
}[] = [];

export function addActionListener<Attr extends AllActionTypes["type"]>(
  attr: Attr,
  listener: ActionListener<ActionByType<Attr>>
) {
  allListener.push({
    test: a => typeof a == "object" && a.type == attr,
    listener: listener as ActionListener<AllActionTypes>,
  });
}

const actionListenerMiddleware: Middleware<Dispatch<AllActionTypes>, State, Dispatch<AllActionTypes>> =
  storeAPI => next => async possibleAction => {
    const nextRes = next(possibleAction);

    for (const listener of allListener) {
      if (listener.test(possibleAction)) {
        await listener.listener(possibleAction, storeAPI.dispatch, storeAPI.getState);
      }
    }

    return nextRes;
  };

const composeEnhancers =
  typeof window === "object" && (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    ? (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
        // Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
      })
    : compose;

const enhancer = composeEnhancers(applyMiddleware(actionListenerMiddleware));

export const store = createStore(defReducer, enhancer);
export const dispatch = store.dispatch;

Promise.resolve().then(() => dispatch({type: "store-initialized"}));
