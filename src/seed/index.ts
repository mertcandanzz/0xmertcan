/**
 * Seeds editable starter content. Run: `npm run seed` (add `-- --force` to wipe content first).
 *
 * Everything that is not verifiably true is flagged `isExample` and rendered
 * with an "örnek" badge. The one real project is this website itself.
 * An admin account is created only if SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD are set.
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../payload.config'
import { bold, code, codeBlock, doc, h, link, ol, p, quote, ul } from './lexical'

const force = process.argv.includes('--force')

const payload = await getPayload({ config })
const log = (m: string) => payload.logger.info(`seed: ${m}`)

const existing = await payload.count({ collection: 'posts', overrideAccess: true })
if (existing.totalDocs && !force) {
  log('content already present — skipping (use --force to reseed)')
  process.exit(0)
}

if (force) {
  for (const collection of ['posts', 'projects', 'categories', 'tags'] as const) {
    await payload.delete({ collection, where: { id: { exists: true } }, overrideAccess: true })
  }
  log('cleared posts, projects, categories, tags')
}

// ── Admin (optional) ─────────────────────────────────────
const email = process.env.SEED_ADMIN_EMAIL
const password = process.env.SEED_ADMIN_PASSWORD
if (email && password) {
  const users = await payload.count({ collection: 'users', overrideAccess: true })
  if (!users.totalDocs) {
    if (password.length < 12) throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters.')
    await payload.create({ collection: 'users', overrideAccess: true, data: { email, password, name: 'Mertcan Yılmazer' } })
    log(`created admin ${email}`)
  }
}

// ── Globals ──────────────────────────────────────────────
await payload.updateGlobal({
  slug: 'profile',
  overrideAccess: true,
  data: {
    name: 'Mertcan Yılmazer',
    role: 'Yazılım mühendisi',
    intro:
      'Bu alan, yazdığım yazılımın ve onu yazarken düşündüklerimin arşivi. Projeler, notlar ve deneyler — terminalden çıkıp ekrana gelenler.',
    bio: doc(
      p('Burası 0xmertcan: projelerin, yazıların ve deneylerin toplandığı kişisel alan. Tasarım dili terminalden geliyor; içerik ise uzun süre okunabilsin diye sade tutuldu.'),
      p(
        bold('Örnek metin. '),
        'Bu biyografi admin panelinde ',
        code('Site → Profil → Hakkımda'),
        ' altından düzenlenir. Deneyim ve eğitim alanları da oradan eklenir; boş bırakıldıklarında sitede gösterilmezler.',
      ),
    ),
    principles: [
      { title: 'Önce okunabilirlik', body: 'Kod da arayüz de önce bir başkası tarafından okunacakmış gibi yazılır. (Örnek ilke — admin panelinden düzenleyin.)' },
      { title: 'Hareketin bir görevi olur', body: 'Animasyon dikkat çekmek için değil, bir şeyin nereden gelip nereye gittiğini göstermek için kullanılır. (Örnek ilke.)' },
      { title: 'Küçük, geri alınabilir adımlar', body: 'Büyük değişiklikler, her biri tek başına anlamlı olan küçük adımlara bölünür. (Örnek ilke.)' },
    ],
    stack: [
      { group: 'bu-site', items: 'TypeScript, Next.js, React, Payload CMS, PostgreSQL', note: 'Bu sitenin kendi yığını. Kendi listenizle değiştirin.' },
      { group: 'hareket', items: 'React Bits, Motion, GSAP', note: 'İmza geçişi el yazımı; metin ve yüzey efektleri React Bits.' },
      { group: 'araçlar', items: 'Docker, Shiki, Tailwind CSS' },
    ],
    interests: [],
    socials: [],
  },
})

await payload.updateGlobal({
  slug: 'settings',
  overrideAccess: true,
  data: {
    siteTitle: '0xmertcan',
    siteDescription: 'Mertcan Yılmazer — projeler, yazılar ve deneyler.',
    contactFormEnabled: true,
  },
})
log('globals updated')

// ── Taxonomy ─────────────────────────────────────────────
const cat = async (title: string, slug: string, description?: string) =>
  (await payload.create({ collection: 'categories', overrideAccess: true, data: { title, slug, description } })).id
const tag = async (title: string, slug: string) => (await payload.create({ collection: 'tags', overrideAccess: true, data: { title, slug } })).id

const engineering = await cat('Mühendislik', 'muhendislik', 'Sistemler, araçlar ve kararlar.')
const interfaceCat = await cat('Arayüz', 'arayuz', 'Tipografi, hareket ve etkileşim.')
const tNext = await tag('Next.js', 'nextjs')
const tPayload = await tag('Payload', 'payload')
const tMotion = await tag('Animasyon', 'animasyon')
const tA11y = await tag('Erişilebilirlik', 'erisilebilirlik')
const tTs = await tag('TypeScript', 'typescript')

// ── Posts ────────────────────────────────────────────────
const day = (n: number) => new Date(Date.now() - n * 86400000).toISOString()

const posts = [
  {
    title: 'Terminal imzasından navbar’a: tek bir öğenin yolculuğu',
    slug: 'terminal-imzasindan-navbara',
    excerpt: 'Dev boyutlu imzanın kaydırmayla küçülüp navbar’a yerleşmesi, iki logo arasında geçiş değil, tek bir öğenin konum ve ölçek eşlemesi.',
    category: interfaceCat,
    tags: [tMotion, tA11y],
    publishedAt: day(3),
    content: doc(
      p('Açılıştaki büyük imza ile navbar’daki logo aynı DOM öğesi. Kaydırma ilerlemesi iki ölçülmüş kutu arasında konuma ve ölçeğe eşleniyor; bu yüzden hiçbir anda iki logo üst üste binmiyor.'),
      h('h2', 'Ölçüm: iki kutu, bir öğe'),
      p('Hero içindeki boş bir yer tutucu, imzanın başlangıç kutusunu tanımlıyor. Navbar’daki boş yuva da bitiş kutusunu. Öğe ', code('position: fixed'), ' ve ', code('transform-origin: 0 0'), ' ile her karede bu iki kutu arasında yeniden konumlanıyor.'),
      codeBlock(
        'ts',
        `const p = clamp01(scrollY / range)
const e = ease(p)
// Ölçeği log uzayında enterpole etmek küçülmeyi eşit hissettirir.
const scale = Math.exp(lerp(0, Math.log(end.w / start.w), e))
const x = lerp(start.x, end.x, e)
const y = lerp(start.y - scrollY, end.y, e)
el.style.transform = \`translate3d(\${x}px, \${y}px, 0) scale(\${scale})\``,
      ),
      h('h3', 'Neden log uzayı?'),
      p('Doğrusal ölçek enterpolasyonunda öğe başta çok hızlı küçülür, sona doğru neredeyse durur. Log uzayında her eşit kaydırma adımı, boyutu aynı oranda değiştirir.'),
      h('h2', 'Font yüklenmesi ve yeniden ölçüm'),
      p('İmzanın kendisi SVG olduğu için font beklemiyor; ama hero’daki diğer metinler bekliyor. Bu yüzden ', code('document.fonts.ready'), ' ve bir ', code('ResizeObserver'), ' ile kutular yeniden ölçülüyor.'),
      h('h2', 'Hareket azaltma'),
      p('Sistem tercihi hareketi azaltmaksa ölçekleme hiç çalışmıyor. Hero kendi statik imzasını gösteriyor; navbar logosu, hero görünümden çıkınca yalnızca opaklıkla beliriyor.'),
      quote('Hareketin bir görevi olmalı: nereden gelip nereye gittiğini göstermek.'),
      ul(['Tek öğe, iki ölçülmüş kutu'], ['Kaydırmaya bağlı, zamanlayıcıya değil'], ['Hareket azaltmada sade alternatif']),
    ),
  },
  {
    title: 'Payload ile taslak, önizleme ve yayın akışı',
    slug: 'payload-taslak-onizleme-yayin',
    excerpt: 'Taslaklar herkese açık sorgulardan nasıl çıkarılır, önizleme yalnızca oturum açmış yöneticiye nasıl açılır?',
    category: engineering,
    tags: [tPayload, tNext, tTs],
    publishedAt: day(9),
    content: doc(
      p('Bu sitedeki yazılar ve projeler Payload’ın sürüm/taslak sistemiyle yönetiliyor. Erişim kuralı tek satır: oturum yoksa yalnızca yayınlanmış belgeler.'),
      codeBlock(
        'ts',
        `export const publishedOrAuthenticated: Access = ({ req: { user } }) => {
  if (user) return true
  return { _status: { equals: 'published' } }
}`,
      ),
      h('h2', 'Önizleme'),
      p('Admin’deki önizleme düğmesi ', code('/preview/posts/<slug>'), ' adresine gidiyor. Bu sayfa isteği sunucuda doğruluyor; oturum yoksa 404 dönüyor ve ', code('noindex'), ' ile işaretli.'),
      ol(['Yazıyı taslak olarak kaydedin.'], ['Önizlemede kontrol edin.'], ['Yayınlayın — ', bold('yayın tarihi'), ' boşsa otomatik atanır.']),
      h('h2', 'Slug çakışmaları'),
      p('Slug alanı benzersiz; ayrıca kayıt öncesi doğrulama, çakışmayı okunabilir bir hata mesajıyla bildiriyor.'),
      p('Ayrıntılar için ', link('https://payloadcms.com/docs/versions/drafts', 'Payload taslak belgeleri'), '.'),
    ),
  },
  {
    title: 'Monospace’i ne zaman kullanmamalı',
    slug: 'monospace-ne-zaman-kullanmamali',
    excerpt: 'Terminal estetiği cazip; ama uzun metinde monospace okuma hızını düşürür. Bu sitede hangi metnin hangi yazı tipinde olduğu bir kurala bağlı.',
    category: interfaceCat,
    tags: [tA11y],
    publishedAt: day(16),
    content: doc(
      p('Kural basit: ', bold('okunacak metin sans-serif, taranacak metin monospace.'), ' Tarihler, dosya yolları, bölüm numaraları ve kod monospace; paragraflar ve başlıklar değil.'),
      h('h2', 'Taranan ve okunan'),
      p('Bir tarih satırını okumayız, tararız. Hizalı rakamlar ve eşit genişlikli karakterler bunu kolaylaştırır. Bir paragrafı ise okuruz; orada orantılı harf genişlikleri kelime biçimlerini daha hızlı tanımamızı sağlar.'),
      codeBlock('css', `.meta {\n  font-family: var(--font-mono);\n  font-size: 0.72rem;\n  letter-spacing: 0.04em;\n}`),
    ),
  },
]

for (const post of posts) {
  await payload.create({ collection: 'posts', overrideAccess: true, data: { ...post, isExample: true, _status: 'published' } as never })
}
await payload.create({
  collection: 'posts',
  overrideAccess: true,
  draft: true,
  data: {
    title: 'Taslak: yayınlanmamış bir yazı',
    slug: 'taslak-yazi',
    excerpt: 'Bu yazı taslak durumunda; ziyaretçiler göremez, aramada çıkmaz.',
    category: engineering,
    isExample: true,
    _status: 'draft',
    content: doc(p('Taslak içerik.')),
  } as never,
})
log(`created ${posts.length} posts + 1 draft`)

// ── Projects ─────────────────────────────────────────────
const projects = [
  {
    title: '0xmertcan.me',
    slug: '0xmertcan-me',
    summary: 'Bu site: terminal imzasıyla açılan, projeleri ve yazıları gerçek bir admin panelinden yönetilen kişisel alan.',
    kind: 'Kişisel site',
    role: 'Tasarım ve geliştirme',
    status: 'active',
    year: 2026,
    featured: true,
    order: 1,
    isExample: false,
    previewStyle: 'terminal',
    previewCommand: 'next build && payload migrate',
    stack: ['Next.js', 'Payload CMS', 'PostgreSQL', 'React Bits', 'Motion'].map((name) => ({ name })),
    problem: doc(p('Hem uzun yazı okumaya uygun hem de karakteri olan, içeriği koda dokunmadan yönetilebilen bir kişisel site.')),
    approach: doc(p('Tipografi ve ince çizgilerle kurulan editoryal bir düzen; hareket dili React Bits bileşenleri ve tek bir el yazımı kaydırma geçişiyle sınırlı.')),
    decisions: doc(
      ul(
        ['Logo, font yerine özel çizilmiş SVG glif sistemi: hero ve navbar’da piksel düzeyinde aynı.'],
        ['Payload CMS: kimlik doğrulama, medya ve taslaklar hazır; ayrıca yazılmadı.'],
        ['Sayfalar istek anında render ediliyor; yayınlanan içerik hemen görünür.'],
      ),
    ),
    outcome: doc(p('Şu an okuduğunuz site.')),
    learnings: doc(p('Bu bölüm site sahibi tarafından doldurulmak üzere bırakıldı.')),
  },
  {
    title: 'Örnek: Komut satırı aracı',
    slug: 'ornek-komut-satiri-araci',
    summary: 'Örnek proje kaydı. Admin panelinden gerçek bir projeyle değiştirin; şema önizlemesi teknoloji listesinden üretilir.',
    kind: 'CLI aracı',
    status: 'experiment',
    year: 2026,
    featured: true,
    order: 2,
    isExample: true,
    previewStyle: 'diagram',
    stack: ['Go', 'SQLite', 'Cobra', 'GitHub Actions'].map((name) => ({ name })),
    problem: doc(p('Örnek metin: problem tanımı.')),
    approach: doc(p('Örnek metin: yaklaşım.')),
  },
  {
    title: 'Örnek: Veri paneli',
    slug: 'ornek-veri-paneli',
    summary: 'Örnek proje kaydı. Kapak görseli yüklenmediğinde tipografik önizleme kullanılır.',
    kind: 'Web uygulaması',
    status: 'shipped',
    year: 2025,
    featured: true,
    order: 3,
    isExample: true,
    previewStyle: 'type',
    stack: ['TypeScript', 'React', 'PostgreSQL'].map((name) => ({ name })),
    problem: doc(p('Örnek metin.')),
  },
  {
    title: 'Örnek: Arşivlenmiş deney',
    slug: 'ornek-arsiv-deney',
    summary: 'Filtreleri göstermek için arşiv durumundaki örnek kayıt.',
    kind: 'Deney',
    status: 'archived',
    year: 2024,
    featured: false,
    order: 10,
    isExample: true,
    previewStyle: 'terminal',
    previewCommand: 'make experiment',
    stack: ['Python', 'NumPy'].map((name) => ({ name })),
  },
]
for (const project of projects) {
  await payload.create({ collection: 'projects', overrideAccess: true, data: { ...project, _status: 'published' } as never })
}
log(`created ${projects.length} projects`)

process.exit(0)
