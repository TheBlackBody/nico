import React from 'react';
import { Button, Row, Col, Card, Breadcrumb, Form } from 'react-bootstrap';
import ImageCard from './ImageCard';

function MailSendTab({
  currentFolder,
  setCurrentFolder,
  handleBack,
  wabEmails,
  currentWabImages,
  selectedImages,
  setSelectedImages,
  email,
  setEmail,
  thumbStyle,
  getCacheBustedPath,
  isSamePath
}) {
  const allSelected = currentWabImages.length > 0 && currentWabImages.every(item => selectedImages.some(img => isSamePath(img.path, item.path)));

  const handleSelect = (item) => {
    setSelectedImages(prev =>
      prev.some(img => isSamePath(img.path, item.path))
        ? prev.filter(i => !isSamePath(i.path, item.path))
        : [...prev, item]
    );
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedImages([]);
    } else {
      setSelectedImages(currentWabImages);
    }
  };

  const handleSendEmail = async () => {
    const targetEmail = currentFolder || email;
    if (!targetEmail) {
      alert('Aucune adresse email définie pour ce dossier.');
      return;
    }

    const response = await fetch('/api/albums/send-email/', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: targetEmail,
        folder: `wab_validation/${targetEmail}`,
        files: selectedImages.map(img => img.path.split('?')[0])
      }),
    });

    const data = await response.json();
    if (response.ok) {
      alert(data.message);
      setSelectedImages([]);
      setCurrentFolder('');
      setEmail('');
    } else {
      alert(data.error || 'Erreur lors de l’envoi du mail.');
    }
  };

  if (!currentFolder) {
    return (
      <Row>
        {wabEmails.map(emailItem => (
          <Col md={3} key={emailItem} className="mb-3">
            <Card>
              <Card.Body>
                <Card.Title>{emailItem}</Card.Title>
                <Button variant="primary" onClick={() => setCurrentFolder(emailItem)}>
                  Voir Images
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <>
      <Button variant="secondary" className="mb-3" onClick={handleBack}>Retour</Button>
      <Breadcrumb>
        <Breadcrumb.Item onClick={handleBack}>Emails</Breadcrumb.Item>
        <Breadcrumb.Item active>{currentFolder}</Breadcrumb.Item>
      </Breadcrumb>
      <div className="d-flex flex-wrap gap-2 mb-3" style={{ alignItems: 'center' }}>
        <Button variant="secondary" onClick={handleSelectAll}>
          {allSelected ? 'Tout désélectionner' : 'Tout sélectionner'}
        </Button>
        <Button variant="primary" onClick={handleSendEmail} disabled={selectedImages.length === 0}>
          Valider et envoyer
        </Button>
        <div className="text-muted">Envoi vers : <strong>{currentFolder}</strong></div>
      </div>
      <Row style={{ gap: '1rem' }}>
        {currentWabImages.map(item => (
          <Col md={3} key={item.path} className="mb-3">
            <ImageCard
              item={item}
              thumbStyle={thumbStyle}
              onSelect={handleSelect}
              isSelected={selectedImages.some(img => isSamePath(img.path, item.path))}
              getCacheBustedPath={getCacheBustedPath}
            />
          </Col>
        ))}
      </Row>
      {selectedImages.length > 0 && (
        <div className="mt-3">
          <Form>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control type="email" value={currentFolder} readOnly />
            </Form.Group>
          </Form>
        </div>
      )}
    </>
  );
}

export default MailSendTab;
