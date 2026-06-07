import React, { useState } from "react";
import PasswordPrompt from "../components/PasswordPrompt";
import MediaGallery from "../components/MediaGallery";
import CartPage from "../components/CartPage";

function Client() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState("gallery"); // gallery | cart
  const [cartImages, setCartImages] = useState([]); // images à envoyer au CartPage

  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(
    `${String(today.getDate()).padStart(2, '0')}_${String(today.getMonth() + 1).padStart(2, '0')}_${today.getFullYear()}`
  );

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

  const formatDateToString = (date) => {
    return `${String(date.getDate()).padStart(2, '0')}_${String(date.getMonth() + 1).padStart(2, '0')}_${date.getFullYear()}`;
  };

  const handleDateChange = (e) => {
    const dateString = e.target.value; // format: YYYY-MM-DD
    if (dateString) {
      const date = new Date(dateString);
      setSelectedDate(formatDateToString(date));
    }
  };

  return (
    <div className="container-fluid mt-3">
      {!isAuthenticated ? (
        <PasswordPrompt onSubmit={handlePasswordSubmit} />
      ) : currentPage === "gallery" ? (
        <>
          <MediaGallery
            selectedDate={selectedDate}
            onDateChange={handleDateChange}
            onFolderCreated={handleFolderCreated}
          />
        </>
      ) : (
        <CartPage images={cartImages} onBackToGallery={() => setCurrentPage("gallery")} />
      )}
    </div>
  );
}

export default Client;
