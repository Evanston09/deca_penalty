import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import Upload from "./pages/Upload.tsx";
import Results from "./pages/Results.tsx";
import Error from "./pages/Error.tsx";
import Limitations from './pages/Limitations.tsx';
import Layout from "./layout/Layout.tsx";
import "./index.css";

// https://github.com/fontsource/fontsource/issues/1038
// @ts-expect-error This is an active issue will look into it
import "@fontsource-variable/montserrat";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Upload />} />
          <Route path="/results" element={<Results />} />
          <Route path="/limitations" element={<Limitations />} />
          <Route path="*" element={<Error message="404 Page Not Found!" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
