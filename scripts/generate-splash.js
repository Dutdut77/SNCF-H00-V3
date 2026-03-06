import sharp from 'sharp'
import { readFileSync, mkdirSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')

// Couleurs de l'app
const BG_COLOR   = '#f8fafc' // slate-50
const TEXT_COLOR = '#1e293b' // slate-800

// Police Traverse embarquée en base64 pour le rendu SVG sharp
const traverseB64 = readFileSync(resolve(ROOT, 'public/fonts/Traverse-Regular.otf')).toString('base64')

// Toutes les tailles requises par iOS (portrait)
const SIZES = [
  { name: 'iphone-15-pro-max',  w: 1290, h: 2796, iphone: true },
  { name: 'iphone-15-pro',      w: 1179, h: 2556, iphone: true },
  { name: 'iphone-15',          w: 1170, h: 2532, iphone: true },
  { name: 'iphone-15-plus',     w: 1284, h: 2778, iphone: true },
  { name: 'iphone-13-mini',     w: 1080, h: 2340, iphone: true },
  { name: 'iphone-se',          w:  750, h: 1334, iphone: true },
  { name: 'iphone-8-plus',      w: 1242, h: 2208, iphone: true },
  { name: 'ipad-pro-129',       w: 2048, h: 2732, iphone: false },
  { name: 'ipad-pro-11',        w: 1668, h: 2388, iphone: false },
  { name: 'ipad-air',           w: 1640, h: 2360, iphone: false },
  { name: 'ipad-mini',          w: 1488, h: 2266, iphone: false },
]

const logoBuffer = readFileSync(resolve(ROOT, 'public/images/logo_uo.png'))
const outDir     = resolve(ROOT, 'public/splash')
mkdirSync(outDir, { recursive: true })

for (const size of SIZES) {
  // Ratios plus grands sur iPhone, standards sur iPad
  const logoRatio  = size.iphone ? 0.30 : 0.22
  const fontRatio  = size.iphone ? 0.28 : 0.24
  const gapRatio   = size.iphone ? 0.35 : 0.20

  const logoSize = Math.round(Math.min(size.w, size.h) * logoRatio)
  const logoX    = Math.round((size.w - logoSize) / 2)
  const logoY    = Math.round(size.h * 0.38)

  const fontSize    = Math.round(logoSize * fontRatio)
  const subFontSize = Math.round(fontSize * 0.5)
  const textY       = logoY + logoSize + Math.round(logoSize * gapRatio)
  const subTextY    = textY + Math.round(fontSize * 1.35)

  const resizedLogo = await sharp(logoBuffer)
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  const svgText = `<svg width="${size.w}" height="${size.h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      @font-face {
        font-family: 'Traverse';
        src: url('data:font/otf;base64,${traverseB64}') format('opentype');
        font-weight: 400;
      }
    </style>
  </defs>
  <text
    x="${size.w / 2}"
    y="${textY}"
    font-family="Traverse, -apple-system, sans-serif"
    font-size="${fontSize}"
    font-weight="400"
    fill="${TEXT_COLOR}"
    text-anchor="middle"
    dominant-baseline="auto"
  >H00 Travaux</text>
  <text
    x="${size.w / 2}"
    y="${subTextY}"
    font-family="-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"
    font-size="${subFontSize}"
    font-weight="400"
    fill="#94a3b8"
    text-anchor="middle"
    dominant-baseline="auto"
    letter-spacing="1"
  >Chargement ...</text>
</svg>`

  await sharp({
    create: {
      width:    size.w,
      height:   size.h,
      channels: 3,
      background: BG_COLOR
    }
  })
  .composite([
    { input: resizedLogo, top: logoY, left: logoX },
    { input: Buffer.from(svgText), top: 0, left: 0 }
  ])
  .jpeg({ quality: 95 })
  .toFile(resolve(outDir, `${size.name}.jpg`))

  console.log(`✓ ${size.name} (${size.w}×${size.h})`)
}

console.log('\nSplash screens générés dans public/splash/')
