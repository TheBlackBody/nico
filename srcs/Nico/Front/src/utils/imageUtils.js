// src/utils/imageUtils.js
export const normalizePath = (path) => path ? path.split('?')[0] : path;

export const getCacheBustedPath = (imageCacheBuster) => (path) =>
  `${normalizePath(path)}?v=${imageCacheBuster}`;

export const isSamePath = (pathA, pathB) =>
  normalizePath(pathA) === normalizePath(pathB);

export const getPresetStyle = (presetFilter) => {
  switch (presetFilter) {
    case 'sepia':
      return 'sepia(1) saturate(0.85) contrast(1.1) brightness(1.02)';
    case 'bw':
      return 'grayscale(100%) contrast(1.1) brightness(1.02)';
    case 'warm':
      return 'sepia(0.4) saturate(1.25) contrast(1.05) brightness(1.03)';
    case 'cool':
      return 'grayscale(25%) sepia(0.1) hue-rotate(180deg) saturate(0.85) contrast(1.05)';
    case 'vibrant':
      return 'saturate(1.4) contrast(1.1)';
    default:
      return '';
  }
};

export const getPrintSizeStyle = (printFormat) => {
  switch (printFormat) {
    case '5x15':
      return { width: '5cm', height: '15cm' };
    case '9x13':
      return { width: '9cm', height: '13cm' };
    case '10x15':
      return { width: '10cm', height: '15cm' };
    case '11.5x15':
      return { width: '11.5cm', height: '15cm' };
    case '13x18':
      return { width: '13cm', height: '18cm' };
    case '15x20':
      return { width: '15cm', height: '20cm' };
    case '15x23':
      return { width: '15cm', height: '23cm' };
    case '15x15':
      return { width: '15cm', height: '15cm' };
    default:
      return { width: '10cm', height: '15cm' };
  }
};