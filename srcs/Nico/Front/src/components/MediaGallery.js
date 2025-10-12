import React, { useState, useEffect, useCallback } from "react";
import CartPage from "./CartPage"; // Assurez-vous que CartPage est importé

function MediaGallery({ basePath, onFolderCreated }) {
  const [albums, setAlbums] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedRange, setSelectedRange] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartImages, setCartImages] = useState(null); // Pour CartPage

  const getTodayFolder = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `date/${dd}_${mm}_${yyyy}`;
  };

  const fetchAlbums = useCallback(() => {
    fetch("/api/albums/liste/")
      .then((res) => res.json())
      .then((data) => {
        const todayFolder = getTodayFolder();
        const todayFiles = data.filter((file) =>
          file.folder.startsWith(todayFolder)
        );
        setAlbums(todayFiles);
        if (!currentPath) setCurrentPath(todayFolder);
      })
      .catch((err) => console.error(err));
  }, [currentPath]);

  useEffect(() => {
    fetchAlbums();
    const interval = setInterval(fetchAlbums, 5000);
    return () => clearInterval(interval);
  }, [fetchAlbums]);

  const getItemsAtPath = (path) => {
    const items = [];
    const prefix = path ? `${path}/` : "";
    albums.forEach((file) => {
      if (file.folder === path) {
        items.push({ ...file, isFolder: false });
      } else if (file.folder.startsWith(prefix)) {
        const subPath = file.folder.slice(prefix.length);
        const firstPart = subPath.split("/")[0];
        if (firstPart && !items.find((i) => i.folder === firstPart && i.isFolder)) {
          items.push({ folder: firstPart, isFolder: true });
        }
      }
    });
    return items;
  };

  const items = getItemsAtPath(currentPath);

  const handleFolderClick = (folderName) => {
    const newPath = `${currentPath}/${folderName}`;
    const pathParts = newPath.split("/");

    // Si on est dans un dossier client (niveau >= 3 : date / photographe / client)
    if (pathParts.length >= 4) {
      const clientFiles = albums.filter((file) =>
        file.folder.startsWith(newPath + "/")
      );
      const directFiles = albums.filter(file => file.folder === newPath);
      const allImages = [...clientFiles, ...directFiles].map(f =>
        `${process.env.PUBLIC_URL}/media${f.path.replace("/media", "")}`
      );

      setCartImages(allImages); // On envoie à CartPage
      return; // ne pas changer currentPath
    }

    // Navigation normale
    setCurrentPath(newPath);
    setSelectedRange([]);
  };

  const handleBack = () => {
    const parts = currentPath.split("/");
    parts.pop();
    setCurrentPath(parts.join("/"));
    setSelectedRange([]);
  };

  const handleImageClick = (filePath) => {
    if (selectedRange.length === 0) {
      setSelectedRange([filePath]);
      return;
    }
    if (selectedRange.length === 1) {
      const firstPath = selectedRange[0];
      const allFiles = items.filter((f) => !f.isFolder).map((f) => f.path);
      const start = Math.min(
        allFiles.indexOf(firstPath),
        allFiles.indexOf(filePath)
      );
      const end = Math.max(
        allFiles.indexOf(firstPath),
        allFiles.indexOf(filePath)
      );
      setSelectedRange(allFiles.slice(start, end + 1));
      setShowPopup(true);
    } else {
      setSelectedRange([filePath]);
    }
  };

  const handleConfirm = () => {
    if (!clientName.trim())
      return alert("Merci d’entrer un nom de client");
    setLoading(true);

    fetch("/api/albums/create-client/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client: clientName, files: selectedRange }),
    })
      .then((res) => res.json())
      .then(() => {
        if (onFolderCreated) onFolderCreated(selectedRange);
        setShowPopup(false);
        setClientName("");
        setSelectedRange([]);
        fetchAlbums();
      })
      .catch((err) => {
        console.error(err);
        alert("Erreur lors de la création du dossier client");
      })
      .finally(() => setLoading(false));
  };

  // Si cartImages n'est pas null, afficher CartPage
  if (cartImages) {
    return (
      <CartPage
        images={cartImages}
        onBackToGallery={() => setCartImages(null)}
      />
    );
  }

  return (
    <div>
      <h2>Explorateur du {getTodayFolder().split("/")[1]}</h2>

      {currentPath !== getTodayFolder() && (
        <button onClick={handleBack} style={{ marginBottom: "10px" }}>
          🔙 Retour
        </button>
      )}

      <div className="d-flex flex-wrap">
        {items.map((item, i) => (
          <div
            key={i}
            className="m-2"
            style={{
              border: selectedRange.includes(item.path)
                ? "3px solid red"
                : "1px solid #ccc",
              padding: "2px",
              cursor: item.isFolder ? "pointer" : "default",
            }}
            onClick={() =>
              item.isFolder
                ? handleFolderClick(item.folder)
                : handleImageClick(item.path)
            }
          >
            {item.isFolder ? (
              <div
                style={{
                  width: "200px",
                  height: "150px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "#eee",
                  fontWeight: "bold",
                }}
              >
                {item.folder}
              </div>
            ) : (
              <img
                src={`${process.env.PUBLIC_URL}/media${item.path.replace(
                  "/media",
                  ""
                )}`}
                alt={`img-${i}`}
                style={{ width: "200px", height: "150px", objectFit: "cover" }}
              />
            )}
          </div>
        ))}
      </div>

      {showPopup && (
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
            }}
          >
            <h3>Créer un dossier client</h3>
            <input
              type="text"
              placeholder="Nom du client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              disabled={loading}
              style={{ width: "100%", padding: "5px" }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px",
              }}
            >
              <button onClick={handleConfirm} disabled={loading}>
                {loading ? "Création..." : "Confirmer"}
              </button>
              <button onClick={() => setShowPopup(false)} disabled={loading}>
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaGallery;
