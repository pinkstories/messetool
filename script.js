let warenkorb = [];

function ladeKunden() {
  const select = document.getElementById('kundeSelect');
  kundenData.forEach((k, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `${k.name} (${k.ort})`;
    select.appendChild(opt);
  });
}

function updateWarenkorb() {
  const liste = document.getElementById('warenkorbListe');
  const preis = document.getElementById('gesamtpreis');
  liste.innerHTML = '';
  let summe = 0;
  warenkorb.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name} × ${item.menge} = ${(item.menge * item.preis).toFixed(2)} €`;
    liste.appendChild(li);
    summe += item.menge * item.preis;
  });
  preis.textContent = 'Gesamt: ' + summe.toFixed(2) + ' €';
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
    if (vorhandener) {
      vorhandener.menge++;
    } else {
      warenkorb.push({ ...artikel, menge: 1 });
    }
    updateWarenkorb();
    e.target.value = '';
  }
});

function abschliessen() {
  alert('Bestellung abgeschlossen! Artikelanzahl: ' + warenkorb.length);
  warenkorb = [];
  updateWarenkorb();
}

ladeKunden();
