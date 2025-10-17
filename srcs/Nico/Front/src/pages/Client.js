import React, { useState } from "react";
import PasswordPrompt from "../components/PasswordPrompt";
import MediaGallery from "../components/MediaGallery";
import CartPage from "../components/CartPage";

function Client() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("gallery"); // gallery | cart
  const [cartImages, setCartImages] = useState([]); // images à envoyer au CartPage

  const correctPassword = "1234";

  const handlePasswordSubmit = (inputPassword) => {
    if (inputPassword === correctPassword) {
      setIsAuthenticated(true);
    } else {
      alert("Mot de passe incorrect !");
    }
  };

  // Quand le dossier est créé → on bascule vers CartPage
  const handleFolderCreated = (images) => {
    setCartImages(images);
    setCurrentPage("cart");
  };

  return (
    <div className="container-fluid mt-3">
      {!isAuthenticated ? (
        <PasswordPrompt onSubmit={handlePasswordSubmit} />
      ) : currentPage === "gallery" ? (
        <MediaGallery basePath="/media/day_date/" onFolderCreated={handleFolderCreated} />
      ) : (
        <CartPage images={cartImages} onBackToGallery={() => setCurrentPage("gallery")} />
      )}
    </div>
  );
}

export default Client;
