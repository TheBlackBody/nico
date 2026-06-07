import React from 'react';
import { Card, Button } from 'react-bootstrap';

function ImageCard({ item, thumbStyle, onSelect, isSelected, onEdit, showEditButton = false, getCacheBustedPath }) {
  return (
    <Card className="h-100">
      <Card.Img
        variant="top"
        src={getCacheBustedPath(item.path)}
        style={thumbStyle}
        onError={(e) => console.log('Image load error:', item.path)}
      />
      <Card.Body>
        <Button
          onClick={() => onSelect(item)}
          variant={isSelected ? 'secondary' : 'primary'}
        >
          {isSelected ? 'Désélectionner' : 'Sélectionner'}
        </Button>
        {showEditButton && (
          <Button
            variant="success"
            className="ms-2"
            onClick={() => onEdit(item)}
          >
            Editer
          </Button>
        )}
      </Card.Body>
    </Card>
  );
}

export default ImageCard;