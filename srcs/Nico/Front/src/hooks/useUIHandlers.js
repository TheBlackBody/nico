// src/hooks/useUIHandlers.js
import { useRef } from 'react';

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

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) {
      return window.print();
    }
    const originalDisplay = printContent.style.display;
    printContent.style.display = 'block';
    window.print();
    printContent.style.display = originalDisplay;
  };

  return {
    printRef,
    handleBack,
    handleExitEditor,
    handlePrint,
  };
};