import nodemailer from 'nodemailer'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { serverSupabaseServiceRole } from '#supabase/server'
import { generateTemplate } from '../../utils/emailTemplates.js'

const SCALAR_FIELDS = ['rlt_voie_principale', 'rlt_ses_principale', 'rlt_cat_principale', 'preop_voie', 'preop_ses', 'logistique']
const ARRAY_FIELDS = ['rlt_voie_secondaire', 'rlt_ses_secondaire', 'rlt_cat_secondaire', 'kv_voie', 'kv_ses', 'kv_cat', 'supervisor']

function extractEmails(contacts) {
  if (!contacts) return []
  const emails = new Set()

  for (const field of SCALAR_FIELDS) {
    const val = contacts[field]
    if (val && typeof val === 'string') emails.add(val.toLowerCase())
  }

  for (const field of ARRAY_FIELDS) {
    const arr = contacts[field]
    if (Array.isArray(arr)) {
      arr.forEach((v) => {
        if (v && typeof v === 'string') emails.add(v.toLowerCase())
      })
    }
  }

  return [...emails].filter(Boolean)
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const body = await readBody(event)
  const { type, chantierId, recipientEmail, recipientName, roleLabel, oldDateRea, oldDatePrepa } = body

  if (!type || !chantierId) {
    throw createError({ statusCode: 400, statusMessage: 'type and chantierId are required' })
  }

  const supabase = serverSupabaseServiceRole(event)

  // 1. Fetch chantier
  const { data: chantier, error: chantierError } = await supabase
    .from('chantiers')
    .select('id, compte, name, date_rea, date_prepa, etat')
    .eq('id', chantierId)
    .single()

  if (chantierError || !chantier) {
    throw createError({ statusCode: 404, statusMessage: 'Chantier not found' })
  }

  // 2. Determine recipients
  let recipients = []

  if (type === 'attribution_rlt') {
    if (!recipientEmail) {
      throw createError({ statusCode: 400, statusMessage: 'recipientEmail is required for attribution_rlt' })
    }
    recipients = [recipientEmail.toLowerCase()]
  } else {
    const { data: contacts } = await supabase
      .from('chantier_contacts_travaux')
      .select('*')
      .eq('chantier_id', chantierId)
      .maybeSingle()

    recipients = extractEmails(contacts)

    // Pour création et modification des dates : ajouter les DU/rdU
    if (type === 'creation' || type === 'modification_dates') {
      const { data: duRduUsers } = await supabase
        .from('users')
        .select('email')
        .eq('ref_du_rdu', true)

      if (duRduUsers) {
        const duRduEmails = duRduUsers.map((u) => u.email?.toLowerCase()).filter(Boolean)
        const emailSet = new Set([...recipients, ...duRduEmails])
        recipients = [...emailSet]
      }
    }
  }

  if (recipients.length === 0) {
    return { success: true, sent: 0 }
  }

  // 3. Read logo as base64 for inline embedding
  let logoAttachment = null
  try {
    const logoPath = resolve(process.cwd(), 'public/images/logo_uo.png')
    const logoBuffer = readFileSync(logoPath)
    logoAttachment = { filename: 'logo_uo.png', content: logoBuffer, cid: 'logo_uo', contentDisposition: 'inline' }
  } catch {
    // Logo non trouvé, l'email sera envoyé sans logo
  }

  // 4. Create transporter
  const baseUrl = config.public?.baseUrl || 'https://h00.vercel.app'

  const transporter = nodemailer.createTransport({
    host: config.smtp?.host,
    port: parseInt(config.smtp?.port || '587'),
    secure: parseInt(config.smtp?.port || '587') === 465,
    auth: {
      user: config.smtp?.user,
      pass: config.smtp?.pass
    }
  })

  // 5. Generate template
  const { subject, html } = generateTemplate(type, chantier, { recipientEmail, recipientName, roleLabel, oldDateRea, oldDatePrepa }, baseUrl)

  // 6. Send to each recipient
  let sent = 0
  for (const to of recipients) {
    try {
      await transporter.sendMail({
        from: `"H00 Travaux" <${config.smtp?.user}>`,
        to,
        subject,
        html,
        attachments: logoAttachment ? [logoAttachment] : []
      })
      sent++
    } catch (err) {
      console.error(`[email] Failed to send to ${to}:`, err.message)
    }
  }

  return { success: true, sent }
})
