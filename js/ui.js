// js/ui.js
// Funzioni di rendering e aggiornamento dell'interfaccia

const UI = (function () {
  // Elementi principali
  const childrenListEl = document.getElementById("childrenList");
  const emptyStateEl = document.getElementById("emptyState");
  const childDetailEl = document.getElementById("childDetail");
  const childDetailNameEl = document.getElementById("childDetailName");
  const childDetailMetaEl = document.getElementById("childDetailMeta");
  const visitsTableBodyEl = document.getElementById("visitsTableBody");
  const vaccinesTableBodyEl = document.getElementById("vaccinesTableBody");
  const notesTextEl = document.getElementById("notesText");

  const anagForm = document.getElementById("anagraficaForm");

  function formatDate(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("it-IT");
  }

  function formatAgeText(child) {
    const info = Models.ageFromBirthdate(child.dataNascita);
    if (!info) return "";
    const parts = [];
    if (info.years) parts.push(`${info.years} anni`);
    if (info.months) parts.push(`${info.months} mesi`);
    if (!info.years && !info.months) parts.push(`${info.days} giorni`);
    return parts.join(" ");
  }

  function renderChildrenList(children, selectedChildId) {
    childrenListEl.innerHTML = "";

    if (!children.length) {
      const li = document.createElement("li");
      li.className = "child-item";
      li.innerHTML =
        '<div class="child-item-main"><span class="child-item-name">Nessun figlio inserito</span><span class="child-item-meta">Aggiungi un nuovo libretto pediatrico per iniziare.</span></div>';
      li.style.cursor = "default";
      childrenListEl.appendChild(li);
      return;
    }

    children.forEach((child) => {
      const li = document.createElement("li");
      li.className =
        "child-item" + (child.id === selectedChildId ? " active" : "");
      li.dataset.id = child.id;

      const mainDiv = document.createElement("div");
      mainDiv.className = "child-item-main";

      const nameSpan = document.createElement("span");
      nameSpan.className = "child-item-name";
      const fullName = `${child.nome || ""} ${child.cognome || ""}`.trim();
      nameSpan.textContent = fullName || "Senza nome";

      const metaSpan = document.createElement("span");
      metaSpan.className = "child-item-meta";

      const pieces = [];
      if (child.dataNascita) {
        pieces.push(`Nato il ${formatDate(child.dataNascita)}`);
      }
      const ageText = formatAgeText(child);
      if (ageText) {
        pieces.push(`Età: ${ageText}`);
      }
      metaSpan.textContent = pieces.join(" • ");

      mainDiv.appendChild(nameSpan);
      mainDiv.appendChild(metaSpan);

      const badgeSpan = document.createElement("span");
      badgeSpan.className = "child-badge";
      badgeSpan.textContent =
        (child.pediatra && `Pediatra: ${child.pediatra}`) || "Libretto attivo";

      li.appendChild(mainDiv);
      li.appendChild(badgeSpan);

      childrenListEl.appendChild(li);
    });
  }

  function showChildDetail(child) {
    if (!child) {
      emptyStateEl.classList.remove("hidden");
    } else {
      emptyStateEl.classList.add("hidden");
    }

    if (!child) {
      childDetailEl.classList.add("hidden");
      return;
    }

    childDetailEl.classList.remove("hidden");

    const fullName = `${child.nome || ""} ${child.cognome || ""}`.trim();
    childDetailNameEl.textContent = fullName || "Senza nome";

    const bits = [];
    if (child.dataNascita) {
      bits.push(`Nato il ${formatDate(child.dataNascita)}`);
    }
    const ageText = formatAgeText(child);
    if (ageText) {
      bits.push(`Età ${ageText}`);
    }
    if (child.pediatra) {
      bits.push(`Pediatra: ${child.pediatra}`);
    }
    childDetailMetaEl.textContent = bits.join(" • ");

    // Compila form anagrafica
    anagForm.nome.value = child.nome || "";
    anagForm.cognome.value = child.cognome || "";
    anagForm.dataNascita.value = child.dataNascita || "";
    anagForm.codiceFiscale.value = child.codiceFiscale || "";
    anagForm.pediatra.value = child.pediatra || "";
    anagForm.noteGenerali.value = child.noteGenerali || "";

    // Note estese
    notesTextEl.value = child.noteEstese || "";

    renderVisits(child.visite);
    renderVaccines(child.vaccinazioni);
  }

  function renderVisits(visite) {
    visitsTableBodyEl.innerHTML = "";

    if (!visite || !visite.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 7;
      td.textContent = "Nessuna visita registrata.";
      visitsTableBodyEl.appendChild(tr);
      tr.appendChild(td);
      return;
    }

    visite
      .slice()
      .sort((a, b) => (a.data || "").localeCompare(b.data || ""))
      .forEach((visit) => {
        const tr = document.createElement("tr");
        tr.dataset.id = visit.id;

        function td(text) {
          const cell = document.createElement("td");
          cell.textContent = text || "";
          return cell;
        }

        tr.appendChild(td(formatDate(visit.data)));
        tr.appendChild(td(visit.tipo));
        tr.appendChild(td(visit.peso ? `${visit.peso} kg` : ""));
        tr.appendChild(td(visit.altezza ? `${visit.altezza} cm` : ""));
        tr.appendChild(
          td(
            visit.circonferenzaCranica
              ? `${visit.circonferenzaCranica} cm`
              : ""
          )
        );
        tr.appendChild(td(visit.note));

        const actionsTd = document.createElement("td");
        actionsTd.className = "row-actions";
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn ghost small";
        deleteBtn.textContent = "Elimina";
        deleteBtn.dataset.action = "delete-visit";
        deleteBtn.dataset.id = visit.id;
        actionsTd.appendChild(deleteBtn);
        tr.appendChild(actionsTd);

        visitsTableBodyEl.appendChild(tr);
      });
  }

  function renderVaccines(vaccines) {
    vaccinesTableBodyEl.innerHTML = "";

    if (!vaccines || !vaccines.length) {
      const tr = document.createElement("tr");
      const td = document.createElement("td");
      td.colSpan = 6;
      td.textContent = "Nessuna vaccinazione registrata.";
      tr.appendChild(td);
      vaccinesTableBodyEl.appendChild(tr);
      return;
    }

    vaccines
      .slice()
      .sort((a, b) => (a.data || "").localeCompare(b.data || ""))
      .forEach((vax) => {
        const tr = document.createElement("tr");
        tr.dataset.id = vax.id;

        function td(text) {
          const cell = document.createElement("td");
          cell.textContent = text || "";
          return cell;
        }

        tr.appendChild(td(formatDate(vax.data)));
        tr.appendChild(td(vax.nome));
        tr.appendChild(td(vax.dose));
        tr.appendChild(td(vax.lotto));
        tr.appendChild(td(vax.note));

        const actionsTd = document.createElement("td");
        actionsTd.className = "row-actions";
        const deleteBtn = document.createElement("button");
        deleteBtn.type = "button";
        deleteBtn.className = "btn ghost small";
        deleteBtn.textContent = "Elimina";
        deleteBtn.dataset.action = "delete-vaccine";
        deleteBtn.dataset.id = vax.id;
        actionsTd.appendChild(deleteBtn);
        tr.appendChild(actionsTd);

        vaccinesTableBodyEl.appendChild(tr);
      });
  }

  function setActiveTab(tabName) {
    const tabs = childDetailEl.querySelectorAll(".tab");
    const contents = childDetailEl.querySelectorAll(".tab-content");

    tabs.forEach((tab) => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add("active");
      } else {
        tab.classList.remove("active");
      }
    });

    contents.forEach((section) => {
      if (section.dataset.tabContent === tabName) {
        section.classList.add("active");
      } else {
        section.classList.remove("active");
      }
    });
  }

  return {
    renderChildrenList,
    showChildDetail,
    renderVisits,
    renderVaccines,
    setActiveTab,
  };
})();
