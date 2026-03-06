const COLORS = {
  creation:          { accent: '#3b82f6', label: 'Nouveau chantier',       pill: '#dbeafe', pillText: '#1d4ed8' },
  passation:         { accent: '#f97316', label: 'Passation RLT',          pill: '#ffedd5', pillText: '#c2410c' },
  attribution_rlt:   { accent: '#8b5cf6', label: 'Attribution',            pill: '#ede9fe', pillText: '#6d28d9' },
  modification_dates:{ accent: '#f59e0b', label: 'Modification des dates', pill: '#fef3c7', pillText: '#b45309' }
}

const formatDate = (dateStr) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

const formatPeriods = (periods, startKey, endKey) => {
  if (!periods || periods.length === 0) return '—'
  return periods
    .map((p) => {
      const start = p[startKey] ? formatDate(p[startKey]) : null
      const end   = p[endKey]   ? formatDate(p[endKey])   : null
      if (start && end && start !== end) return `${start} &rarr; ${end}`
      return start || '—'
    })
    .join('<br>')
}

const metaRow = (label, value, accentColor) => `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;" class="meta-row">
      <span style="display:block;font-size:11px;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;color:#94a3b8;margin-bottom:3px;" class="meta-label">${label}</span>
      <span style="display:block;font-size:14px;color:#1e293b;line-height:1.5;" class="meta-value">${value}</span>
    </td>
  </tr>`

const baseHtml = (color, title, chantierId, chantierName, contentHtml, metaHtml, baseUrl) => `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${title}</title>
  <style>
    @media (max-width: 480px) {
      .header-left  { display: block !important; width: 100% !important; }
      .header-right { display: block !important; width: 100% !important; text-align: left !important; padding-top: 10px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .email-bg   { background-color: #000000 !important; }
      .email-wrap { background-color: #111111 !important; border-color: #222222 !important; }
      .email-head { border-bottom-color: #222222 !important; }
      .head-app   { color: #888888 !important; }
      .badge-bg   { background-color: #1a1a1a !important; border-color: #333333 !important; }
      .badge-text { color: #aaaaaa !important; }
      .h1         { color: #ffffff !important; }
      .body-text  { color: #aaaaaa !important; }
      .body-text strong { color: #dddddd !important; }
      .meta-row   { border-bottom-color: #222222 !important; }
      .meta-label { color: #555555 !important; }
      .meta-value { color: #dddddd !important; }
      .divider    { border-color: #222222 !important; }
      .email-foot { border-top-color: #222222 !important; }
      .foot-text  { color: #555555 !important; }
      .foot-link  { color: #555555 !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;" class="email-bg">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9;padding:40px 16px;" class="email-bg">
    <tr>
      <td align="center">

        <!-- Wrapper -->
        <table width="560" cellpadding="0" cellspacing="0" role="presentation"
          style="max-width:560px;width:100%;background-color:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;"
          class="email-wrap">

          <!-- Accent bar -->
          <tr>
            <td style="height:4px;background-color:${color.accent};font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding:24px 36px 20px;border-bottom:1px solid #f1f5f9;" class="email-head">
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td style="vertical-align:middle;" class="header-left">
                    <img src="cid:logo_uo" alt="H00" height="44" style="height:44px;display:inline-block;vertical-align:middle;">
                    <span style="font-size:16px;font-weight:700;color:#64748b;margin-left:12px;vertical-align:middle;letter-spacing:0.01em;" class="head-app">H00 Travaux</span>
                  </td>
                  <td style="text-align:right;vertical-align:middle;white-space:nowrap;" class="header-right">
                    <span style="display:inline-block;background-color:${color.pill};color:${color.pillText};font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;padding:4px 10px;border-radius:20px;">
                      ${color.label}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 36px 0;">

              <!-- Compte badge -->
              <p style="margin:0 0 6px;">
                <span style="display:inline-block;font-family:'SF Mono',SFMono-Regular,Consolas,'Liberation Mono',Menlo,monospace;font-size:12px;font-weight:700;color:#64748b;background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:3px 10px;letter-spacing:0.04em;" class="badge-bg badge-text">${chantierId}</span>
              </p>

              <!-- Titre -->
              <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#0f172a;line-height:1.3;letter-spacing:-0.02em;" class="h1">${chantierName}</h1>

              <!-- Contenu -->
              <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;" class="body-text">
                ${contentHtml}
              </p>

              ${metaHtml ? `
              <!-- Métadonnées -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-top:1px solid #f1f5f9;margin-bottom:28px;" class="divider">
                ${metaHtml}
              </table>` : ''}

            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:4px 36px 36px;">
              <a href="${baseUrl}" style="display:inline-block;background-color:${color.accent};color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 24px;border-radius:8px;letter-spacing:0.01em;">
                Ouvrir H00 &rarr;
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 36px;border-top:1px solid #f1f5f9;" class="email-foot">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;" class="foot-text">
                Cet email est envoyé automatiquement par H00 &mdash; ne pas répondre.
                <a href="${baseUrl}" style="color:#94a3b8;text-decoration:underline;" class="foot-link">${baseUrl}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

export const generateTemplate = (type, chantier, data, baseUrl) => {
  const color       = COLORS[type] || COLORS.creation
  const chantierId  = chantier?.compte || ''
  const chantierName = chantier?.name || 'Chantier inconnu'

  let subject, contentHtml, metaHtml = ''

  const buildMeta = () => {
    const rows = []
    if (chantier?.date_rea?.length)   rows.push(metaRow('Dates de réalisation',  formatPeriods(chantier.date_rea,   'date_start_travaux', 'date_end_travaux'),  color.accent))
    if (chantier?.date_prepa?.length) rows.push(metaRow('Dates de préparation',  formatPeriods(chantier.date_prepa, 'date_start_prepa',   'date_end_prepa'),    color.accent))
    return rows.join('')
  }

  switch (type) {
    case 'creation': {
      subject     = `Nouveau chantier : ${chantierId} — ${chantierName}`
      contentHtml = `Un nouveau chantier a été créé et vous êtes désigné(e) comme intervenant(e).`
      metaHtml    = buildMeta()
      break
    }

    case 'passation': {
      subject     = `Passation RLT : ${chantierId} — ${chantierName}`
      contentHtml = `Le chantier <strong>${chantierId}</strong> vient d'être passé en phase <strong>RLT</strong>. La phase pré-opérationnelle est terminée — merci de prendre connaissance des informations dans H00.`
      metaHtml    = buildMeta()
      break
    }

    case 'attribution_rlt': {
      const recipientName = data?.recipientName || ''
      const roleLabel     = data?.roleLabel     || ''
      subject     = `Attribution chantier : ${chantierId} — ${chantierName}`
      contentHtml = `${recipientName ? `Bonjour <strong>${recipientName}</strong>,<br><br>` : ''}Vous avez été assigné(e) au chantier <strong>${chantierId}</strong>${roleLabel ? ` en tant que <strong>${roleLabel}</strong>` : ''}.`
      metaHtml    = buildMeta()
      break
    }

    case 'modification_dates': {
      subject     = `Modification des dates : ${chantierId} — ${chantierName}`
      contentHtml = `Les dates du chantier <strong>${chantierId}</strong> ont été modifiées. Voici le nouveau planning :`
      metaHtml    = buildMeta()
      break
    }

    default: {
      subject     = `Notification chantier : ${chantierId}`
      contentHtml = `Notification concernant le chantier <strong>${chantierId}</strong>.`
    }
  }

  const html = baseHtml(color, subject, chantierId, chantierName, contentHtml, metaHtml, baseUrl)
  return { subject, html }
}
