// js/models.js
// Modello dati per figli, visite, vaccinazioni

const Models = (function () {
  function createId(prefix) {
    return (
      prefix +
      "_" +
      Date.now().toString(36) +
      "_" +
      Math.random().toString(16).slice(2)
    );
  }

  function createChild(fields) {
    return {
      id: createId("child"),
      nome: fields.nome || "",
      cognome: fields.cognome || "",
      dataNascita: fields.dataNascita || "",
      codiceFiscale: fields.codiceFiscale || "",
      pediatra: fields.pediatra || "",
      noteGenerali: fields.noteGenerali || "",
      noteEstese: "",
      visite: [],
      vaccinazioni: [],
    };
  }

  function createVisit(fields) {
    return {
      id: createId("visit"),
      data: fields.data || "",
      tipo: fields.tipo || "",
      peso: fields.peso || "",
      altezza: fields.altezza || "",
      circonferenzaCranica: fields.circonferenzaCranica || "",
      note: fields.note || "",
    };
  }

  function createVaccine(fields) {
    return {
      id: createId("vax"),
      data: fields.data || "",
      nome: fields.nome || "",
      dose: fields.dose || "",
      lotto: fields.lotto || "",
      note: fields.note || "",
    };
  }

  function findChild(state, id) {
    if (!state || !state.children) return null;
    return state.children.find((c) => c.id === id) || null;
  }

  function removeChild(state, id) {
    if (!state || !state.children) return;
    state.children = state.children.filter((c) => c.id !== id);
  }

  function ageFromBirthdate(dateString) {
    if (!dateString) return null;
    const birth = new Date(dateString);
    if (Number.isNaN(birth.getTime())) return null;

    const today = new Date();
    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();
    let days = today.getDate() - birth.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    return { years, months, days };
  }

  return {
    createChild,
    createVisit,
    createVaccine,
    findChild,
    removeChild,
    ageFromBirthdate,
  };
})();
