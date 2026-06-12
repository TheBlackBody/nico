// src/constants/styles.js
export const thumbStyle = { width: '100%', height: '180px', objectFit: 'cover' };
export const previewStyle = { width: '100%', height: '420px', objectFit: 'contain', background: '#f8f9fa', border: '1px solid #ddd' };

// CORRECTION PICASA : 'fill' force l'image à s'étirer pour remplir tout l'espace disponible
export const printStyle = { 
  width: '100%', 
  height: '100%', 
  objectFit: 'fill',
  margin: 0,
  padding: 0
};

export const textColor = '#000000';

// Styles CSS injectés pour nettoyer l'interface lors de l'appel à l'impression
export const printStyles = `
  @page {
    margin: 0 !important;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
      width: 15cm; /* Verrouille la dimension de base du flux */
    }
    
    /* Masquer absolument tout le reste de l'application pendant l'impression */
    body > div:not(.print-isolated-container) {
      display: none !important;
    }

    .print-isolated-container {
      display: block !important;
      padding: 0;
      margin: 0;
    }

    /* GESTION MULTI-PAGES STRICTE */
    .print-page-sheet {
      display: block !important; /* Force le mode bloc pour casser le flexbox */
      position: relative;
      page-break-after: always !important; /* Pour les anciens navigateurs */
      break-after: page !important;        /* Pour les navigateurs modernes */
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      box-sizing: border-box;
      margin: 0 !important;
      padding: 0 !important;
      overflow: hidden;
    }

    /* Aligne les sous-images du lot côte à côte sans bloquer le saut de page */
    .print-page-sheet > div {
      display: inline-block !important;
      vertical-align: top;
      box-sizing: border-box;
    }
  }
`;