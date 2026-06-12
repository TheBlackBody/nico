// src/constants/styles.js
export const thumbStyle = { width: '100%', height: '180px', objectFit: 'cover' };
export const previewStyle = { width: '100%', height: '420px', objectFit: 'contain', background: '#f8f9fa', border: '1px solid #ddd' };

// CORRECTION : On passe en 'contain' pour redimensionner sans rogner
export const printStyle = { 
  width: '100%', 
  height: '100%', 
  objectFit: 'contain' 
};

export const textColor = '#000000';

export const printStyles = `
  @page {
    size: auto;
    margin: 0;
  }
  @media print {
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }
    body * {
      visibility: hidden !important;
    }
    .print-only, .print-only * {
      visibility: visible !important;
    }
    .print-only {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: white;
    }
    .print-sheet {
      page-break-inside: avoid;
      page-break-after: always; /* Force chaque image sur une nouvelle page propre */
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }
`;