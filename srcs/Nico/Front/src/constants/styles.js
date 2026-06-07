// src/constants/styles.js
export const thumbStyle = { width: '100%', height: '180px', objectFit: 'cover' };
export const previewStyle = { width: '100%', height: '420px', objectFit: 'contain', background: '#f8f9fa', border: '1px solid #ddd' };
export const printStyle = { width: '100%', height: '100%', objectFit: 'cover' };
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
      background: white;
    }
    .print-sheet {
      page-break-inside: avoid;
      margin-bottom: 0.5cm;
    }
  }
`;