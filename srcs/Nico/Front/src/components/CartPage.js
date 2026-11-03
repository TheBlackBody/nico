import React, { useState, useEffect } from "react";

function normalizeCartItems(items = []) {
  return items
    .map((item) => {
      if (typeof item === "string") {
        return { path: item, quantity: 1 };
      }

      const path = item?.path || item?.src || item?.image || item?.url;
      const quantity = Number(item?.quantity ?? 1);

      if (!path) {
        return null;
      }

      return {
        path,
        quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 1,
      };
    })
    .filter(Boolean);
}

function flattenCartItems(items = []) {
  return normalizeCartItems(items).flatMap((item) =>
    Array.from({ length: item.quantity }, () => item.path)
  );
}

function CartPage({ images, onBackToGallery, globalCart, setGlobalCart }) {
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [copyFullFolders, setCopyFullFolders] = useState(false);

  const normalizedCart = normalizeCartItems(globalCart);
  const flattenedCart = flattenCartItems(globalCart);

  useEffect(() => {
    if (images && images.length > 0) {
      setSelectedImage(images[0]);
      setCurrentIndex(0);
    }
  }, [images]);

  const handleAddToCart = (image) => {
    setGlobalCart((previousCart = []) => {
      const currentCart = normalizeCartItems(previousCart);
      const existingItem = currentCart.find((item) => item.path === image);

      if (existingItem) {
        return currentCart.map((item) =>
          item.path === image ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...currentCart, { path: image, quantity: 1 }];
    });
  };

  const handleUpdateCartItemQuantity = (image, nextQuantity) => {
    const validQuantity = Math.max(1, Number(nextQuantity) || 1);

    setGlobalCart((previousCart = []) =>
      normalizeCartItems(previousCart).map((item) =>
        item.path === image ? { ...item, quantity: validQuantity } : item
      )
    );
  };

  const handleRemoveFromCart = (image) => {
    setGlobalCart((previousCart = []) =>
      normalizeCartItems(previousCart).filter((item) => item.path !== image)
    );
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
    if (flattenedCart.length === 0) return alert("Aucune image dans le panier !");
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
          files: flattenCartItems(globalCart),
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
    <div className="d-flex" style={{ height: "100vh" }}>
      <div className="flex-grow-1 position-relative d-flex flex-column align-items-center justify-content-center border-end p-3">
        {selectedImage ? (
          <>
            <button
              className="position-absolute"
              style={{
                left: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                border: "1px solid rgba(255, 255, 255, 0.61)",
                background: "rgba(156, 156, 156, 0.52)",
                cursor: "pointer",
              }}
              onClick={goPrev}
            >
              <img src={`${process.env.PUBLIC_URL}/left.png`} alt="Précédent" style={{ width: "100px", height: "100px" }} />
            </button>

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

            <button
              className="position-absolute"
              style={{
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                zIndex: 10,
                border: "1px solid rgba(255, 255, 255, 0.61)",
                background: "rgba(156, 156, 156, 0.52)",
                cursor: "pointer",
              }}
              onClick={goNext}
            >
              <img src={`${process.env.PUBLIC_URL}/right.png`} alt="Suivant" style={{ width: "100px", height: "100px" }} />
            </button>

            <div className="mt-4 d-flex justify-content-center gap-3">
              <button
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.61)",
                  background: "rgba(156, 156, 156, 0.52)",
                  cursor: "pointer",
                }}
                onClick={() => handleAddToCart(selectedImage)}
              >
                <img src={`${process.env.PUBLIC_URL}/add.png`} alt="Ajouter au panier" style={{ width: "120px", height: "120px" }} />
              </button>
              <button
                style={{
                  border: "1px solid rgba(255, 255, 255, 0.61)",
                  background: "rgba(156, 156, 156, 0.52)",
                  cursor: "pointer",
                }}
                onClick={onBackToGallery}
              >
                <img src={`${process.env.PUBLIC_URL}/back.png`} alt="Retour à la galerie" style={{ width: "120px", height: "120px" }} />
              </button>
            </div>
          </>
        ) : (
          <p>Sélectionnez une image pour l’agrandir</p>
        )}
      </div>

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
        <h5>🛒 Panier ({flattenedCart.length})</h5>
        <div style={{ flex: 1, overflowY: "auto", marginTop: "0.5rem", position: "relative" }}>
          {normalizedCart.length > 0 ? (
            normalizedCart.map((item, idx) => (
              <div
                key={`${item.path}-${idx}`}
                style={{
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  gap: "12px",
                  width: "100%",
                }}
              >
                <img
                  src={item.path}
                  alt={`panier-${idx}`}
                  style={{
                    width: "80px",
                    height: "80px",
                    objectFit: "cover",
                    borderRadius: "8px",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    cursor: "pointer",
                    flexShrink: 0,
                  }}
                  onClick={() => setSelectedImage(item.path)}
                />

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "6px",
                    marginLeft: "4px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      background: "rgba(255,255,255,0.9)",
                      borderRadius: "999px",
                      border: "1px solid rgba(0,0,0,0.15)",
                      overflow: "hidden",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleUpdateCartItemQuantity(item.path, item.quantity - 1)}
                      style={{
                        width: "26px",
                        height: "28px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#222",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                      aria-label={`Diminuer la quantité de ${item.path}`}
                    >
                      −
                    </button>
                    <span
                      style={{
                        minWidth: "24px",
                        textAlign: "center",
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#1f1f1f",
                        lineHeight: 1,
                      }}
                    >
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateCartItemQuantity(item.path, item.quantity + 1)}
                      style={{
                        width: "26px",
                        height: "28px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "18px",
                        fontWeight: "bold",
                        color: "#222",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 0,
                      }}
                      aria-label={`Augmenter la quantité de ${item.path}`}
                    >
                      +
                    </button>
                  </div>

                  <button
                    style={{
                      width: "28px",
                      height: "28px",
                      background: "rgba(255, 0, 0, 0.9)",
                      border: "none",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "12px",
                      padding: 0,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                      color: "white",
                    }}
                    onClick={() => handleRemoveFromCart(item.path)}
                    aria-label={`Retirer ${item.path}`}
                  >
                    ✕
                  </button>
                </div>
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
            cursor: flattenedCart.length === 0 ? "not-allowed" : "pointer",
            opacity: flattenedCart.length === 0 ? 0.5 : 1,
            marginTop: "1rem",
            flexShrink: 0,
          }}
          onClick={handleConfirm}
          disabled={flattenedCart.length === 0}
        >
          <img src={`${process.env.PUBLIC_URL}/confirm.png`} alt="Confirmer le panier" style={{ width: "120px", height: "120px" }} />
        </button>
      </div>

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
