import React from 'react';
import { Form, Button } from 'react-bootstrap';

function UploadTab({ photographer, setPhotographer, files, setFiles, handleUpload }) {
  return (
    <Form>
      <Form.Group>
        <Form.Label>Nom du Photographe</Form.Label>
        <Form.Control
          type="text"
          value={photographer}
          onChange={e => setPhotographer(e.target.value)}
        />
      </Form.Group>
      <Form.Group>
        <Form.Label>Images</Form.Label>
        <Form.Control
          type="file"
          multiple
          onChange={e => setFiles(Array.from(e.target.files))}
        />
      </Form.Group>
      <Button onClick={handleUpload}>Uploader</Button>
    </Form>
  );
}

export default UploadTab;