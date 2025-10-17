import React, { useState, useEffect } from "react";

function CartPage({ images, onBackToGallery }) {
  const [cart, setCart] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (images && images.length > 0) {
      setSelectedImage(images[0]);
      setCurrentIndex(0);
    }
  }, [images]);

  const handleAddToCart = (image) => {
    if (!cart.includes(image)) setCart([...cart, image]);
  };

  const handleRemoveFromCart = (image) => {
    setCart(cart.filter((img) => img !== image));
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

  const handleConfirm = () => {
    if (cart.length === 0) return alert("Aucune image dans le panier !");
    setShowEmailPrompt(true);
  };

  const handleSendToBackend = async () => {
    if (!email.trim()) return alert("Merci d’entrer un e-mail valide.");
    setLoading(true);

    try {
      const response = await fetch("/api/albums/confirm-cart/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          files: cart,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.copied.length} image(s) enregistrée(s) pour ${email}`);
        setCart([]);
        setShowEmailPrompt(false);
        setEmail("");

        window.location.reload();
      } else {
        alert("Erreur : " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex" style={{ height: "90vh" }}>
      {/* Section principale */}
      <div className="flex-grow-1 d-flex flex-column align-items-center justify-content-center border-end p-3">
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
              <button
                className="btn btn-primary"
                onClick={() => handleAddToCart(selectedImage)}
              >
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

      {/* Sidebar panier */}
      <div
        style={{
          width: "300px",
          padding: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          borderLeft: "2px solid #000",
          backdropFilter: "blur(5px)",
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

      {/* 📨 Popup email */}
      {showEmailPrompt && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              textAlign: "center",
            }}
          >
            <h5>Entrer votre email</h5>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="exemple@mail.com"
              className="form-control my-3"
              disabled={loading}
            />
            <div className="d-flex justify-content-between">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEmailPrompt(false)}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSendToBackend}
                disabled={loading}
              >
                {loading ? "Envoi..." : "Valider"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CartPage;
