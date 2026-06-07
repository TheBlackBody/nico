import React from 'react';
import { Form, Button } from 'react-bootstrap';

function EditorPanel({
  presetFilter,
  setPresetFilter,
  filters,
  setFilters,
  replacementFile,
  setReplacementFile,
  handleExitEditor,
  handleApplyEdits,
  handleReplaceImage,
  isApplying
}) {
  return (
    <div style={{ flex: 1, minWidth: 320 }}>
      <h3>Détails du filtre</h3>
      <Form.Group className="mb-3">
        <Form.Label>Effet</Form.Label>
        <Form.Select value={presetFilter} onChange={e => setPresetFilter(e.target.value)}>
          <option value="none">Aucun</option>
          <option value="sepia">Sépia</option>
          <option value="bw">Noir et blanc</option>
          <option value="warm">Réchauffer</option>
          <option value="cool">Froid</option>
          <option value="vibrant">Vibrant</option>
        </Form.Select>
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Luminosité: {filters.brightness}%</Form.Label>
        <Form.Range
          min="0"
          max="200"
          value={filters.brightness}
          onChange={e => setFilters({...filters, brightness: e.target.value})}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Contraste: {filters.contrast}%</Form.Label>
        <Form.Range
          min="0"
          max="200"
          value={filters.contrast}
          onChange={e => setFilters({...filters, contrast: e.target.value})}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Saturation: {filters.saturation}%</Form.Label>
        <Form.Range
          min="0"
          max="200"
          value={filters.saturation}
          onChange={e => setFilters({...filters, saturation: e.target.value})}
        />
      </Form.Group>
      <Form.Group className="mb-3">
        <Form.Label>Remplacer l'image</Form.Label>
        <Form.Control
          type="file"
          accept="image/*"
          onChange={e => setReplacementFile(e.target.files[0] || null)}
        />
        {replacementFile && <div className="mt-2">Fichier sélectionné : {replacementFile.name}</div>}
      </Form.Group>
      <div className="d-flex gap-2">
        <Button onClick={handleExitEditor}>Retour au dossier</Button>
        <Button variant="secondary" onClick={handleApplyEdits} disabled={isApplying}>
          Appliquer Modifications
        </Button>
        <Button variant="primary" onClick={handleReplaceImage} disabled={!replacementFile}>
          Remplacer le fichier
        </Button>
      </div>
    </div>
  );
}

export default EditorPanel;