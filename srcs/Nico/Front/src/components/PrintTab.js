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
              <div key={normalizePath(img.path)} style={{ width: '180px' }}>
                <img
                  src={getCacheBustedPath(img.path)}
                  style={{ width: '100%', height: '140px', objectFit: 'cover', border: '1px solid #ddd' }}
                  alt="print preview"
                />
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