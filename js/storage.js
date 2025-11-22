// js/storage.js
// Gestione salvataggio su localStorage + supporto opzionale "file dati" (File System Access API)

const Storage = (function () {
  const STORAGE_KEY = "pugliaSaluteLibrettoPediatrico";

  // Handle al file scelto dall'utente (se presente)
  let fileHandle = null;

  function baseEmptyState() {
    return { children: [], notesVersion: 1 };
  }

  function loadFromLocalStorage() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return baseEmptyState();
      const parsed = JSON.parse(raw);
      if (!parsed.children) parsed.children = [];
      return parsed;
    } catch (err) {
      console.error("Errore nel caricamento dal localStorage:", err);
      return baseEmptyState();
    }
  }

  function saveToLocalStorage(state) {
    try {
      const serialised = JSON.stringify(state);
      window.localStorage.setItem(STORAGE_KEY, serialised);
    } catch (err) {
      console.error("Errore nel salvataggio nel localStorage:", err);
    }
  }

  // --- File System Access API ---

  function supportsFileBackend() {
    return (
      typeof window !== "undefined" &&
      "showOpenFilePicker" in window &&
      "FileSystemFileHandle" in window
    );
  }

  async function writeToFile(serialised) {
    if (!fileHandle) return;
    try {
      const writable = await fileHandle.createWritable();
      await writable.write(serialised);
      await writable.close();
    } catch (err) {
      console.error("Errore durante la scrittura sul file dati:", err);
    }
  }

  async function connectFileAndLoad() {
    if (!supportsFileBackend()) {
      alert(
        "Il tuo browser non supporta la modalità file dati. Usa la memoria del browser."
      );
      return null;
    }

    try {
      const [handle] = await window.showOpenFilePicker({
        types: [
          {
            description: "File dati libretto (JSON)",
            accept: { "application/json": [".json"] },
          },
        ],
        multiple: false,
      });

      if (!handle) return null;

      const file = await handle.getFile();
      const text = await file.text();
      const imported = JSON.parse(text);

      if (!imported || !Array.isArray(imported.children)) {
        alert(
          "Il file non sembra essere un backup valido del libretto (manca la proprietà 'children')."
        );
        return null;
      }

      fileHandle = handle;

      // Aggiorna anche il localStorage con questi dati (per avere fallback)
      saveToLocalStorage(imported);

      return imported;
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Errore durante la lettura del file dati:", err);
        alert("Impossibile leggere il file dati selezionato.");
      }
      return null;
    }
  }

  // API pubblica usata dall'app

  function load() {
    // per compatibilità: in prima istanza leggiamo sempre da localStorage
    return loadFromLocalStorage();
  }

  function save(state) {
    // salvataggio "sincrono" sul localStorage
    saveToLocalStorage(state);

    // se è collegato un file, prova a scrivere anche lì (asincrono, fire-and-forget)
    try {
      const serialised = JSON.stringify(state);
      if (fileHandle) {
        writeToFile(serialised); // non aspettiamo la promise
      }
    } catch (err) {
      console.error("Errore nel salvataggio dello stato:", err);
    }
  }

  function hasFileBackend() {
    return !!fileHandle;
  }

  return {
    load,
    save,
    supportsFileBackend,
    connectFileAndLoad,
    hasFileBackend,
    STORAGE_KEY,
  };
})();
