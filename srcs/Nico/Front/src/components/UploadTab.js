import React, { useState } from 'react';
import { Form, Button, Tabs, Tab } from 'react-bootstrap';

function UploadTab({ 
  photographer, 
  setPhotographer, 
  files, 
  setFiles, 
  handleUpload 
}) {
  // États locaux pour le second onglet "Envoi Direct"
  const [directEmail, setDirectEmail] = useState('');
  const [directFiles, setDirectFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  // Gestion du changement de fichiers pour l'envoi direct (Images + Vidéos)
  const handleDirectFilesChange = (e) => {
    setDirectFiles(Array.from(e.target.files));
  };

  // Requête d'envoi direct calquée sur la logique de MailSendTab
  const handleDirectSend = async (e) => {
    e.preventDefault();

    if (!directEmail) {
      alert("Veuillez renseigner une adresse email.");
      return;
    }

    if (directFiles.length === 0) {
      alert("Veuillez sélectionner au moins un fichier.");
      return;
    }

    setLoading(false);

    try {
      // NOTE : Comme ce sont de nouveaux fichiers (et potentiellement des vidéos),
      // on utilise FormData pour envoyer les fichiers réels au backend.
      const formData = new FormData();
      formData.append('email', directEmail);
      formData.append('folder', `wab_validation/${directEmail}`);
      
      directFiles.forEach((file) => {
        formData.append('files', file); 
      });

      const response = await fetch('/api/albums/send-video/', {
        method: 'POST',
        body: formData, // Envoi du FormData (pas de Header Content-Type requis, le navigateur s'en charge)
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message || 'Mail envoyé avec succès !');
        setDirectEmail('');
        setDirectFiles([]);
      } else {
        alert(data.error || 'Erreur lors de l’envoi du mail.');
      }
    } catch (error) {
      console.error(error);
      alert('Une erreur est survenue lors de la communication avec le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Tabs defaultActiveKey="photographer" id="upload-tab-modes" className="mb-4">
      
      {/* 1ER ONGLET : PHOTOGRAPHE (La base d'origine conservée telle quelle) */}
      <Tab eventKey="photographer" title="Photographe">
        <Form onSubmit={(e) => e.preventDefault()}>
          <Form.Group className="mb-3">
            <Form.Label>Nom du Photographe</Form.Label>
            <Form.Control
              type="text"
              value={photographer}
              onChange={e => setPhotographer(e.target.value)}
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Images</Form.Label>
            <Form.Control
              type="file"
              multiple
              onChange={e => setFiles(Array.from(e.target.files))}
            />
          </Form.Group>
          <Button onClick={handleUpload} variant="primary">Uploader</Button>
        </Form>
      </Tab>

      {/* 2È ME ONGLET : ENVOI DIRECT (Nouveau système calqué sur MailSendTab) */}
      <Tab eventKey="direct-send" title="Envoi Direct">
        <Form onSubmit={handleDirectSend}>
          <Form.Group className="mb-3">
            <Form.Label>Adresse Email du destinataire</Form.Label>
            <Form.Control
              type="email"
              placeholder="exemple@domaine.com"
              value={directEmail}
              onChange={e => setDirectEmail(e.target.value)}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Fichiers (Images & Vidéos)</Form.Label>
            <Form.Control
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleDirectFilesChange}
              required
            />
            <Form.Text className="text-muted">
              Vous pouvez sélectionner plusieurs images et/ou vidéos simultanément.
            </Form.Text>
          </Form.Group>

          <Button 
            variant="success" 
            type="submit" 
            disabled={loading || !directEmail || directFiles.length === 0}
          >
            {loading ? 'Envoi en cours...' : 'Valider et envoyer'}
          </Button>
        </Form>
      </Tab>

    </Tabs>
  );
}

export default UploadTab;