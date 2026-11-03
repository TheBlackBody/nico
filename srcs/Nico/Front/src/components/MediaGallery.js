import React, { useState, useEffect, useCallback, useRef } from "react";
import CartPage from "./CartPage";

function MediaGallery({ basePath, selectedDate, onDateChange, onFolderCreated }) {
  const [albums, setAlbums] = useState([]);
  const [currentPath, setCurrentPath] = useState("");
  const [selectedRange, setSelectedRange] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [showDateInput, setShowDateInput] = useState(false);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(false);
  const [cartImages, setCartImages] = useState(null);
  const [cartClientName, setCartClientName] = useState("");
  const [cart, setCart] = useState([]); // ✅ panier global partagé

  const getTodayFolder = useCallback(() => {
    if (selectedDate) {
      return `date/${selectedDate}`;
    }
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return `date/${dd}_${mm}_${yyyy}`;
  }, [selectedDate]);

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
  }, [getTodayFolder, currentPath]);

  useEffect(() => {
    const todayFolder = getTodayFolder();
    setCurrentPath(todayFolder);
  }, [getTodayFolder]);

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

    // ✅ Tri alphabétique
    const folders = items
      .filter((i) => i.isFolder)
      .sort((a, b) =>
        a.folder.localeCompare(b.folder, "fr", {
          numeric: true,
          sensitivity: "base",
        })
      );
    const files = items
      .filter((i) => !i.isFolder)
      .sort((a, b) =>
        a.path.localeCompare(b.path, "fr", {
          numeric: true,
          sensitivity: "base",
        })
      );

    return [...folders, ...files];
  };

  const items = getItemsAtPath(currentPath);
  const dateInputRef = useRef(null);

  const handleFolderClick = (folderName) => {
    const newPath = `${currentPath}/${folderName}`;
    const pathParts = newPath.split("/");

    // Si on est dans un dossier client
    if (pathParts.length >= 4) {
      const clientName = pathParts[pathParts.length - 1];
      const clientFiles = albums.filter((file) =>
        file.folder.startsWith(newPath + "/")
      );
      const directFiles = albums.filter((file) => file.folder === newPath);

      const allImages = [...clientFiles, ...directFiles].map(
        (f) => `${process.env.PUBLIC_URL}/media${f.path.replace("/media", "")}`
      );

      setCartImages(allImages);
      setCartClientName(clientName);
      return;
    }

    setCurrentPath(newPath);
    setSelectedRange([]);
  };

  // ✅ CORRECTION ICI : Redirige le navigateur directement sur l'URL "/"
  const handleBack = () => {
    if (currentPath === getTodayFolder()) {
      window.location.href = "/";
    } else {
      const parts = currentPath.split("/");
      parts.pop();
      setCurrentPath(parts.join("/"));
    }
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
    if (!clientName.trim()) return alert("Merci d’entrer un nom de client");
    setLoading(true);

    fetch("/api/albums/create-client/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client: clientName, files: selectedRange }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.files && data.files.length > 0) {
          const normalizedImages = data.files.map((f) => {
            const cleanPath = f.split("/media/")[1];
            return `${process.env.PUBLIC_URL}/media/${cleanPath}`;
          });

          const clientFolderName =
            data.files[0].split("/media/")[1].split("/")[3] || clientName;

          setCartClientName(clientFolderName);
          setCartImages(normalizedImages);
        } else {
          alert("Erreur : aucune image renvoyée par le serveur.");
        }

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

  // ✅ Passage du panier global à CartPage
  if (cartImages) {
    return (
      <CartPage
        images={cartImages}
        clientName={cartClientName}
        onBackToGallery={() => setCartImages(null)}
        globalCart={cart}
        setGlobalCart={setCart}
      />
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
        <h2 style={{ margin: 0 }}>Explorateur du {getTodayFolder().split("/")[1]}</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => {
              setShowDateInput(true);
              setTimeout(() => {
                if (dateInputRef.current) {
                  if (dateInputRef.current.showPicker) {
                    dateInputRef.current.showPicker();
                  }
                  dateInputRef.current.focus();
                }
              }, 0);
            }}
            style={{
              background: "transparent",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
            }}
            aria-label="Ouvrir le sélecteur de date"
          >
            <img
              src={`${process.env.PUBLIC_URL}/cal.png`}
              alt="Sélectionner une date"
              style={{ width: "64px", height: "64px" }}
            />
          </button>
          {showDateInput && (
            <input
              ref={dateInputRef}
              type="date"
              id="date-picker"
              value={selectedDate.split("_").reverse().join("-")}
              onChange={onDateChange}
              onBlur={() => setShowDateInput(false)}
              style={{
                padding: "8px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            />
          )}
        </div>
      </div>

      {/* ✅ Le bouton s'affiche toujours tant qu'on a un chemin valide */}
      {currentPath && (
        <button onClick={handleBack} style={{ marginBottom: "10px" }}>
          🔙 Retour
        </button>
      )}

      <div className="d-flex flex-wrap">
        {items.map((item, i) => {
          const imageUrl = `${process.env.PUBLIC_URL}/media${item.path?.replace(
            "/media",
            ""
          )}`;
          const isInCart = cart.some(
            (cartItem) =>
              (typeof cartItem === "string" && cartItem === imageUrl) ||
              (cartItem && cartItem.path === imageUrl)
          );

          return (
            <div
              key={i}
              className="m-2"
              style={{
                border: isInCart
                  ? "3px solid green"
                  : selectedRange.includes(item.path)
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
                    position: "relative",
                    backgroundImage: `url(${process.env.PUBLIC_URL}/public_folder.png)`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.5)",
                      color: "white",
                      padding: "8px",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.folder}
                  </div>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt={`img-${i}`}
                  style={{
                    width: "200px",
                    height: "150px",
                    objectFit: "cover",
                  }}
                />
              )}
            </div>
          );
        })}
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