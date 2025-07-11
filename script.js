let kunden = [];
let artikelData = [];
let aktuellerKunde = null;
let warenkorb = [];
let bestellungen = [];

const kundeSuche = document.getElementById('kundeSuche');
const suchErgebnisse = document.getElementById('suchErgebnisse');
const aktuellerKundeAnzeige = document.getElementById('aktuellerKunde');
const sperrhinweis = document.getElementById('sperrhinweis');
const ustidFeld = document.getElementById('ustid');
const landDropdown = document.getElementById('land');

// Beim Laden der Seite: Kunden und Artikel automatisch laden
window.addEventListener('DOMContentLoaded', function() {
  ladeCSV('Kunden.csv', function(data) {
    kunden = csvToJson(data);
    console.log('Kunden geladen:', kunden.length);
  });
  ladeCSV('Artikel.csv', function(data) {
    artikelData = csvToJson(data);
    console.log('Artikel geladen:', artikelData.length);
  });

  // Bestellungen aus localStorage holen
  const gespeicherte = localStorage.getItem("messe_bestellungen");
  if (gespeicherte) {
    bestellungen = JSON.parse(gespeicherte);
  }
});

// Hilfsfunktion zum Laden einer CSV per fetch
function ladeCSV(url, callback) {
  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error("Datei nicht gefunden: " + url);
      return res.text();
    })
    .then(text => callback(text))
    .catch(err => alert("Fehler beim Laden von " + url + ": " + err.message));
}

// Einfache CSV->JSON Konvertierung (erwartet Semikolon als Trenner)
function csvToJson(csv) {
  const lines = csv.split(/\r?\n/).filter(l => l.trim().length > 0);
  const header = lines[0].split(';').map(h => h.trim());
  return lines.slice(1).map(line => {
    const obj = {};
    line.split(';').forEach((val, i) => {
      obj[header[i]] = val.trim();
    });
    return obj;
  });
}

function zeigeNeukundeFormular() {
  document.getElementById('neukundeFormular').style.display = 'block';
}

landDropdown.addEventListener('change', () => {
  const land = landDropdown.value;
  ustidFeld.style.display = (land !== "Deutschland" && ["Österreich", "Frankreich", "Italien", "Niederlande"].includes(land)) ? "block" : "none";
});

kundeSuche.addEventListener('input', () => {
  const query = kundeSuche.value.toLowerCase().trim();
  suchErgebnisse.innerHTML = '';
  if (query.length === 0) return;

  const treffer = kunden.filter(k =>
    (k.name || k.Firma || "").toLowerCase().includes(query) || (k.ort || k.Ort || "").toLowerCase().includes(query)
  );

  if (treffer.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'Neukunde erfassen';
    li.style.fontStyle = 'italic';
    li.onclick = () => {
      document.getElementById('neukundeFormular').style.display = 'block';
      suchErgebnisse.innerHTML = '';
    };
    suchErgebnisse.appendChild(li);
    return;
  }

  treffer.slice(0, 10).forEach(k => {
    const name = k.name || k.Firma || "";
    const ort = k.ort || k.Ort || "";
    const gesperrt = (k.gesperrt || k.Gesperrt || "").toLowerCase() === "true";
    const li = document.createElement('li');
    li.textContent = `${name} (${ort})`;
    li.onclick = () => {
      aktuellerKunde = k;
      aktuellerKundeAnzeige.textContent = `Kunde: ${name} (${ort})`;
      sperrhinweis.textContent = gesperrt ? '⚠️ Achtung: Dieser Kunde ist gesperrt!' : '';
      suchErgebnisse.innerHTML = '';
      kundeSuche.value = '';
    };
    suchErgebnisse.appendChild(li);
  });
});

function neukundeSpeichern() {
  const firma = document.getElementById('firma').value.trim();
  const vorname = document.getElementById('vorname').value.trim();
  const nachname = document.getElementById('nachname').value.trim();
  const strasse = document.getElementById('strasse').value.trim();
  const plz = document.getElementById('plz').value.trim();
  const ort = document.getElementById('ort').value.trim();
  const land = document.getElementById('land').value.trim();
  const ustid = document.getElementById('ustid').value.trim();
  const telefon = document.getElementById('telefon').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!firma || !vorname || !nachname || !strasse || !plz || !ort || !telefon || !email) {
    alert('Bitte alle Pflichtfelder ausfüllen.');
    return;
  }

  if (land !== "Deutschland" && ustidFeld.style.display === "block" && ustid === "") {
    alert('Bitte USt-IdNr. eingeben.');
    return;
  }

  const k = {
    name: firma,
    ort,
    gesperrt: false,
    vorname, nachname, strasse, plz, land, ustid, telefon, email
  };
  kunden.push(k);
  aktuellerKunde = k;
  aktuellerKundeAnzeige.textContent = `Neukunde: ${firma} (${ort})`;
  sperrhinweis.textContent = '';
  document.getElementById('neukundeFormular').style.display = 'none';
}

function updateWarenkorb() {
  const liste = document.getElementById('warenkorbListe');
  const preis = document.getElementById('gesamtpreis');
  liste.innerHTML = '';
  let summe = 0;
  warenkorb.forEach((item, index) => {
    const einheit = item.einheit || item.Einheit || 'Stk';
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.name || item.Artikelname || item["Artikelname"]}</strong> (${einheit})<br>
      <button class="red" onclick="mengeAnpassen(${index}, -1)">-</button>
      ${item.menge} × ${parseFloat(item.preis || item.Preis).toFixed(2)} € = ${(item.menge * parseFloat(item.preis || item.Preis)).toFixed(2)} €
      <button class="green" onclick="mengeAnpassen(${index}, 1)">+</button>
    `;
    liste.appendChild(li);
    summe += item.menge * parseFloat(item.preis || item.Preis);
  });
  preis.textContent = 'Gesamt: ' + summe.toFixed(2) + ' €';
}

function mengeAnpassen(index, richtung) {
  const artikel = warenkorb[index];
  const einheitMenge = parseInt(artikel.vielfaches || artikel.Vielfaches || 1, 10);
  artikel.menge += richtung * einheitMenge;
  if (artikel.menge < einheitMenge) {
    warenkorb.splice(index, 1);
  }
  updateWarenkorb();
}

document.getElementById('scanInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const nummer = e.target.value.trim();
    const artikel = artikelData.find(a =>
      (a.artikelnummer || a.Artikelnummer) === nummer
    );
    if (!artikel) {
      alert('Artikel nicht gefunden.');
      return;
    }
    const vorhandener = warenkorb.find(w =>
      (w.artikelnummer || w.Artikelnummer) === nummer
    );
    const vielfaches = parseInt(artikel.vielfaches || artikel.Vielfaches || 1, 10);
    if (vorhandener) {
      vorhandener.menge += vielfaches;
    } else {
      warenkorb.push({ ...artikel, menge: vielfaches });
    }
    updateWarenkorb();
    e.target.value = '';
  }
});

function abschliessen() {
  if (!aktuellerKunde) {
    alert('Bitte zuerst einen Kunden auswählen oder erfassen!');
    return;
  }

  const lieferdatum = document.getElementById('lieferdatum').value;
  const kommentar = document.getElementById('kommentar').value;

  const daten = warenkorb.map(item => {
    return {
      kundenname: aktuellerKunde.name || aktuellerKunde.Firma,
      ort: aktuellerKunde.ort || aktuellerKunde.Ort,
      artikelnummer: item.artikelnummer || item.Artikelnummer,
      artikelname: item.name || item.Artikelname,
      menge: item.menge,
      preis: parseFloat(item.preis || item.Preis).toFixed(2),
      gesamtpreis: (item.menge * parseFloat(item.preis || item.Preis)).toFixed(2),
      lieferdatum,
      kommentar,
      zeitstempel: new Date().toISOString()
    };
  });

  bestellungen.push(...daten);
  warenkorb = [];
  updateWarenkorb();
  alert('Bestellung gespeichert!');
}

function speichereBestellung() {
  abschliessen();
  localStorage.setItem("messe_bestellungen", JSON.stringify(bestellungen));
}

function zeigeGespeicherteBestellungen() {
  const gespeicherte = localStorage.getItem("messe_bestellungen");
  let bestellListe = gespeicherte ? JSON.parse(gespeicherte) : bestellungen;
  let ausgabe = "<h4>Gespeicherte Bestellungen:</h4>";
  if (!bestellListe || bestellListe.length === 0) {
    ausgabe += "<p>Keine Bestellungen gespeichert.</p>";
  } else {
    ausgabe += "<ul>";
    bestellListe.forEach(b => {
      ausgabe += `<li>
        <strong>${b.kundenname}</strong> – 
        ${b.artikelname} – 
        ${b.menge} Stück
        ${b.lieferdatum ? " – Lieferdatum: " + b.lieferdatum : ""}
        ${b.kommentar ? "<br><i>" + b.kommentar + "</i>" : ""}
      </li>`;
    });
    ausgabe += "</ul>";
  }
  document.getElementById("gespeicherteListe").innerHTML = ausgabe;
}

function loescheAlleBestellungen() {
  if (confirm("Willst du wirklich ALLE Bestellungen dauerhaft löschen?")) {
    bestellungen = [];
    localStorage.removeItem("messe_bestellungen");
    document.getElementById("gespeicherteListe").innerHTML = "<p>Alle Bestellungen wurden gelöscht.</p>";
  }
}

function exportiereBestellungen() {
  const gespeicherte = localStorage.getItem("messe_bestellungen");
  let exportListe = gespeicherte ? JSON.parse(gespeicherte) : bestellungen;
  if (!exportListe || exportListe.length === 0) {
    alert('Keine gespeicherten Bestellungen zum Exportieren.');
    return;
  }

  const rows = exportListe.map(obj => [
    obj.kundenname,
    obj.ort,
    obj.artikelnummer,
    obj.artikelname,
    obj.menge,
    obj.preis,
    obj.gesamtpreis,
    obj.lieferdatum,
    obj.kommentar
  ]);
  const header = [
    "Kunde",
    "Ort",
    "Artikelnummer",
    "Artikelbezeichnung",
    "Menge",
    "Einzelpreis netto",
    "Gesamtpreis netto",
    "Lieferdatum",
    "Kommentar"
  ];

  const csv = [header, ...rows].map(row =>
    row.map(field => typeof field === "string" ? '"' + field.replace(/"/g, '""') + '"' : field)
    .join(";")
  ).join("\n");

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'weclapp_bestellungen.csv';
  a.click();
  URL.revokeObjectURL(url);
}
