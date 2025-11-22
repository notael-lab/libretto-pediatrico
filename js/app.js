// js/app.js
// Logica di collegamento tra modello, storage, UI, grafici e funzioni extra

(function () {
  // Elementi pannello elenco figli
  const childForm = document.getElementById("childForm");
  const toggleChildFormBtn = document.getElementById("toggleChildFormBtn");
  const cancelChildFormBtn = document.getElementById("cancelChildFormBtn");
  const childrenListEl = document.getElementById("childrenList");

  // Elementi dettaglio figlio
  const deleteChildBtn = document.getElementById("deleteChildBtn");
  const printChildBtn = document.getElementById("printChildBtn");
  const tabsContainer = document.querySelector("#childDetail .tabs");

  // Form sezioni libretto
  const anagForm = document.getElementById("anagraficaForm");
  const visitForm = document.getElementById("visitForm");
  const vaccineForm = document.getElementById("vaccineForm");
  const notesForm = document.getElementById("notesForm");

  // Tabelle visite/vaccini
  const visitsTableBodyEl = document.getElementById("visitsTableBody");
  const vaccinesTableBodyEl = document.getElementById("vaccinesTableBody");

  // Note estese
  const notesTextEl = document.getElementById("notesText");

  // Footer
  const footerYearEl = document.getElementById("footerYear");

  // Export / Import JSON
  const exportJsonBtn = document.getElementById("exportJsonBtn");
  const importJsonInput = document.getElementById("importJsonInput");

  // Stato applicazione
  let state = Storage.load();
  let selectedChildId = state.children.length ? state.children[0].id : null;

  // ---- Helper: aggiorna grafici in modo sicuro ----
  function safeChartsUpdate(child) {
    try {
      // QUI il fix: niente window.Charts, uso typeof che è sicuro anche se Charts non esiste
      if (typeof Charts !== "undefined" && typeof Charts.update === "function") {
        Charts.update(child);
      }
    } catch (err) {
      console.error("Errore nell'aggiornamento dei grafici:", err);
    }
  }

  // ---- Inizializzazione ----

  function init() {
  try {
    if (footerYearEl) {
      footerYearEl.textContent = new Date().getFullYear();
    }

    UI.renderChildrenList(state.children, selectedChildId);
    const initialChild = selectedChildId
      ? Models.findChild(state, selectedChildId)
      : null;
    UI.showChildDetail(initialChild);
    safeChartsUpdate(initialChild);

    bindEvents();

    // >>> QUESTA RIGA DEVE ESSERCI <<<
    maybeAskForDataFile();
  } catch (err) {
    console.error("Errore durante l'inizializzazione dell'app:", err);
  }
}

  

  // ---- Event listeners ----

  function bindEvents() {
    // Se qualche elemento non esiste per errore di markup, evitiamo crash
    if (!childForm || !toggleChildFormBtn || !cancelChildFormBtn || !childrenListEl) {
      console.error("Elementi principali mancanti: controlla gli ID in index.html");
      return;
    }


    

    // Form nuovo figlio - mostra/nasconde
    toggleChildFormBtn.addEventListener("click", () => {
      const isHidden = childForm.classList.contains("hidden");
      if (isHidden) {
        childForm.classList.remove("hidden");
        childForm.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        childForm.classList.add("hidden");
      }
    });

    // Annulla nuovo figlio
    cancelChildFormBtn.addEventListener("click", () => {
      childForm.reset();
      childForm.classList.add("hidden");
    });

    // Salva nuovo figlio
    childForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = new FormData(childForm);
      const child = Models.createChild({
        nome: (formData.get("nome") || "").toString().trim(),
        cognome: (formData.get("cognome") || "").toString().trim(),
        dataNascita: formData.get("dataNascita") || "",
        codiceFiscale: (formData.get("codiceFiscale") || "")
          .toString()
          .trim(),
        pediatra: (formData.get("pediatra") || "").toString().trim(),
        noteGenerali: (formData.get("noteGenerali") || "")
          .toString()
          .trim(),
      });

      state.children.push(child);
      selectedChildId = child.id;
      Storage.save(state);

      childForm.reset();
      childForm.classList.add("hidden");

      UI.renderChildrenList(state.children, selectedChildId);
      UI.showChildDetail(child);
      safeChartsUpdate(child);
    });

    // Selezione figlio nell'elenco
    childrenListEl.addEventListener("click", (event) => {
      const li = event.target.closest(".child-item");
      if (!li || !li.dataset.id) return;

      const id = li.dataset.id;
      const child = Models.findChild(state, id);
      if (!child) return;

      selectedChildId = id;
      UI.renderChildrenList(state.children, selectedChildId);
      UI.showChildDetail(child);
      safeChartsUpdate(child);
    });

    // Elimina libretto figlio
    if (deleteChildBtn) {
      deleteChildBtn.addEventListener("click", () => {
        if (!selectedChildId) return;
        const child = Models.findChild(state, selectedChildId);
        const name = child
          ? `${child.nome || ""} ${child.cognome || ""}`.trim()
          : "";
        const message = name
          ? `Sei sicuro di voler eliminare il libretto di ${name}? L'operazione non può essere annullata.`
          : "Sei sicuro di voler eliminare questo libretto? L'operazione non può essere annullata.";

        if (!window.confirm(message)) {
          return;
        }

        Models.removeChild(state, selectedChildId);
        selectedChildId = state.children.length ? state.children[0].id : null;
        Storage.save(state);

        UI.renderChildrenList(state.children, selectedChildId);
        const newChild = selectedChildId
          ? Models.findChild(state, selectedChildId)
          : null;
        UI.showChildDetail(newChild);
        safeChartsUpdate(newChild);
      });
    }

    // Tabs del libretto
    if (tabsContainer) {
      tabsContainer.addEventListener("click", (event) => {
        const btn = event.target.closest(".tab");
        if (!btn) return;
        const tabName = btn.dataset.tab;
        UI.setActiveTab(tabName);
      });
    }

    // Salvataggio ANAGRAFICA
    if (anagForm) {
      anagForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!selectedChildId) return;
        const child = Models.findChild(state, selectedChildId);
        if (!child) return;

        const formData = new FormData(anagForm);
        child.nome = (formData.get("nome") || "").toString().trim();
        child.cognome = (formData.get("cognome") || "").toString().trim();
        child.dataNascita = formData.get("dataNascita") || "";
        child.codiceFiscale = (formData.get("codiceFiscale") || "")
          .toString()
          .trim();
        child.pediatra = (formData.get("pediatra") || "").toString().trim();
        child.noteGenerali = (formData.get("noteGenerali") || "")
          .toString()
          .trim();

        Storage.save(state);
        UI.renderChildrenList(state.children, selectedChildId);
        UI.showChildDetail(child);
        safeChartsUpdate(child);
      });
    }

    // Aggiungi VISITA
    if (visitForm) {
      visitForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!selectedChildId) return;
        const child = Models.findChild(state, selectedChildId);
        if (!child) return;

        const formData = new FormData(visitForm);
        const fields = {
          data: formData.get("data") || "",
          tipo: (formData.get("tipo") || "").toString().trim(),
          peso: (formData.get("peso") || "").toString().trim(),
          altezza: (formData.get("altezza") || "").toString().trim(),
          circonferenzaCranica: (formData.get("circonferenzaCranica") || "")
            .toString()
            .trim(),
          note: (formData.get("note") || "").toString().trim(),
        };

        if (!fields.data || !fields.tipo) {
          window.alert("Compila almeno data e tipo visita.");
          return;
        }

        const visit = Models.createVisit(fields);
        child.visite.push(visit);
        Storage.save(state);

        visitForm.reset();
        UI.renderVisits(child.visite);
        safeChartsUpdate(child);
      });
    }

    // Aggiungi VACCINAZIONE
    if (vaccineForm) {
      vaccineForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!selectedChildId) return;
        const child = Models.findChild(state, selectedChildId);
        if (!child) return;

        const formData = new FormData(vaccineForm);
        const fields = {
          data: formData.get("data") || "",
          nome: (formData.get("nome") || "").toString().trim(),
          dose: (formData.get("dose") || "").toString().trim(),
          lotto: (formData.get("lotto") || "").toString().trim(),
          note: (formData.get("note") || "").toString().trim(),
        };

        if (!fields.data || !fields.nome) {
          window.alert("Compila almeno data e nome del vaccino.");
          return;
        }

        const vaccine = Models.createVaccine(fields);
        child.vaccinazioni.push(vaccine);
        Storage.save(state);

        vaccineForm.reset();
        UI.renderVaccines(child.vaccinazioni);
      });
    }

    // Elimina VISITA (event delegation)
    if (visitsTableBodyEl) {
      visitsTableBodyEl.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-action='delete-visit']");
        if (!btn || !selectedChildId) return;

        const id = btn.dataset.id;
        const child = Models.findChild(state, selectedChildId);
        if (!child) return;

        child.visite = child.visite.filter((v) => v.id !== id);
        Storage.save(state);
        UI.renderVisits(child.visite);
        safeChartsUpdate(child);
      });
    }

    // Elimina VACCINO (event delegation)
    if (vaccinesTableBodyEl) {
      vaccinesTableBodyEl.addEventListener("click", (event) => {
        const btn = event.target.closest("button[data-action='delete-vaccine']");
        if (!btn || !selectedChildId) return;

        const id = btn.dataset.id;
        const child = Models.findChild(state, selectedChildId);
        if (!child) return;

        child.vaccinazioni = child.vaccinazioni.filter((v) => v.id !== id);
        Storage.save(state);
        UI.renderVaccines(child.vaccinazioni);
      });
    }

    // Salva NOTE estese
    if (notesForm && notesTextEl) {
      notesForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!selectedChildId) return;
        const child = Models.findChild(state, selectedChildId);
        if (!child) return;

        child.noteEstese = notesTextEl.value || "";
        Storage.save(state);
        window.alert("Note salvate.");
      });
    }

    // Stampa libretto del figlio corrente
    if (printChildBtn) {
      printChildBtn.addEventListener("click", () => {
        window.print();
      });
    }

    // Esporta stato completo in JSON
    if (exportJsonBtn) {
      exportJsonBtn.addEventListener("click", () => {
        try {
          const dataStr = JSON.stringify(state, null, 2);
          const blob = new Blob([dataStr], { type: "application/json" });
          const url = URL.createObjectURL(blob);

          const a = document.createElement("a");
          a.href = url;
          a.download = "libretti_pediatrici_puglia_salute.json";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } catch (err) {
          console.error(err);
          window.alert("Errore durante l'esportazione dei dati.");
        }
      });
    }

    // Importa stato completo da JSON
    if (importJsonInput) {
      importJsonInput.addEventListener("change", (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
          try {
            const text = String(reader.result || "");
            const imported = JSON.parse(text);

            if (!imported || !Array.isArray(imported.children)) {
              window.alert(
                "File non valido. Atteso un oggetto con proprietà 'children'."
              );
              return;
            }

            if (
              !window.confirm(
                "Importando il file sovrascriverai i dati attuali. Continuare?"
              )
            ) {
              return;
            }

            state = imported;
            selectedChildId =
              state.children && state.children.length
                ? state.children[0].id
                : null;
            Storage.save(state);

            UI.renderChildrenList(state.children, selectedChildId);
            const child = selectedChildId
              ? Models.findChild(state, selectedChildId)
              : null;
            UI.showChildDetail(child);
            safeChartsUpdate(child);
          } catch (err) {
            console.error(err);
            window.alert(
              "Impossibile leggere il file JSON. Verifica che sia stato esportato dall'app."
            );
          } finally {
            importJsonInput.value = "";
          }
        };

        reader.readAsText(file, "utf-8");
      });
    }
  }

async function maybeAskForDataFile() {
  // 1. il browser non supporta il file backend → esci in silenzio
  if (!Storage.supportsFileBackend()) {
    console.warn(
      "Modalità file dati non disponibile: niente showOpenFilePicker o contesto non sicuro."
    );
    return;
  }

  // 2. se c'è già un file collegato in questa sessione, non chiedere di nuovo
  if (Storage.hasFileBackend()) {
    return;
  }

  const useFile = window.confirm(
    "Vuoi usare un file dati JSON (in una cartella sincronizzata) per poter " +
      "aprire il libretto da più dispositivi?\n\n" +
      "OK = scegli file dati JSON\n" +
      "Annulla = usa la memoria del browser"
  );

  if (!useFile) return;

  const imported = await Storage.connectFileAndLoad();
  if (!imported) return;

  // Abbiamo caricato nuovi dati dal file: aggiornare stato e UI
  state = imported;
  selectedChildId = state.children.length ? state.children[0].id : null;

  UI.renderChildrenList(state.children, selectedChildId);
  const child = selectedChildId
    ? Models.findChild(state, selectedChildId)
    : null;
  UI.showChildDetail(child);
  safeChartsUpdate(child);
}





  // Avvio al caricamento del DOM
  document.addEventListener("DOMContentLoaded", init);
})();


