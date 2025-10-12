import React, { useState, useEffect } from "react";

function CartPage({ images, onBackToGallery }) {
  const [cart, setCart] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images && images.length > 0) {
      setSelectedImage(images[0]);
      setCurrentIndex(0);
    }
  }, [images]);

  const handleAddToCart = (image) => {
    if (!cart.includes(image)) {
      setCart([...cart, image]);
    }
  };

  const handleRemoveFromCart = (image) => {
    setCart(cart.filter((img) => img !== image));
  };

  const handleConfirm = () => {
    alert(`Panier confirmé avec ${cart.length} image(s)`);
  };

  const goNext = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(nextIndex);
    setSelectedImage(images[nextIndex]);
  };

  const goPrev = () => {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(prevIndex);
    setSelectedImage(images[prevIndex]);
  };

  const handleSelectImage = (index) => {
    setCurrentIndex(index);
    setSelectedImage(images[index]);
  };

  return (
    <div className="d-flex" style={{ height: "90vh" }}>
      {/* Section principale */}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center border-end p-3">
        {/* Galerie miniatures */}
        <div className="d-flex flex-wrap mb-3 justify-content-center">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`img-${idx}`}
              style={{
                width: "100px",
                height: "100px",
                objectFit: "cover",
                margin: "5px",
                cursor: "pointer",
                border: selectedImage === img ? "3px solid blue" : "1px solid gray",
              }}
              onClick={() => handleSelectImage(idx)}
            />
          ))}
        </div>

        {/* Image en grand */}
        {selectedImage ? (
          <div className="d-flex flex-column align-items-center">
            <img
              src={selectedImage}
              alt="Aperçu"
              style={{ maxWidth: "80%", maxHeight: "60vh", objectFit: "contain" }}
            />
            <div className="mt-3 d-flex justify-content-center gap-2">
              <button className="btn btn-secondary" onClick={goPrev}>
                ◀ Précédent
              </button>
              <button className="btn btn-primary" onClick={() => handleAddToCart(selectedImage)}>
                Ajouter au panier
              </button>
              <button className="btn btn-secondary" onClick={goNext}>
                Suivant ▶
              </button>
              <button className="btn btn-warning" onClick={onBackToGallery}>
                🔙 Retour à la galerie
              </button>
            </div>
          </div>
        ) : (
          <p>Sélectionnez une image pour l’agrandir</p>
        )}
      </div>

      {/* Sidebar panier transparente avec barre de séparation */}
      <div
        style={{
          width: "300px",
          padding: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.3)", // transparent
          borderLeft: "2px solid #000", // barre de séparation
          backdropFilter: "blur(5px)", // flou derrière pour meilleure lisibilité
          display: "flex",
          flexDirection: "column",
        }}
      >
        <h5>🛒 Panier ({cart.length})</h5>
        <div className="flex-grow-1 overflow-auto mt-2 p-2">
          {cart.length > 0 ? (
            cart.map((img, idx) => (
              <div key={idx} className="d-flex align-items-center mb-2">
                <img
                  src={img}
                  alt={`panier-${idx}`}
                  style={{ width: "60px", height: "60px", objectFit: "cover" }}
                  onClick={() => handleSelectImage(images.indexOf(img))}
                  className="me-2 border"
                />
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleRemoveFromCart(img)}
                >
                  ❌
                </button>
              </div>
            ))
          ) : (
            <p>Panier vide</p>
          )}
        </div>
        <button
          className="btn btn-success mt-3"
          onClick={handleConfirm}
          disabled={cart.length === 0}
        >
          ✅ Confirmer le panier
        </button>
      </div>
    </div>
  );
}

export default CartPage;
