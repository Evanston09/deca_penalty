import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from "react-router";
import Upload from './pages/Upload.tsx';
import Results from './pages/Results.tsx';
import Layout from './layout/Layout.tsx';
import './index.css';
import '@fontsource-variable/inter';
import '@fontsource-variable/montserrat';

createRoot(document.getElementById('root')!).render(
    // <StrictMode>
        <BrowserRouter>
            <Routes>
                <Route path='/' element={<Layout />}>
                    <Route index element={<Upload />} />
                    <Route path="/results" element={<Results />} />
                </Route>
            </Routes>
        </BrowserRouter>
    // </StrictMode>
);
