import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Client from "./pages/Client";
import Vendeur from "./pages/Vendeur";
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [backgroundImagePath, setBackgroundImagePath] = useState('/backgroudNoel2.jpg');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Charger les paramètres depuis l'API au démarrage
    fetch('/api/albums/app-settings/')
      .then(res => res.json())
      .then(data => {
        setBackgroundImagePath(data.background_image_path || '/backgroudNoel2.jpg');
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur lors du chargement des paramètres:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (backgroundImagePath) {
      document.body.style.backgroundImage = `url(${backgroundImagePath})`;
      document.body.style.backgroundSize = 'cover';
      document.body.style.backgroundPosition = 'center';
      document.body.style.backgroundRepeat = 'no-repeat';
    } else {
      document.body.style.backgroundImage = 'none';
    }
  }, [backgroundImagePath]);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Client />} />
        <Route
          path="/vendeur"
          element={<Vendeur setGlobalBackgroundImagePath={setBackgroundImagePath} backgroundImagePath={backgroundImagePath} />}
        />
      </Routes>
    </Router>
  );
}

export default App;

