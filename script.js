
let kunden = [...kundenData];
let aktuellerKunde = null;
let warenkorb = [];
let bestellungen = [];

const kundeSuche = document.getElementById('kundeSuche');
const suchErgebnisse = document.getElementById('suchErgebnisse');
const aktuellerKundeAnzeige = document.getElementById('aktuellerKunde');

kundeSuche.addEventListener('input', () => {
  const query = kundeSuche.value.toLowerCase().trim();
  suchErgebnisse.innerHTML = '';
  if (query.length === 0) return;

  const treffer = kunden.filter(k =>
    k.name.toLowerCase().includes(query) || k.ort.toLowerCase().includes(query)
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
    const li = document.createElement('li');
    li.textContent = `${k.name} (${k.ort})`;
    li.onclick = () => {
      aktuellerKunde = k;
      aktuellerKundeAnzeige.textContent = `Aktueller Kunde: ${k.name} (${k.ort})`;
      suchErgebnisse.innerHTML = '';
      kundeSuche.value = '';
    };
    suchErgebnisse.appendChild(li);
  });
});

function neukundeSpeichern() {
  const name = document.getElementById('neukundeName').value.trim();
  const ort = document.getElementById('neukundeOrt').value.trim();
  if (!name || !ort) {
    alert('Bitte Name und Ort eingeben.');
    return;
  }
  const k = { name, ort };
  kunden.push(k);
  aktuellerKunde = k;
  aktuellerKundeAnzeige.textContent = `Neukunde: ${k.name} (${k.ort})`;
  document.getElementById('neukundeFormular').style.display = 'none';
}

function updateWarenkorb() {
  const liste = document.getElementById('warenkorbListe');
  const preis = document.getElementById('gesamtpreis');
  liste.innerHTML = '';
  let summe = 0;
  warenkorb.forEach((item, index) => {
    const einheit = item.einheit || 'Stk';
    const li = document.createElement('li');
    li.innerHTML = `
      <strong>${item.name}</strong> (${einheit})<br>
      <button onclick="mengeAnpassen(${index}, -1)">-</button>
      ${item.menge} × ${item.preis.toFixed(2)} € = ${(item.menge * item.preis).toFixed(2)} €
      <button onclick="mengeAnpassen(${index}, 1)">+</button>
    `;
    liste.appendChild(li);
    summe += item.menge * item.preis;
  });
  preis.textContent = 'Gesamt: ' + summe.toFixed(2) + ' €';
}

function mengeAnpassen(index, richtung) {
  const artikel = warenkorb[index];
  const einheitMenge = artikel.vielfaches || 1;
  artikel.menge += richtung * einheitMenge;
  if (artikel.menge < einheitMenge) artikel.menge = einheitMenge;
  updateWarenkorb();
}

document.getElementById('scanInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const nummer = e.target.value.trim();
    const artikel = artikelData.find(a => a.artikelnummer === nummer);
    if (!artikel) {
      alert('Artikel nicht gefunden.');
      return;
    }
    const vorhandener = warenkorb.find(w => w.artikelnummer === nummer);
    const vielfaches = artikel.vielfaches || 1;
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
    alert('Bitte zuerst einen Kunden auswählen!');
    return;
  }

  const daten = warenkorb.map(item => {
    return {
      kundenname: aktuellerKunde.name,
      ort: aktuellerKunde.ort,
      artikelnummer: item.artikelnummer,
      artikelname: item.name,
      menge: item.menge,
      preis: item.preis.toFixed(2),
      gesamtpreis: (item.menge * item.preis).toFixed(2),
      zeitstempel: new Date().toISOString()
    };
  });

  bestellungen.push(...daten);
  alert('Bestellung lokal gespeichert! (nicht verloren)');
  warenkorb = [];
  updateWarenkorb();
}

function exportiereBestellungen() {
  if (bestellungen.length === 0) {
    alert('Keine gespeicherten Bestellungen zum Exportieren.');
    return;
  }

  const header = Object.keys(bestellungen[0]);
  const rows = bestellungen.map(obj => header.map(h => JSON.stringify(obj[h] || "")));
  const csv = [header, ...rows].map(r => r.join(",")).join("\n");

  const blob = new Blob([csv], {{ type: 'text/csv' }});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'messebestellungen.csv';
  a.click();
  URL.revokeObjectURL(url);
}
