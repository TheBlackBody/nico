import React, { useState } from "react";

function PasswordPrompt({ onSubmit }) {
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(password);
  };

  return (
    <div className="text-center">
      <h2>Accès Client</h2>
      <p>Veuillez entrer le mot de passe pour accéder aux photos</p>
      <form onSubmit={handleSubmit} className="d-flex justify-content-center mt-3">
        <input
          type="password"
          className="form-control w-25"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-primary ms-2">
          Valider
        </button>
      </form>
    </div>
  );
}

export default PasswordPrompt;

