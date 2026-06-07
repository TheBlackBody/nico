import React, { useState, useEffect } from "react";
import UploadTab from '../components/UploadTab';
import MailSendTab from '../components/MailSendTab';
import MailArchiveTab from '../components/MailArchiveTab';
import EditTab from '../components/EditTab';
import PrintTab from '../components/PrintTab';
import { useAlbums } from '../hooks/useAlbums';
import { useUIHandlers } from '../hooks/useUIHandlers';
import { normalizePath, getCacheBustedPath, isSamePath, getPresetStyle, getPrintSizeStyle } from '../utils/imageUtils';
import { thumbStyle, previewStyle, printStyle, textColor, printStyles } from '../constants/styles';

function Vendeur({ setGlobalBackgroundImagePath, backgroundImagePath }) {
  const [activeTab, setActiveTab] = useState('menu');
  const [photographer, setPhotographer] = useState('');
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState('');
  const [selectedImages, setSelectedImages] = useState([]);
  const [editingImage, setEditingImage] = useState(null);
  const [imagePreviewKey, setImagePreviewKey] = useState(0);
  const [imageCacheBuster, setImageCacheBuster] = useState(0);
  const [filters, setFilters] = useState({ brightness: 100, contrast: 100, saturation: 100 });
  const [presetFilter, setPresetFilter] = useState('none');
  const [email, setEmail] = useState('');
  const [replacementFile, setReplacementFile] = useState(null);
  const [printFormat, setPrintFormat] = useState('10x15');
  const [isApplying, setIsApplying] = useState(false);
  const defaultTabColor = '#000000';
  const [tabColor, setTabColor] = useState(defaultTabColor);
  const [tempTabColor, setTempTabColor] = useState(defaultTabColor);
  const [tempBackgroundImagePath, setTempBackgroundImagePath] = useState(backgroundImagePath || '/backgroudNoel2.jpg');

  const leftMenuActions = [
    { key: 'upload', title: 'Téléchargement', subtitle: 'Photos', icon: '/download.png' },
    { key: 'edit', title: 'Éditer', subtitle: 'Commande', icon: '/commande.png' },
    { key: 'send_mail', title: 'Envoi Mail', subtitle: 'Email', icon: '/send_mail.png' },
  ];

  const rightMenuActions = [
    { key: 'print', title: 'Archives', subtitle: 'Impressions', icon: '/archives_impress.png' },
    { key: 'mail_archives', title: 'Archives', subtitle: 'Mails', icon: '/archives_mails.png' },
    { key: 'settings', title: 'Paramètres', subtitle: 'Configuration', icon: '/parametre.png' },
  ];

  const navActions = [
    { key: 'upload', title: 'Télécharger', icon: '/download.png' },
    { key: 'send_mail', title: 'Envoi Mail', icon: '/send_mail.png' },
    { key: 'edit', title: 'Éditer', icon: '/commande.png' },
    { key: 'print', title: 'Imprimer', icon: '/impressions.png' },
  ];

  const isMenu = activeTab === 'menu';

  const handleTempTabColorChange = color => {
    setTempTabColor(color);
  };

  const handleTempBackgroundImageFileChange = file => {
    if (!file) {
      setTempBackgroundImagePath('');
      return;
    }

    const reader = new FileReader();
    reader.onload = event => {
      const dataUrl = event.target?.result;
      if (typeof dataUrl === 'string') {
        setTempBackgroundImagePath(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const applySettings = async () => {
    setTabColor(tempTabColor);
    
    // Envoyer le background à l'API
    try {
      const response = await fetch('/api/albums/app-settings/update/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          background_image_path: tempBackgroundImagePath
        })
      });
      
      if (!response.ok) {
        alert('Erreur lors de la sauvegarde du background');
        return;
      }
      
      const data = await response.json();
      if (setGlobalBackgroundImagePath) {
        setGlobalBackgroundImagePath(data.background_image_path);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la sauvegarde du background');
    }
  };

  const cancelSettings = () => {
    setTempTabColor(tabColor);
    setTempBackgroundImagePath(backgroundImagePath);
  };

  useEffect(() => {
    setTempBackgroundImagePath(backgroundImagePath || '/backgroudNoel2.jpg');
  }, [backgroundImagePath]);

  const { albums, wabAlbums, fetchAlbums, handleUpload: uploadImages, handleReplaceImage: replaceImage, handleApplyEdits: applyEdits } = useAlbums();
  const { printRef, handleBack, handleExitEditor, handlePrint } = useUIHandlers();

  const archivePrint = async () => {
    if (selectedImages.length === 0) {
      return;
    }

    const firstFolder = selectedImages[0]?.folder;
    try {
      const response = await fetch('/api/albums/archive-print/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          folder: firstFolder,
          files: selectedImages.map(img => img.path),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error(data.error || 'Erreur lors de l’archivage de l’impression');
        alert(data.error || 'Erreur lors de l’archivage de l’impression');
      } else {
        alert(data.message || 'Impression archivée avec succès');
      }
    } catch (error) {
      console.error('Erreur archive impression:', error);
      alert('Erreur lors de l’archivage de l’impression');
    }
  };

  const handlePrintAndArchive = async () => {
    handlePrint();
    await archivePrint();
  };

  const validatedEmails = [...new Set(albums.map(item => item.folder.split('/')[1]))];
  const wabEmails = [...new Set(wabAlbums.map(item => item.folder.split('/')[1]))];

  const currentValidatedImages = currentFolder ? albums.filter(item => item.folder === `validated/${currentFolder}`) : [];
  const currentWabImages = currentFolder ? wabAlbums.filter(item => item.folder === `wab_validation/${currentFolder}`) : [];

  const renderContent = () => {
    switch (activeTab) {
      case 'upload':
        return (
          <UploadTab
            photographer={photographer}
            setPhotographer={setPhotographer}
            files={files}
            setFiles={setFiles}
            handleUpload={() => uploadImages(photographer, files, setPhotographer, setFiles)}
          />
        );
      case 'send_mail':
        return (
          <MailSendTab
            currentFolder={currentFolder}
            setCurrentFolder={setCurrentFolder}
            handleBack={() => handleBack(setCurrentFolder, setSelectedImages, setEditingImage, setReplacementFile)}
            wabEmails={wabEmails}
            currentWabImages={currentWabImages}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            email={email}
            setEmail={setEmail}
            thumbStyle={thumbStyle}
            getCacheBustedPath={(path) => getCacheBustedPath(imageCacheBuster)(path)}
            isSamePath={isSamePath}
          />
        );
      case 'mail_archives':
        return (
          <MailArchiveTab
            thumbStyle={thumbStyle}
            getCacheBustedPath={(path) => getCacheBustedPath(imageCacheBuster)(path)}
          />
        );
      case 'edit':
        return (
          <EditTab
            currentFolder={currentFolder}
            setCurrentFolder={setCurrentFolder}
            handleBack={() => handleBack(setCurrentFolder, setSelectedImages, setEditingImage, setReplacementFile)}
            validatedEmails={validatedEmails}
            currentValidatedImages={currentValidatedImages}
            selectedImages={selectedImages}
            setSelectedImages={setSelectedImages}
            editingImage={editingImage}
            setEditingImage={setEditingImage}
            handleExitEditor={() => handleExitEditor(setEditingImage, setReplacementFile, setImagePreviewKey)}
            filters={filters}
            setFilters={setFilters}
            presetFilter={presetFilter}
            setPresetFilter={setPresetFilter}
            replacementFile={replacementFile}
            setReplacementFile={setReplacementFile}
            handleApplyEdits={() => applyEdits(editingImage, presetFilter, filters, isApplying, setIsApplying, setImageCacheBuster, setFilters, setPresetFilter, setImagePreviewKey, fetchAlbums)}
            handleReplaceImage={() => replaceImage(editingImage, replacementFile, setReplacementFile, setImagePreviewKey, fetchAlbums)}
            isApplying={isApplying}
            thumbStyle={thumbStyle}
            previewStyle={previewStyle}
            getPresetStyle={getPresetStyle}
            imagePreviewKey={imagePreviewKey}
            getCacheBustedPath={(path) => getCacheBustedPath(imageCacheBuster)(path)}
            isSamePath={isSamePath}
            normalizePath={normalizePath}
          />
        );
      case 'print':
        return (
          <PrintTab
            selectedImages={selectedImages}
            setActiveTab={setActiveTab}
            printFormat={printFormat}
            setPrintFormat={setPrintFormat}
            handlePrint={handlePrintAndArchive}
            getCacheBustedPath={(path) => getCacheBustedPath(imageCacheBuster)(path)}
            normalizePath={normalizePath}
          />
        );
      case 'settings':
        return (
          <div className="p-3" style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 20 }}>
            <h2>Paramètres</h2>
            <div className="mb-4">
              <h3 style={{ fontSize: '1rem' }}>Couleur des onglets</h3>
              <div className="d-flex flex-column" style={{ maxWidth: '240px' }}>
                <label className="d-flex flex-column align-items-start" style={{ minWidth: '180px' }}>
                  <span>Couleur des onglets</span>
                  <input
                    type="color"
                    value={tempTabColor}
                    onChange={e => handleTempTabColorChange(e.target.value)}
                    style={{ width: '3rem', height: '3rem', border: '1px solid #ccc', padding: 0 }}
                  />
                </label>
              </div>
            </div>
            <div className="mb-4">
              <h3 style={{ fontSize: '1rem' }}>Image de fond globale</h3>
              <input
                type="file"
                accept="image/*"
                onChange={e => handleTempBackgroundImageFileChange(e.target.files?.[0] || null)}
                className="form-control"
                style={{ maxWidth: '420px' }}
              />
              {tempBackgroundImagePath && (
                <div className="mt-2">
                  <small className="text-muted">Image sélectionnée :</small>
                  <div style={{ maxWidth: '240px', marginTop: '0.5rem' }}>
                    <img src={tempBackgroundImagePath} alt="Preview" style={{ width: '100%', borderRadius: '4px', border: '1px solid #ddd' }} />
                  </div>
                </div>
              )}
            </div>
            <div className="d-flex gap-2">
              <button type="button" className="btn btn-primary" onClick={applySettings}>
                Appliquer
              </button>
              <button type="button" className="btn btn-secondary" onClick={cancelSettings}>
                Annuler
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container-fluid mt-3" style={{ color: textColor }}>
      <style>{printStyles}</style>
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap">
        {!isMenu ? (
          <>
            <button
              type="button"
              className="btn btn-link text-decoration-none p-0 d-flex align-items-center"
              onClick={() => setActiveTab('menu')}
              style={{ color: textColor }}
            >
              <img src="/retour.png" alt="Retour" style={{ width: 72, marginRight: 10 }} />
              Retour
            </button>
            <div className="d-flex gap-4 flex-wrap justify-content-center">
              {navActions.map(action => (
                <button
                  key={action.key}
                  type="button"
                  className={`btn btn-outline-light d-flex align-items-center justify-content-center ${activeTab === action.key ? 'border-primary' : ''}`}
                  onClick={() => setActiveTab(action.key)}
                  style={{ color: textColor, background: 'rgba(255,255,255,0.16)', width: 170, height: 170, padding: 22, borderRadius: 26 }}
                  aria-label={action.title}
                >
                  <img src={action.icon} alt={action.title} style={{ width: 110, height: 110 }} />
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn btn-link text-decoration-none p-0"
              onClick={() => setActiveTab('settings')}
              style={{ color: textColor }}
            >
              <img src="/parametre.png" alt="Paramètres" style={{ width: 110 }} />
            </button>
          </>
        ) : (
          <h1 style={{ color: textColor, width: '100%' }}>Interface Vendeur</h1>
        )}
      </div>
      {isMenu ? (
        <div className="row gy-4 justify-content-center align-items-center">
          <div className="col-12 col-lg-4 d-flex flex-column gap-4">
            {leftMenuActions.map(action => (
              <button
                key={action.key + action.subtitle}
                type="button"
                className="w-100 d-flex align-items-center justify-content-start shadow-lg"
                onClick={() => setActiveTab(action.key)}
                style={{
                  minHeight: 210,
                  borderRadius: 36,
                  border: '1px solid rgba(255, 255, 255, 0.61)',
                  background: 'rgba(255, 255, 255, 0.52)',
                  color: textColor,
                  padding: '1.5rem',
                  gap: '1rem',
                }}
                aria-label={action.title}
              >
                <img src={action.icon} alt={action.title} style={{ width: 130, height: 130, objectFit: 'contain' }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#042556' }}>{action.title}</h4>
                  <div style={{ fontWeight: 700, color: '#042556', fontSize: '1rem' }}>{action.subtitle}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="col-12 col-lg-4 d-flex align-items-center justify-content-center px-4">
            <div style={{
              width: '200%',
              minHeight: 420,
              borderRadius: 36,
              border: '1px solid rgba(255,255,255,0.32)',
              background: 'rgba(255,255,255,0.14)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem 1.5rem',
            }}>
              <img src="/PC_vendeur.png" alt="Instantapix" style={{ width: '200%', maxWidth: 280, objectFit: 'contain' }} />
            </div>
          </div>

          <div className="col-12 col-lg-4 d-flex flex-column gap-4">
            {rightMenuActions.map(action => (
              <button
                key={action.key + action.subtitle}
                type="button"
                className="w-100 d-flex align-items-center justify-content-start shadow-lg"
                onClick={() => setActiveTab(action.key)}
                style={{
                  minHeight: 210,
                  borderRadius: 36,
                  border: '1px solid rgba(255, 255, 255, 0.61)',
                  background: 'rgba(255, 255, 255, 0.52)',
                  color: textColor,
                  padding: '1.5rem',
                  gap: '1rem',
                }}
                aria-label={action.title}
              >
                <img src={action.icon} alt={action.title} style={{ width: 130, height: 130, objectFit: 'contain' }} />
                <div style={{ textAlign: 'left', flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: '#042556' }}>{action.title}</h4>
                  <div style={{ fontWeight: 700, color: '#042556', fontSize: '1rem' }}>{action.subtitle}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-3">
          {renderContent()}
        </div>
      )}
      <div ref={printRef} className="print-only" style={{ display: 'none' }}>
        {selectedImages.map(img => (
          <div key={normalizePath(img.path)} className="print-sheet" style={{ ...getPrintSizeStyle(printFormat), marginBottom: '1cm' }}>
            <img src={getCacheBustedPath(imageCacheBuster)(img.path)} alt="" style={printStyle} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default Vendeur;