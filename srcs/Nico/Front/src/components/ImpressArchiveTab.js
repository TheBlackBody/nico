import React, { useEffect, useState } from 'react';
import { Button, Row, Col, Card, Breadcrumb } from 'react-bootstrap';

function ImpressArchiveTab({ thumbStyle, getCacheBustedPath, selectedDate }) {
  const [archiveFiles, setArchiveFiles] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [folderImages, setFolderImages] = useState([]);

  const todayKey = selectedDate || (() => {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}`;
  })();

  useEffect(() => {
    const fetchArchives = async () => {
      // Appel vers l'API des archives d'impression
      const response = await fetch(`/api/albums/impress-archives/?date=${todayKey}`);
      const data = await response.json();
      setArchiveFiles(data);
    };

    fetchArchives();
  }, [todayKey]);

  const archiveFolders = [...new Set(archiveFiles.map(item => item.folder.split('/')[0]))].filter(Boolean);

  const openFolder = (folderName) => {
    setSelectedFolder(folderName);
    setFolderImages(archiveFiles.filter(item => item.folder === folderName || item.folder.startsWith(`${folderName}/`)));
  };

  const clearFolder = () => {
    setSelectedFolder('');
    setFolderImages([]);
  };

  if (!selectedFolder) {
    return (
      <>
        <h3>Archives impression du {todayKey}</h3>
        {archiveFolders.length === 0 ? (
          <p>Aucune archive d’impression pour aujourd’hui.</p>
        ) : (
          <Row>
            {archiveFolders.map(folderName => (
              <Col md={4} key={folderName} className="mb-3">
                <Card>
                  <Card.Body>
                    <Card.Title>{folderName}</Card.Title>
                    <Card.Text>
                      {archiveFiles.filter(item => item.folder === folderName || item.folder.startsWith(`${folderName}/`)).length} image(s)
                    </Card.Text>
                    <Button variant="primary" onClick={() => openFolder(folderName)}>
                      Voir
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </>
    );
  }

  return (
    <>
      <Button variant="secondary" className="mb-3" onClick={clearFolder}>Retour</Button>
      <Breadcrumb>
        <Breadcrumb.Item onClick={clearFolder}>Archives impression</Breadcrumb.Item>
        <Breadcrumb.Item active>{selectedFolder}</Breadcrumb.Item>
      </Breadcrumb>
      <Row style={{ gap: '1rem' }}>
        {folderImages.map(item => (
          <Col md={3} key={item.path} className="mb-3">
            <Card className="h-100">
              <Card.Img src={getCacheBustedPath(item.path)} style={thumbStyle} />
              <Card.Body>
                <Card.Text>{item.path.split('/').pop()}</Card.Text>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
      {folderImages.length === 0 && <p>Aucune image trouvée dans cette archive d'impression.</p>}
    </>
  );
}

export default ImpressArchiveTab;