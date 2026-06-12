import React from 'react';
import { Button, Form } from 'react-bootstrap';

function PrintTab({
  selectedImages,
  setActiveTab,
  printFormat,
  setPrintFormat,
  handlePrint,
  getCacheBustedPath,
  normalizePath,
  selectedDate
}) {

  // --- CALCUL DU RATIO D'ASPECT ---
  // On extrait la largeur et la hauteur (ex: "10x15" -> width: 10, height: 15)
  const [formatWidth, formatHeight] = printFormat.split('x').map(Number);
  // On calcule le ratio (ex: 15 / 10 = 1.5)
  const aspectRatio = formatWidth && formatHeight ? formatWidth / formatHeight : 1;

  return (
    <div className="mt-3">
      <Button variant="secondary" className="mb-3" onClick={() => setActiveTab('edit')}>
        Retour à l'édition
      </Button>
      {selectedImages.length === 0 ? (
        <div>Aucune image sélectionnée pour impression. Sélectionnez des images dans l'onglet d'édition.</div>
      ) : (
        <>
          <Form.Group className="mb-3" style={{ maxWidth: 320 }}>
            <Form.Label>Format d'impression</Form.Label>
            <Form.Select value={printFormat} onChange={e => setPrintFormat(e.target.value)}>
              <option value="5x15">5x15 cm</option>
              <option value="9x13">9x13 cm</option>
              <option value="10x15">10x15 cm</option>
              <option value="11.5x15">11.5x15 cm</option>
              <option value="13x18">13x18 cm</option>
              <option value="15x20">15x20 cm</option>
              <option value="15x23">15x23 cm</option>
              <option value="15x15">15x15 cm</option>
            </Form.Select>
          </Form.Group>
          
          <div className="d-flex flex-wrap" style={{ gap: '1rem' }}>
            {selectedImages.map(img => (
              <div key={normalizePath(img.path)} style={{ width: '150px' }}>
                <div 
                  style={{
                    width: '100%',
                    // La magie opère ici : la hauteur s'adapte automatiquement au format sélectionné !
                    aspectRatio: `${aspectRatio}`, 
                    border: '1px solid #ddd',
                    backgroundColor: '#f0f0f0',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <img
                    src={getCacheBustedPath(img.path)}
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      // 'contain' garantit que TOUTE l'image d'origine est visible sans être rognée
                      objectFit: 'contain' 
                    }}
                    alt="print preview"
                  />
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-3">
            <Button variant="primary" onClick={handlePrint}>Imprimer</Button>
          </div>
        </>
      )}
    </div>
  );
}

export default PrintTab;