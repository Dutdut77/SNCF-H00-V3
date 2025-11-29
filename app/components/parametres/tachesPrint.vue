<script setup>
const props = defineProps({
  taches: {
    type: Array,
    required: true
  },
  profils: {
    type: Array,
    default: () => []
  }
});

// Formater le délai pour l'affichage
const formatDelais = (delais) => {
  if (delais === null || delais === undefined) return '—';
  const absDelais = Math.abs(delais);
  const prefix = delais < 0 ? 'J+' : 'J-';
  return `${prefix}${absDelais}`;
};

// Fonction d'impression
const printTaches = () => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Veuillez autoriser les popups pour imprimer');
    return;
  }

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Trier les tâches par délai décroissant
  const sortedTaches = [...props.taches].sort((a, b) => b.delais - a.delais);
  
  // Statistiques
  const totalTaches = sortedTaches.length;
  const rp1Count = sortedTaches.filter(t => t.rp1 === 1).length;
  const categoriesCount = new Set(sortedTaches.map(t => t.categorie)).size;

  // Générer les headers des profils
  const profilHeadersHtml = props.profils.map(p => 
    `<th class="col-profil">${p.label}</th>`
  ).join('');

  // Générer les lignes du tableau
  const rowsHtml = sortedTaches.map((t, index) => {
    // Générer les cellules des profils
    const profilCellsHtml = props.profils.map(p => {
      const isSelected = t.tache_profil?.includes(p.id);
      return `<td class="profil-cell">${isSelected ? '<span class="check">✓</span>' : '<span class="uncheck">—</span>'}</td>`;
    }).join('');

    return `
    <tr class="${index % 2 === 0 ? 'even' : 'odd'}">
      <td class="delay-cell">
        <span class="delay-badge ${t.delais < 0 ? 'delay-after' : 'delay-before'}">${formatDelais(t.delais)}</span>
      </td>
      <td class="task-name">${t.tache || '—'}</td>
      <td class="category-cell">
        <span class="category-badge">${t.categorie || 'Sans catégorie'}</span>
      </td>
      <td class="reference-cell">
        ${t.opt_delais === 1 
          ? '<span class="ref-badge ref-end"><span class="ref-icon">◀</span><span class="ref-text">Fin</span></span>' 
          : '<span class="ref-badge ref-start"><span class="ref-icon">▶</span><span class="ref-text">Début</span></span>'}
      </td>
      <td class="rp1-cell">
        ${t.rp1 === 1 ? '<span class="rp1-badge">RP1</span>' : '<span class="rp1-empty">—</span>'}
      </td>
      ${profilCellsHtml}
    </tr>
  `}).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Liste des Tâches - H00</title>
      <style>
        @font-face {
          font-family: 'Pacifico';
          src: url('/fonts/Pacifico.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        
        @page {
          size: landscape;
          margin: 10mm;
        }
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          font-size: 10pt;
          line-height: 1.3;
          color: #1a1a1a;
          background: white;
          padding: 10mm;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 3px solid #2563eb;
        }
        
        .header-left h1 {
          font-family: 'Pacifico', cursive;
          font-size: 24pt;
          font-weight: 400;
          color: #1e3a5f;
          margin-bottom: 2px;
        }
        
        .header-left h1 .drop-cap {
          font-size: 38pt;
          line-height: 0.8;
          float: left;
          margin-right: 2px;
          color: #2563eb;
        }
        
        .header-left .subtitle {
          font-size: 10pt;
          color: #64748b;
        }
        
        .header-right {
          text-align: right;
          display: flex;
          align-items: center;
        }
        
        .header-right .logo {
          font-size: 12pt;
          font-weight: 700;
          color: #374151;
          letter-spacing: -0.5px;
        }
        
        .summary {
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          border-radius: 6px;
          padding: 10px 15px;
          margin-bottom: 15px;
          display: flex;
          gap: 20px;
        }
        
        .summary-item {
          display: flex;
          flex-direction: column;
        }
        
        .summary-item .label {
          font-size: 7pt;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-item .value {
          font-size: 14pt;
          font-weight: 700;
          color: #1e3a5f;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 8pt;
        }
        
        thead {
          background: #1e3a5f;
        }
        
        th {
          padding: 8px 5px;
          text-align: left;
          font-weight: 600;
          color: white;
          text-transform: uppercase;
          font-size: 6pt;
          letter-spacing: 0.4px;
        }
        
        td {
          padding: 6px 5px;
          border-bottom: 1px solid #f1f5f9;
          vertical-align: middle;
        }
        
        tr.odd {
          background: #fafbfc;
        }
        
        tr.even {
          background: white;
        }
        
        .col-delay { width: 6%; text-align: center; }
        .col-task { }
        .col-category { width: 12%; }
        .col-ref { width: 8%; }
        .col-rp1 { width: 5%; text-align: center; }
        .col-profil { width: 6%; text-align: center; }
        
        .task-name {
          font-weight: 500;
          color: #1e293b;
          font-size: 8pt;
        }
        
        .delay-cell {
          text-align: center;
        }
        
        .delay-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-weight: 700;
          font-size: 7pt;
          font-family: 'Consolas', 'Monaco', monospace;
          white-space: nowrap;
        }
        
        .delay-before {
          background: #dbeafe;
          color: #1d4ed8;
        }
        
        .delay-after {
          background: #dcfce7;
          color: #15803d;
        }
        
        .category-cell {
        }
        
        .category-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 7pt;
          font-weight: 500;
          background: #f1f5f9;
          color: #475569;
          border: 1px solid #e2e8f0;
          text-align: center;
          white-space: nowrap;
        }
        
        .reference-cell {
        }
        
        .ref-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 7pt;
          font-weight: 600;
          white-space: nowrap;
        }
        
        .ref-icon {
          font-size: 5pt;
        }
        
        .ref-text {
          text-transform: uppercase;
          letter-spacing: 0.2px;
        }
        
        .ref-start {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #7dd3fc;
        }
        
        .ref-end {
          background: #fce7f3;
          color: #be185d;
          border: 1px solid #f9a8d4;
        }
        
        .rp1-cell {
          text-align: center;
        }
        
        .rp1-badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 6pt;
          font-weight: 700;
          background: #fef3c7;
          color: #b45309;
          border: 1px solid #fcd34d;
          text-transform: uppercase;
          letter-spacing: 0.4px;
        }
        
        .rp1-empty {
          color: #cbd5e1;
          font-size: 9pt;
        }
        
        .profil-cell {
          text-align: center;
        }
        
        .check {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #dcfce7;
          color: #15803d;
          font-size: 9pt;
          font-weight: 700;
        }
        
        .uncheck {
          color: #e2e8f0;
          font-size: 9pt;
        }
        
        .footer {
          margin-top: 15px;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
          font-size: 7pt;
          color: #94a3b8;
        }
        
        @media print {
          body {
            padding: 5mm;
          }
          
          tr {
            page-break-inside: avoid;
          }
          
          thead {
            display: table-header-group;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1><span class="drop-cap">L</span>iste des Tâches</h1>
          <div class="subtitle">Référentiel des tâches et délais</div>
        </div>
        <div class="header-right">
          <div class="logo">H00 Travaux</div>
        </div>
      </div>
      
      <div class="summary">
        <div class="summary-item">
          <span class="label">Total tâches</span>
          <span class="value">${totalTaches}</span>
        </div>
        <div class="summary-item">
          <span class="label">Catégories</span>
          <span class="value">${categoriesCount}</span>
        </div>
        <div class="summary-item">
          <span class="label">Tâches RP1</span>
          <span class="value">${rp1Count}</span>
        </div>
        <div class="summary-item">
          <span class="label">Profils</span>
          <span class="value">${props.profils.length}</span>
        </div>
      </div>
      
      <table>
        <thead>
          <tr>
            <th class="col-delay">Délai</th>
            <th class="col-task">Tâche</th>
            <th class="col-category">Catégorie</th>
            <th class="col-ref">Réf.</th>
            <th class="col-rp1">RP1</th>
            ${profilHeadersHtml}
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      
      <div class="footer">
        Document généré le ${currentDate} — H00 Gestion de chantiers
      </div>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  
  // Attendre que le contenu soit chargé avant d'imprimer
  printWindow.onload = () => {
    printWindow.print();
  };
};

// Exposer la fonction pour être appelée depuis le parent
defineExpose({ printTaches });
</script>

<template>
  <!-- Composant invisible - sert uniquement à générer l'impression -->
</template>
