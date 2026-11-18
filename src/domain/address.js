
"use strict";

const FIELDS = ["street", "number", "district", "city", "state", "zip"];

function normalizeAddress(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      message: "Informe um endereço de entrega válido.",
    };
  }

  const address = {};

  for (const field of FIELDS) {
    address[field] = String(input[field] ?? "").trim();
  }

  const missing = FIELDS.some((field) => !address[field]);

  if (missing) {
    return {
      ok: false,
      message: "Preencha todos os campos do endereço.",
    };
  }

  address.state = address.state.toUpperCase();
  address.zip = address.zip.replace(/\D/g, "");

  if (!/^[A-Z]{2}$/.test(address.state)) {
    return {
      ok: false,
      message: "Informe uma UF válida.",
    };
  }

  if (!/^\d{8}$/.test(address.zip)) {
    return {
      ok: false,
      message: "Informe um CEP com 8 números.",
    };
  }

  return {
    ok: true,
    address,
  };
}

module.exports = {
  normalizeAddress,
  FIELDS,
};
