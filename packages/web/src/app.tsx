import "./app.css";

import { FileRoutes } from "@solidjs/start/router";
import Nav from "./components/Nav";
import { Router } from "@solidjs/router";
import { Suspense } from "solid-js";

export default function App() {
  return (
    <Router
      root={(props) => (
        <>
          <Nav />
          <Suspense>{props.children}</Suspense>
        </>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
