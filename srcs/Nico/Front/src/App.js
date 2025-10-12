import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Client from "./pages/Client";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Client />} />
      </Routes>
    </Router>
  );
}

export default App;

