import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Table, Nav } from 'react-bootstrap';

// --- SOUS-COMPOSANT : CARTE POUR CONFIGURER CHAQUE IMAGE ---
function PrintImageCard({
  img,
  onAddToBasket,
  getCacheBustedPath,
  normalizePath
}) {
  const [localFormat, setLocalFormat] = useState('10x15');
  const [quantity, setQuantity] = useState(1);
  const [isLandscape, setIsLandscape] = useState(true);

  useEffect(() => {
    const imageElement = new Image();
    imageElement.src = getCacheBustedPath(img.path);
    imageElement.onload = () => {
      setIsLandscape(imageElement.width > imageElement.height);
    };
  }, [img.path, getCacheBustedPath]);

  const [dimA, dimB] = localFormat.split('x').map(Number);
  
  let width = isLandscape ? Math.max(dimA, dimB) : Math.min(dimA, dimB);
  let height = isLandscape ? Math.min(dimA, dimB) : Math.max(dimA, dimB);
  const aspectRatio = width / height;

  return (
    <Card style={{ width: '190px', border: 'none' }} className="shadow-sm p-2 bg-light">
      <div 
        style={{
          width: '100%',
          aspectRatio: `${aspectRatio}`, 
          border: '2px solid #333',
          backgroundColor: '#eaeaea',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px'
        }}
      >
        <img
          src={getCacheBustedPath(img.path)}
          style={{ width: '100%', height: '100%', objectFit: 'fill' }}
          alt="Preview"
        />
      </div>

      <Card.Body className="p-0 mt-2 d-flex flex-column gap-2">
        <Form.Group>
          <Form.Label className="small mb-0 fw-bold text-dark">Format</Form.Label>
          <Form.Select 
            size="sm" 
            value={localFormat} 
            onChange={e => setLocalFormat(e.target.value)}
          >
            <option value="5x8">5x8 cm (Mini)</option>
            <option value="10x15">10x15 cm (Standard)</option>
            <option value="15x20">15x20 cm (Max Plein)</option>
            <option value="9x13">9x13 cm</option>
            <option value="11.5x15">11.5x15 cm</option>
            <option value="13x18">13x18 cm</option>
            <option value="15x15">15x15 cm (Carré)</option>
          </Form.Select>
        </Form.Group>

        <Form.Group>
          <Form.Label className="small mb-0 fw-bold text-dark">Quantité</Form.Label>
          <Form.Control 
            type="number" 
            size="sm" 
            min="1" 
            value={quantity} 
            onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </Form.Group>

        <Button 
          variant="success" 
          size="sm" 
          className="fw-bold mt-1"
          onClick={() => onAddToBasket(img, `${width}x${height}`, quantity)}
        >
          ➕ Ajouter au panier
        </Button>
      </Card.Body>
    </Card>
  );
}

// --- COMPOSANT PRINCIPAL ---
function PrintTab({
  selectedImages,
  setActiveTab,
  handlePrint, 
  getCacheBustedPath,
  normalizePath
}) {
  const [basket, setBasket] = useState([]);
  const [activeFormatTab, setActiveFormatTab] = useState('');
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    const formatsDispo = [...new Set(basket.map(item => item.format))];
    if (formatsDispo.length > 0 && !formatsDispo.includes(activeFormatTab)) {
      setActiveFormatTab(formatsDispo[0]);
    }
  }, [basket, activeFormatTab]);

  const addToBasket = (img, format, qty) => {
    setBasket(prev => {
      const existingIndex = prev.findIndex(item => item.img.path === img.path && item.format === format);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += qty;
        return updated;
      }
      const newBasket = [...prev, { img, format, quantity: qty }];
      setActiveFormatTab(format); 
      return newBasket;
    });
  };

  const removeFromBasket = (index) => {
    setBasket(prev => prev.filter((_, i) => i !== index));
  };

  const clearBasket = () => setBasket([]);

  // --- ARCHIVAGE VIA BACKEND PYTHON (Dossier complet) ---
  const handleArchiveBasket = () => {
    if (basket.length === 0) return;
    setIsArchiving(true);

    // Récupère la liste de tous les chemins d'images présents dans le panier actuel
    const filePaths = basket.map(item => item.img.path);

    // On prépare la charge utile attendue par la route Django : {'files': [...]}
    const archiveData = {
      files: filePaths
    };

    fetch('/api/albums/archive-print/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(archiveData)
    })
    .then(res => {
      if (!res.ok) throw new Error("Erreur lors de l'envoi de la demande d'archivage");
      return res.json();
    })
    .then(data => {
      if (data.error) {
        alert(`⚠️ Erreur : ${data.error}`);
      } else {
        alert("📦 Dossier client archivé avec succès !");
        clearBasket();
      }
    })
    .catch(err => {
      console.error(err);
      alert("⚠️ Impossible de joindre le serveur d'archivage.");
    })
    .finally(() => {
      setIsArchiving(false);
    });
  };

  // --- LOGIQUE D'IMPRESSION COMPATIBLE MULTI-PAGES PAR IFRAME ---
  const triggerBatchPrint = (formatToPrint) => {
    const itemsToPrint = basket.filter(item => item.format === formatToPrint);
    if (itemsToPrint.length === 0) return;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;

    const styleTarget = doc.createElement('style');
    styleTarget.innerHTML = `
      @page {
        size: 15cm 20cm !important;
        margin: 0 !important;
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        width: 15cm !important;
      }
      .print-page-sheet {
        display: block !important;
        width: 15cm !important;
        height: 20cm !important;
        page-break-after: always !important;
        break-after: page !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-sizing: border-box;
        margin: 0 !important;
        padding: 0 !important;
        overflow: hidden;
        background: #ffffff !important;
      }
      .print-page-sheet > div {
        display: inline-block !important;
        vertical-align: top;
        box-sizing: border-box;
        margin: 0 !important;
        padding: 0 !important;
      }
    `;
    doc.head.appendChild(styleTarget);

    let urlList = [];
    itemsToPrint.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        urlList.push(getCacheBustedPath(item.img.path));
      }
    });

    const [w, h] = formatToPrint.split('x').map(Number);
    const sheetW = 15;
    const sheetH = 20;

    let pages = [];
    let currentPageItems = [];
    let currentX = 0;
    let currentY = 0;
    let maxLineHeight = 0;

    if ((w >= sheetW && h >= sheetH) || (w >= sheetH && h >= sheetW)) {
      urlList.forEach(url => {
        pages.push([{ url, width: w, height: h }]);
      });
    } else {
      urlList.forEach(url => {
        if (currentX + w > sheetW) {
          currentX = 0;
          currentY += maxLineHeight;
          maxLineHeight = 0;
        }
        if (currentY + h > sheetH) {
          pages.push(currentPageItems);
          currentPageItems = [];
          currentX = 0;
          currentY = 0;
          maxLineHeight = 0;
        }
        currentPageItems.push({ url, width: w, height: h });
        currentX += w;
        if (h > maxLineHeight) {
          maxLineHeight = h;
        }
      });
      if (currentPageItems.length > 0) {
        pages.push(currentPageItems);
      }
    }

    const loadPromises = [];
    pages.forEach(pageItems => {
      const pageDiv = doc.createElement('div');
      pageDiv.className = 'print-page-sheet';

      pageItems.forEach(item => {
        const wrapper = doc.createElement('div');
        wrapper.style.width = `${item.width}cm`;
        wrapper.style.height = `${item.height}cm`;
        wrapper.style.display = 'block';

        const imgEl = doc.createElement('img');
        imgEl.src = item.url;
        imgEl.style.width = '100%';
        imgEl.style.height = '100%';
        imgEl.style.objectFit = 'fill';

        const p = new Promise(resolve => { imgEl.onload = () => resolve(); });
        loadPromises.push(p);

        wrapper.appendChild(imgEl);
        pageDiv.appendChild(wrapper);
      });

      doc.body.appendChild(pageDiv);
    });

    Promise.all(loadPromises).then(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 2000);
    });
  };

  const uniqueFormatsInBasket = [...new Set(basket.map(item => item.format))];

  return (
    <div className="mt-3 text-white">
      <Button variant="secondary" className="mb-4 fw-bold" onClick={() => setActiveTab('edit')}>
        ⬅ Retour à l'édition
      </Button>

      {selectedImages.length === 0 ? (
        <div className="alert alert-info border-0 shadow-sm">
          Aucune image sélectionnée dans l'édition.
        </div>
      ) : (
        <>
          <h5 className="mb-3 fw-bold text-uppercase text-info">1. Configurez vos photos</h5>
          <div className="d-flex flex-wrap gap-3 align-items-start mb-5">
            {selectedImages.map(img => (
              <PrintImageCard
                key={normalizePath(img.path)}
                img={img}
                onAddToBasket={addToBasket}
                getCacheBustedPath={getCacheBustedPath}
                normalizePath={normalizePath}
              />
            ))}
          </div>

          <Card className="bg-dark border-secondary text-white shadow p-3 mb-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold m-0 text-success">🛒 Gestion des Lots d'Impression</h5>
              
              {basket.length > 0 && (
                <div className="d-flex gap-2">
                  <Button 
                    variant="warning" 
                    size="sm" 
                    className="fw-bold text-dark"
                    onClick={handleArchiveBasket}
                    disabled={isArchiving}
                  >
                    {isArchiving ? '⏳ Archivage...' : '📦 Archiver le dossier'}
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={clearBasket} disabled={isArchiving}>
                    🚫 Vider tout
                  </Button>
                </div>
              )}
            </div>

            {basket.length === 0 ? (
              <p className="text-muted my-4 text-center">Aucune photo en attente. Ajoutez des formats au panier ci-dessus.</p>
            ) : (
              <>
                <Nav variant="tabs" activeKey={activeFormatTab} onSelect={k => setActiveFormatTab(k)} className="border-secondary mb-3">
                  {uniqueFormatsInBasket.map(formatKey => {
                    const count = basket.filter(i => i.format === formatKey).reduce((acc, i) => acc + i.quantity, 0);
                    return (
                      <Nav.Item key={formatKey}>
                        <Nav.Link eventKey={formatKey} className={`fw-bold ${activeFormatTab === formatKey ? 'bg-secondary text-white border-secondary' : 'text-info'}`}>
                          📦 Format {formatKey} cm ({count})
                        </Nav.Link>
                      </Nav.Item>
                    );
                  })}
                </Nav>

                <Table responsive striped bordered variant="dark" size="sm" className="align-middle text-center mt-2">
                  <thead>
                    <tr>
                      <th>Aperçu</th>
                      <th>Format</th>
                      <th>Quantité</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basket.map((item, originalIndex) => {
                      if (item.format !== activeFormatTab) return null;
                      return (
                        <tr key={originalIndex}>
                          <td>
                            <img src={getCacheBustedPath(item.img.path)} alt="" style={{ height: '40px', width: '50px', objectFit: 'cover', borderRadius: '2px' }} />
                          </td>
                          <td className="fw-bold text-warning">{item.format} cm</td>
                          <td><span className="badge bg-primary fs-6">{item.quantity}</span></td>
                          <td>
                            <Button variant="danger" size="sm" onClick={() => removeFromBasket(originalIndex)} disabled={isArchiving}>🗑️</Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>

                <div className="p-2 mb-3 bg-black bg-opacity-30 rounded small text-info border border-secondary">
                  💡 <strong>Sécurité de découpe pour le lot {activeFormatTab} :</strong>{' '}
                  Le système isole l'impression dans un cadre neutre pour empêcher l'interface ou les logs du site de déborder. Les photos sont placées précisément pour correspondre à vos feuilles de 15x20 cm.
                </div>

                <Button 
                  variant="primary" 
                  size="lg" 
                  className="w-100 fw-bold shadow py-2 text-uppercase"
                  onClick={() => triggerBatchPrint(activeFormatTab)}
                  disabled={isArchiving}
                >
                  🖨️ Imprimer uniquement le Lot ({activeFormatTab} cm)
                </Button>
              </>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default PrintTab;