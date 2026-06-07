import React, { useEffect, useRef, useState } from 'react';
import { Button, Row, Col, Card, Breadcrumb } from 'react-bootstrap';
import ImageCard from './ImageCard';
import EditorPanel from './EditorPanel';

function EditTab({
  currentFolder,
  setCurrentFolder,
  handleBack,
  validatedEmails,
  currentValidatedImages,
  selectedImages,
  setSelectedImages,
  editingImage,
  setEditingImage,
  handleExitEditor,
  filters,
  setFilters,
  presetFilter,
  setPresetFilter,
  replacementFile,
  setReplacementFile,
  handleApplyEdits,
  handleReplaceImage,
  isApplying,
  thumbStyle,
  previewStyle,
  getPresetStyle,
  imagePreviewKey,
  getCacheBustedPath,
  isSamePath,
  normalizePath
}) {
  const [previewSrc, setPreviewSrc] = useState(null);
  const canvasRef = useRef(document.createElement('canvas'));

  useEffect(() => {
    if (!editingImage) {
      setPreviewSrc(null);
      return;
    }

    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = getCacheBustedPath(editingImage.path);

    const colorize = (data, index, black, white, t) => {
      data[index] = Math.min(255, Math.max(0, black[0] + (white[0] - black[0]) * t));
      data[index + 1] = Math.min(255, Math.max(0, black[1] + (white[1] - black[1]) * t));
      data[index + 2] = Math.min(255, Math.max(0, black[2] + (white[2] - black[2]) * t));
    };

    const applyPreset = (data, preset) => {
      const len = data.length;
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        if (preset === 'bw') {
          const gray = lum * 255;
          data[i] = data[i + 1] = data[i + 2] = gray;
        } else if (preset === 'sepia') {
          colorize(data, i, [112, 66, 20], [192, 160, 128], lum);
        } else if (preset === 'warm') {
          colorize(data, i, [255, 221, 193], [168, 90, 41], lum);
        } else if (preset === 'cool') {
          colorize(data, i, [200, 230, 255], [45, 111, 168], lum);
        } else if (preset === 'vibrant') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          data[i] = Math.min(255, Math.max(0, gray + (r - gray) * 1.4));
          data[i + 1] = Math.min(255, Math.max(0, gray + (g - gray) * 1.4));
          data[i + 2] = Math.min(255, Math.max(0, gray + (b - gray) * 1.4));
        }
      }
    };

    const applyBrightnessContrastSaturation = (data, brightness, contrast, saturation) => {
      const bFactor = brightness / 100;
      const cFactor = contrast / 100;
      const sFactor = saturation / 100;
      for (let i = 0; i < data.length; i += 4) {
        let r = data[i] * bFactor;
        let g = data[i + 1] * bFactor;
        let b = data[i + 2] * bFactor;
        const center = 128;
        r = (r - center) * cFactor + center;
        g = (g - center) * cFactor + center;
        b = (b - center) * cFactor + center;
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        data[i] = Math.min(255, Math.max(0, lum + (r - lum) * sFactor));
        data[i + 1] = Math.min(255, Math.max(0, lum + (g - lum) * sFactor));
        data[i + 2] = Math.min(255, Math.max(0, lum + (b - lum) * sFactor));
      }
    };

    const renderPreview = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      if (presetFilter && presetFilter !== 'none') {
        applyPreset(data, presetFilter);
      }
      applyBrightnessContrastSaturation(data, filters.brightness, filters.contrast, filters.saturation);
      ctx.putImageData(imageData, 0, 0);
      setPreviewSrc(canvas.toDataURL('image/jpeg', 0.9));
    };

    image.onload = renderPreview;
    image.onerror = () => setPreviewSrc(null);
  }, [editingImage, filters, presetFilter, getCacheBustedPath]);

  const handleSelect = (item) => {
    setSelectedImages(prev =>
      prev.some(img => isSamePath(img.path, item.path))
        ? prev.filter(i => !isSamePath(i.path, item.path))
        : [...prev, item]
    );
  };

  const handleEdit = (item) => {
    setEditingImage(item);
    setFilters({ brightness: 100, contrast: 100, saturation: 100 });
    setPresetFilter('none');
  };

  if (!currentFolder) {
    return (
      <Row>
        {validatedEmails.map(email => (
          <Col md={3} key={email}>
            <Card>
              <Card.Body>
                <Card.Title>{email}</Card.Title>
                <Button onClick={() => setCurrentFolder(email)}>Voir Images</Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  if (editingImage) {
    return (
      <div className="mt-3 d-flex flex-column" style={{ gap: '1rem' }}>
        <Button variant="secondary" onClick={handleExitEditor}>Retour au dossier</Button>
        <div className="d-flex flex-column flex-lg-row" style={{ gap: '1rem' }}>
          <div style={{ flex: 1, minWidth: 320, maxWidth: 520 }}>
            <h3>Prévisualisation</h3>
            <div style={{ ...previewStyle, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <img
                src={previewSrc || getCacheBustedPath(editingImage.path)}
                style={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                alt="Editing"
              />
            </div>
          </div>
          <EditorPanel
            presetFilter={presetFilter}
            setPresetFilter={setPresetFilter}
            filters={filters}
            setFilters={setFilters}
            replacementFile={replacementFile}
            setReplacementFile={setReplacementFile}
            handleExitEditor={handleExitEditor}
            handleApplyEdits={handleApplyEdits}
            handleReplaceImage={handleReplaceImage}
            isApplying={isApplying}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <Button variant="secondary" className="mb-3" onClick={handleBack}>Retour</Button>
      <Breadcrumb>
        <Breadcrumb.Item onClick={handleBack}>Emails</Breadcrumb.Item>
        <Breadcrumb.Item active>{currentFolder}</Breadcrumb.Item>
      </Breadcrumb>
      <Row style={{ gap: '1rem' }}>
        {currentValidatedImages.map(item => (
          <Col md={3} key={item.path}>
            <ImageCard
              item={item}
              thumbStyle={thumbStyle}
              onSelect={handleSelect}
              isSelected={selectedImages.some(img => isSamePath(img.path, item.path))}
              onEdit={handleEdit}
              showEditButton={true}
              getCacheBustedPath={getCacheBustedPath}
            />
          </Col>
        ))}
      </Row>
      {selectedImages.length > 0 && (
        <div className="mt-3">
          <p>Images sélectionnées pour édition:</p>
          {selectedImages.map(img => (
            <Button
              key={normalizePath(img.path)}
              onClick={() => handleEdit(img)}
              className="me-2"
            >
              {normalizePath(img.path).split('/').pop()}
            </Button>
          ))}
        </div>
      )}
    </>
  );
}

export default EditTab;