// src/hooks/useAlbums.js
import { useState, useEffect } from 'react';

export const useAlbums = () => {
  const [albums, setAlbums] = useState([]);
  const [wabAlbums, setWabAlbums] = useState([]);

  const fetchAlbums = async () => {
    const response = await fetch('/api/albums/liste/');
    const data = await response.json();
    setAlbums(data.filter(item => item.folder.startsWith('validated/')));
    setWabAlbums(data.filter(item => item.folder.startsWith('wab_validation/')));
  };

  useEffect(() => {
    fetchAlbums();
    const refreshInterval = setInterval(() => {
      fetchAlbums();
    }, 3000);
    return () => clearInterval(refreshInterval);
  }, []);

  const handleUpload = async (photographer, files, setPhotographer, setFiles) => {
    const formData = new FormData();
    formData.append('photographer', photographer);
    files.forEach(file => formData.append('images', file));
    const response = await fetch('/api/albums/upload/', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    alert(data.message);
    setPhotographer('');
    setFiles([]);
  };

  const handleReplaceImage = async (editingImage, replacementFile, setReplacementFile, setImagePreviewKey, fetchAlbums) => {
    if (!editingImage) {
      return alert('Aucune image sélectionnée pour le remplacement');
    }
    if (!replacementFile) {
      return alert('Veuillez choisir un fichier pour remplacer l\'image');
    }

    const formData = new FormData();
    formData.append('path', editingImage.path);
    formData.append('image', replacementFile);

    const response = await fetch('/api/albums/replace-image/', {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
      return alert(data.error || 'Erreur lors du remplacement de l\'image');
    }

    alert(data.message);
    setReplacementFile(null);
    setImagePreviewKey(prev => prev + 1);
    fetchAlbums();
  };

  const handleApplyEdits = async (editingImage, presetFilter, filters, isApplying, setIsApplying, setImageCacheBuster, setFilters, setPresetFilter, setImagePreviewKey, fetchAlbums) => {
    if (!editingImage || isApplying) return;

    setIsApplying(true);
    try {
      const response = await fetch('/api/albums/apply-edits/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: editingImage.path,
          preset: presetFilter,
          brightness: filters.brightness,
          contrast: filters.contrast,
          saturation: filters.saturation,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Erreur lors de l\'application des modifications');
        return;
      }

      alert(data.message);
      setImageCacheBuster(prev => prev + 1);
      setFilters({ brightness: 100, contrast: 100, saturation: 100 });
      setPresetFilter('none');
      setImagePreviewKey(prev => prev + 1);
      fetchAlbums();
    } finally {
      setIsApplying(false);
    }
  };

  return {
    albums,
    wabAlbums,
    fetchAlbums,
    handleUpload,
    handleReplaceImage,
    handleApplyEdits,
  };
};