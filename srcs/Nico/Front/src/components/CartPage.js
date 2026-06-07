import React, { useState, useEffect } from "react";

function CartPage({ images, onBackToGallery, globalCart, setGlobalCart }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyFullFolders, setCopyFullFolders] = useState(false);

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
          copy_full_folders: copyFullFolders,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const wabMessage = copyFullFolders
          ? ` et ${data.wab_copied?.length || 0} fichier(s) copiés dans wab_validation`
          : "";
        alert(`✅ ${data.copied.length} image(s) enregistrée(s) pour ${email}${wabMessage}`);
        setGlobalCart([]);
        setShowEmailPrompt(false);
        setEmail("");
        setCopyFullFolders(false);
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
              className="position-absolute"
              style={{
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={goPrev}
            >
              <img src={`${process.env.PUBLIC_URL}/left.png`} alt="Précédent" style={{ width: "50px", height: "50px" }} />
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
              className="position-absolute"
              style={{
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
              onClick={goNext}
            >
              <img src={`${process.env.PUBLIC_URL}/right.png`} alt="Suivant" style={{ width: "50px", height: "50px" }} />
            </button>

            {/* Boutons d’action sous l’image */}
            <div className="mt-4 d-flex justify-content-center gap-3">
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => handleAddToCart(selectedImage)}
              >
                <img src={`${process.env.PUBLIC_URL}/add.png`} alt="Ajouter au panier" style={{ width: "60px", height: "60px" }} />
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={onBackToGallery}
              >
                <img src={`${process.env.PUBLIC_URL}/back.png`} alt="Retour à la galerie" style={{ width: "60px", height: "60px" }} />
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
          height: "calc(100vh - 30px)",
          marginBottom: "30px",
          padding: "1rem",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          borderLeft: "2px solid #000",
          backdropFilter: "blur(5px)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <h5>🛒 Panier ({globalCart.length})</h5>
        <div style={{ flex: 1, overflowY: "auto", marginTop: "0.5rem", position: "relative" }}>
          {globalCart.length > 0 ? (
            globalCart.map((img, idx) => (
              <div
                key={idx}
                style={{
                  position: "relative",
                  marginBottom: "1rem",
                  height: "300px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={img}
                  alt={`panier-${idx}`}
                  style={{
                    width: "300px",
                    height: "300px",
                    objectFit: "cover",
                                        borderRadius: "8px",
                                        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                  }}
                  onClick={() => setSelectedImage(img)}
                />
                <button
                  style={{
                    position: "absolute",
                    top: "-10px",
                    right: "-10px",
                    background: "rgba(255, 0, 0, 0.8)",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    fontSize: "18px",
                    padding: 0,
                  }}
                  onClick={() => handleRemoveFromCart(img)}
                >
                  ❌
                </button>
              </div>
            ))
          ) : (
            <p style={{ textAlign: "center", color: "#666" }}>Panier vide</p>
          )}
        </div>
        <button
          style={{
            background: "none",
            border: "none",
            cursor: globalCart.length === 0 ? "not-allowed" : "pointer",
            opacity: globalCart.length === 0 ? 0.5 : 1,
            marginTop: "1rem",
                      flexShrink: 0,
          }}
          onClick={handleConfirm}
          disabled={globalCart.length === 0}
        >
          <img src={`${process.env.PUBLIC_URL}/confirm.png`} alt="Confirmer le panier" style={{ width: "60px", height: "60px" }} />
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
            <div className="form-check text-start mb-3">
              <input
                id="copyFullFolders"
                type="checkbox"
                className="form-check-input"
                checked={copyFullFolders}
                onChange={(e) => setCopyFullFolders(e.target.checked)}
                disabled={loading}
              />
              <label className="form-check-label" htmlFor="copyFullFolders">
                Copier aussi les images du même dossier que chaque image sélectionnée dans <strong>wab_validation</strong>
              </label>
            </div>
            <div className="d-flex justify-content-between">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowEmailPrompt(false);
                  setCopyFullFolders(false);
                }}
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
