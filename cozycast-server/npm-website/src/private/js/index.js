if (process.env.NODE_ENV === 'development') {
  require("preact/debug");
}
import { render, h, } from 'preact'
import { App } from './App'
import { createAppState } from "./appstate/createAppState";
import { AppStateContext } from "./appstate/AppStateContext";

render(
  <AppStateContext.Provider value={createAppState()}>
    <App />
  </AppStateContext.Provider> , document.body
);