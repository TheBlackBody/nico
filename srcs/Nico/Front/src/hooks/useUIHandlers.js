import { useRef } from 'react';

// Extraction de la logique Picasa en dehors du hook pour éviter les fermetures (closures) de boucles JS
export const handlePrintSingle = (imgUrl, format, quantity = 1, shouldGroup = false) => {
  const [dimA, dimB] = format.split('x').map(Number);
  
  const imgWidthCm = dimA;
  const imgHeightCm = dimB;

  const sheetWidthCm = shouldGroup ? 15 : imgWidthCm;
  const sheetHeightCm = shouldGroup ? 20 : imgHeightCm;

  const printContainer = document.createElement('div');
  printContainer.className = 'print-isolated-container';
  printContainer.style.position = 'fixed';
  printContainer.style.left = '0';
  printContainer.style.top = '0';
  printContainer.style.width = '100vw';
  printContainer.style.height = '100vh';
  printContainer.style.zIndex = '999999';
  printContainer.style.backgroundColor = '#ffffff';

  const stylePage = document.createElement('style');
  stylePage.innerHTML = `
    @page {
      size: ${sheetWidthCm}cm ${sheetHeightCm}cm;
      margin: 0 !important;
    }
    @media print {
      body > div:not(.print-isolated-container) {
        display: none !important;
      }
      .print-isolated-container {
        width: ${sheetWidthCm}cm !important;
        height: ${sheetHeightCm}cm !important;
        display: ${shouldGroup ? 'flex' : 'block'} !important;
        flex-wrap: wrap;
        align-content: start;
        justify-content: start;
        gap: 0.1cm;
        padding: 0;
        margin: 0;
      }
      .print-item {
        width: ${imgWidthCm}cm !important;
        height: ${imgHeightCm}cm !important;
        page-break-inside: avoid;
        ${!shouldGroup ? 'page-break-after: always;' : ''}
      }
    }
  `;
  printContainer.appendChild(stylePage);

  // Utilisation de Promesses pour éviter le 'no-loop-func'
  const imageLoadPromises = [];

  for (let i = 0; i < quantity; i++) {
    const wrapper = document.createElement('div');
    wrapper.className = 'print-item';
    wrapper.style.width = `${imgWidthCm}cm`;
    wrapper.style.height = `${imgHeightCm}cm`;
    wrapper.style.display = 'inline-block';

    const imgElement = document.createElement('img');
    imgElement.src = imgUrl;
    imgElement.style.width = '100%';
    imgElement.style.height = '100%';
    imgElement.style.objectFit = 'fill';
    imgElement.style.display = 'block';

    // On stocke la promesse de chargement de l'image
    const loadPromise = new Promise((resolve) => {
      imgElement.onload = () => resolve();
    });
    imageLoadPromises.push(loadPromise);

    wrapper.appendChild(imgElement);
    printContainer.appendChild(wrapper);
  }

  document.body.appendChild(printContainer);

  // Dès que toutes les promesses de chargement sont résolues, on imprime
  Promise.all(imageLoadPromises).then(() => {
    window.print();
    setTimeout(() => {
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
    }, 600);
  });
};

export const useUIHandlers = () => {
  const printRef = useRef();

  const handleBack = (setCurrentFolder, setSelectedImages, setEditingImage, setReplacementFile) => {
    setCurrentFolder('');
    setSelectedImages([]);
    setEditingImage(null);
    setReplacementFile(null);
  };

  const handleExitEditor = (setEditingImage, setReplacementFile, setImagePreviewKey) => {
    setEditingImage(null);
    setReplacementFile(null);
    setImagePreviewKey(0);
  };

  return {
    printRef,
    handleBack,
    handleExitEditor,
    handlePrintSingle, // Toujours exposé par le hook pour que Vendeur.js s'y retrouve
  };
};