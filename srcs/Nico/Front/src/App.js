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
      // FIXATION PICASA : L'image reste figée en arrière-plan, le contenu glisse dessus sans déformer l'écran
      document.body.style.backgroundAttachment = 'fixed';
      document.body.style.minHeight = '100vh';
      document.body.style.margin = '0';
    } else {
      document.body.style.backgroundImage = 'none';
    }
  }, [backgroundImagePath]);

  if (loading) {
    return <div className="text-white text-center mt-5 fs-4">Chargement...</div>;
  }

  return (
    // On englobe les routes dans un conteneur principal qui force le respect du layout
    <div style={{ minHeight: '100vh', width: '100%', position: 'relative', zIndex: 1 }}>
      <Router>
        <Routes>
          <Route path="/" element={<Client />} />
          <Route
            path="/vendeur"
            element={<Vendeur setGlobalBackgroundImagePath={setBackgroundImagePath} backgroundImagePath={backgroundImagePath} />}
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;