import React from "react";
import { Routes, Route } from "react-router-dom";

import NotFound from "./pages/NotFound";
import "bootstrap/dist/css/bootstrap.min.css";
import Cobol from "./pages/Cobol";



export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Cobol />} />
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
  