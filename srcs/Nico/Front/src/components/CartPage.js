import React, { useState, useEffect } from "react";

function CartPage({ images, onBackToGallery, globalCart, setGlobalCart }) {
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
    if (!globalCart.includes(image)) setGlobalCart([...globalCart, image]);
  };

  const handleRemoveFromCart = (image) => {
    setGlobalCart(globalCart.filter((img) => img !== image));
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

  const handleConfirm = () => {
    if (globalCart.length === 0) return alert("Aucune image dans le panier !");
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
          files: globalCart,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`✅ ${data.copied.length} image(s) enregistrée(s) pour ${email}`);
        setGlobalCart([]);
        setShowEmailPrompt(false);
        setEmail("");
        window.location.reload(); // ✅ rafraîchit la page
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
    <div className="d-flex" style={{ height: "100vh" }}>
      {/* Section principale */}
      <div className="flex-grow-1 position-relative d-flex flex-column align-items-center justify-content-center border-end p-3">
        {selectedImage ? (
          <>
            {/* Bouton précédent à gauche */}
            <button
              className="btn btn-dark position-absolute"
              style={{
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                fontSize: "1.5rem",
                padding: "0.5rem 1rem",
              }}
              onClick={goPrev}
            >
              ◀
            </button>

            {/* Image principale au centre */}
            <img
              src={selectedImage}
              alt="Aperçu"
              style={{
                maxWidth: "90%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: "10px",
                boxShadow: "0 0 15px rgba(0,0,0,0.4)",
              }}
            />

            {/* Bouton suivant à droite */}
            <button
              className="btn btn-dark position-absolute"
              style={{
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                fontSize: "1.5rem",
                padding: "0.5rem 1rem",
              }}
              onClick={goNext}
            >
              ▶
            </button>

            {/* Boutons d’action sous l’image */}
            <div className="mt-4 d-flex justify-content-center gap-3">
              <button
                className="btn btn-primary"
                onClick={() => handleAddToCart(selectedImage)}
              >
                Ajouter au panier 🛒
              </button>
              <button className="btn btn-warning" onClick={onBackToGallery}>
                🔙 Retour à la galerie
              </button>
            </div>
          </>
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
        <h5>🛒 Panier ({globalCart.length})</h5>
        <div className="flex-grow-1 overflow-auto mt-2 p-2">
          {globalCart.length > 0 ? (
            globalCart.map((img, idx) => (
              <div key={idx} className="d-flex align-items-center mb-2">
                <img
                  src={img}
                  alt={`panier-${idx}`}
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "cover",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedImage(img)}
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
          disabled={globalCart.length === 0}
        >
          ✅ Confirmer le panier
        </button>
      </div>

      {/* Popup email */}
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
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "10px",
              width: "300px",
              textAlign: "center",
              boxShadow: "0 0 15px rgba(0,0,0,0.3)",
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
