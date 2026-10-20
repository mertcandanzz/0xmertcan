# 0xmertcan.me

Mertcan Yılmazer'in kişisel sitesi: `</0XMERTCAN>|` imzasıyla açılan, projeleri ve yazıları kalıcı bir veritabanına bağlı admin panelinden yönetilen site.

**Yığın:** Next.js 16 (App Router) · TypeScript · Payload CMS 3 · PostgreSQL 17 · Tailwind CSS 4 · React Bits · Motion · GSAP · Shiki

---

## Hızlı başlangıç

Gerekenler: Node.js ≥ 20.18, Docker.

```bash
cp .env.example .env          # PAYLOAD_SECRET'i doldurun
docker compose up -d          # yerel PostgreSQL (5432)
npm install
npm run seed                  # örnek içerik (isteğe bağlı)
npm run dev                   # http://localhost:3000
```

Dev modunda Payload şemayı veritabanına kendisi uygular (push). İlk yönetici hesabı için iki yol var:

- `http://localhost:3000/admin` → “ilk kullanıcıyı oluştur” ekranı (yalnızca hiç kullanıcı yokken açılır), **veya**
- `.env` içine `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` yazıp `npm run admin:create`.

Kaynak kodunda gömülü bir parola yoktur.

## Komutlar

| Komut | Ne yapar |
| --- | --- |
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` / `npm start` | Üretim derlemesi / sunucusu |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run seed` | Örnek içerik (`-- --force` önce içeriği siler) |
| `npm run admin:create` | `.env`'deki bilgilerle yönetici oluşturur (kullanıcı yoksa) |
| `npm run migrate:create -- <ad>` | Şema değişikliğinden sonra yeni migration |
| `npm run migrate` | Migration'ları elle uygular |
| `npm run generate:types` | `src/payload-types.ts` |
| `npm run brand` | Logo SVG'lerini `src/brand/glyphs.ts`'ten yeniden üretir |

## Üretime alma

1. `NEXT_PUBLIC_SITE_URL=https://0xmertcan.me` — **derleme sırasında** tanımlı olmalı (canonical, sitemap, RSS, OG ve CSRF izin listesi bunu kullanır).
2. `DATABASE_URL` ve `PAYLOAD_SECRET` üretim değerleriyle.
3. `src/migrations` commit'li; üretimde sunucu açılışta bekleyen migration'ları uygular (`prodMigrations`).
4. **Medya:** varsayılan olarak `./media` diskine yazılır. Sunucusuz/geçici diskli bir ortamda `S3_*` değişkenlerini doldurun; S3 uyumlu depolama (AWS S3, Cloudflare R2, MinIO…) otomatik devreye girer.
5. İlk yöneticiyi oluşturun, ardından `.env`'den `SEED_ADMIN_*` satırlarını kaldırın.

## Yönetim paneli

`/admin` — Payload, Türkçe arayüz, sitenin renkleri ve logosuyla.

- **Blog → Yazılar:** taslak/yayın, yayın tarihi (boşsa ilk yayında atanır), slug (başlıktan Türkçe uyumlu üretilir, çakışma okunur bir hatayla engellenir), kategori, etiket, kapak görseli, Lexical editör (başlıklar, listeler, alıntı, bağlantı, açıklamalı görsel, dil seçmeli kod bloğu), SEO başlığı/açıklaması/görseli, önizleme.
- **İçerik → Projeler:** özet, rol, tür, teknolojiler, GitHub/demo bağlantıları, kapak/galeri, görsel yoksa üretilen önizleme (terminal / şema / tipografik), problem → yaklaşım → teknik kararlar → sonuç → öğrenilenler, durum, yıl, “seçilmiş” ve sıra.
- **Site → Profil / Site ayarları:** ad, tanım, giriş, biyografi, çalışma ilkeleri, deneyim, eğitim, teknoloji grupları, ilgi alanları, e-posta, sosyal bağlantılar, varsayılan SEO, iletişim formu aç/kapa. Boş bırakılan alanlar sitede gösterilmez.
- **Sistem → Mesajlar:** iletişim formundan gelenler.

**Önizleme:** düzenleme ekranındaki önizleme düğmesi `/preview/<koleksiyon>/<slug>` açar. Sayfa oturumu sunucuda doğrular; yönetici oturumu yoksa 404 döner, `noindex` ve `no-store` başlıklarıyla gelir. Payload'ın CSRF kuralı gereği oturum çerezi yalnızca aynı siteden ya da adres çubuğundan açılan isteklerde kabul edilir — başka bir siteden tıklanan önizleme bağlantısı 404 verir.

## GitHub ile giriş ve repo senkronu

**Kurulum (bir kez):**
1. https://github.com/settings/developers → **New OAuth App**. Homepage URL: site adresi; Authorization callback URL: `<site adresi>/auth/github/callback` (yerelde `http://localhost:3000/auth/github/callback`).
2. `.env`: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ADMIN_GITHUB_LOGINS=kullanici-adin`. Gizli repolar da gelsin istiyorsan `GITHUB_INCLUDE_PRIVATE=true` (GitHub'dan `repo` izni ister).
3. Sunucuyu yeniden başlat. `/admin/login` altında **GitHub ile giriş yap** düğmesi belirir.

- Yalnızca `ADMIN_GITHUB_LOGINS` listesindeki hesaplar girebilir. İlk girişte aynı e-postalı yönetici varsa ona bağlanır, yoksa yeni yönetici açılır. E-posta/parola girişi aynen çalışır.
- Oturum imzalı `httpOnly` bir çerezle tutulur (8 saat). Çıkış yapınca çerez sunucu tarafında da geçersiz olur. GitHub erişim token'ı veritabanında şifreli durur ve API'den okunamaz.

**Senkron:** Admin → Projeler → **GitHub’dan senkronize et**.
- Yeni repolar **taslak** proje olur: başlık repo adı, özet repo açıklaması, teknolojiler dil ve konulardan. **README okunmaz.**
- Sonraki senkronlar başlığa, özete, hikâyeye, görsellere, durum ve yayın ayarlarına **dokunmaz**; yalnızca kenar çubuğundaki **GitHub** grubunu (yıldız, dil, konular, son push) günceller. Boş olan kaynak ve canlı demo bağlantılarını doldurur.
- Taslaklar sitede görünmez; düzenleyip yayınladığında görünür.
- GitHub ile giriş yapılmadıysa `GITHUB_USERNAME` ile yalnızca herkese açık repolar çekilir.

## Güvenlik notları

- Tüm yazma işlemleri ve yüklemeler sunucuda erişim kurallarıyla korunur; `users` ve `messages` herkese kapalı.
- Ziyaretçi sorguları kullanıcı bağlamı olmadan çalışır, bu yüzden taslaklar sayfalarda, aramada, RSS'te, sitemap'te, komut paletinde ve REST/GraphQL API'de görünmez.
- Yüklemeler: yalnızca JPG/PNG/WebP/AVIF/GIF, en fazla 8 MB; SVG reddedilir. Zengin metindeki bağlantılar yalnızca `http(s)`, `mailto`, göreli ve `#` olabilir.
- Giriş: 5 hatalı denemede 15 dk kilit, 8 saatlik oturum.
- İletişim formu: zod doğrulaması, honeypot, en az doldurma süresi ve veritabanında tutulan IP özeti ile saatte 3 mesaj sınırı (ham IP saklanmaz).
- `/admin`, `/api`, `/preview` için `X-Robots-Tag: noindex`; robots.txt bu yolları dışlar.

## Marka

`src/brand/glyphs.ts` — 5.6 × 10 birimlik ızgarada çizilmiş, kare uçlu tek çizgi glifler. Aynı geometri hero imzası, navbar logosu, favicon, OG görseli ve admin logosunda kullanılıyor; font yüklenmesine bağlı değil.

`public/brand/`:

| Dosya | Kullanım |
| --- | --- |
| `wordmark-dark.svg` | Koyu zemin |
| `wordmark-light.svg` | Açık zemin |
| `wordmark-mono.svg` | Tek renk (`currentColor`) |
| `wordmark-dark-bg.svg` | Zeminli, paylaşım için |
| `symbol-dark.svg` · `symbol-light.svg` · `symbol-mono.svg` | Kompakt sembol: slash'li sıfır + caret |
| `symbol-tile.svg` | Kare karo, favicon (`src/app/icon.svg` ile aynı, daha kalın çizgi) |

## Hero ve imza

**Hero arka planı** — admin'den seçilir: **Site ayarları → Hero arka planı** (`HeroField.tsx`). Kaydırmayla söner, görünmez olunca durur.

| Seçenek | Bileşen | Görünüm |
| --- | --- | --- |
| Topografya (varsayılan) | React Bits **Topography** | Bordo kontur çizgilerinden 3B arazi, ölçüm işaretleri; imleçle yükselir |
| Işık hüzmeleri | React Bits **LightRays** | Karanlık sahne, üstten yumuşak spot ışığı |
| Şekil dalgaları | React Bits **ShapeWaves** (WebGPU, `vgpu`) | Üçgen/daire/kare alanı, kırmızı imleç dalgaları; alan imzanın etrafında oyulur. WebGPU yoksa statik Canvas 2D yedeği |

**İmza** — hero'daki dev `</0XMERTCAN>|` ile navbar'daki logo **aynı DOM öğesi** (`SiteHeader.tsx`). Hero'daki boş yer tutucu (`[data-sig-anchor]`) başlangıç kutusunu, navbar'daki yuva bitiş kutusunu tanımlar; kaydırma ilerlemesi bu iki kutu arasında konuma ve (log uzayında) ölçeğe eşlenir.

- **ASCII malzeme (masaüstü, ≥ 768 px):** imzanın içi React Bits **LetterGlitch** ile çizilir. Karakterler sürekli değişir; kalın beyaz karakterler, ağırlıklı kırmızı glitch'ler, kırmızı `/`, gri `< >`, hafif ışıma. Altında harfin hafif, düz silüeti var, böylece logo bir bakışta okunur (`AsciiSignature.tsx`). İmza küçülürken ASCII yatışıp katı vektör logoya dönüşür; navbar'da karakterler durur.
- **Mobil (< 768 px):** ASCII yüklenmez; imza katı vektör hâliyle kalır (küçük ekranda ASCII okunmuyor).
- **Alan oyması (Şekil dalgaları seçiliyken):** ShapeWaves, imzanın o anki kutusunun etrafında şekil çizmez (header her karede imzanın konumunu `oxm:mark` olayıyla yayınlar). Böylece logo alanın içinden süzülerek çıkar, geride iz kalmaz; imzanın arkasında ayrıca yumuşak bir derinlik karartması var.
- **Yazılma animasyonu** her 12 saatte bir, yalnızca ana sayfada oynar; kaydırma ya da tuşa basma onu anında tamamlar. İlk boyamadan önce çalışan satır içi script, animasyonun oynayıp oynamayacağına karar verir.
- **`prefers-reduced-motion`:** ölçekleme ve ASCII yok; hero statik imzayı gösterir, alan durağan tek kare çizer, navbar logosu hero görünümden çıkınca yalnızca opaklıkla belirir.

## Sinematik kaydırma (Motion)

Ana sayfadaki sahneler `src/components/cinema/Cinema.tsx`'te. Hepsi doğal kaydırma konumuna bağlı (scroll ele geçirilmez); hareket azaltma açıksa statik çalışır.

| Sahne | Ne yapar |
| --- | --- |
| `HeroExit` | İsim satırı, imzanın uçuşuyla birlikte yükselip söner |
| `IntroScene` | 01 / giriş ekranı sabitler; cümle kaydırdıkça kelime kelime aydınlanır, kırmızı ray dolar, sahne sonunda yükselip bırakır |
| `Dolly` + `ParallaxLayer` | Öne çıkan proje kırpılmış ve hafif uzaktan başlayıp ortada tam boyuta açılır; önizleme içinde paralaksla kayar |
| `RuleDraw` | Bölüm başlıklarındaki çizgi kaydırmayla çizilir |
| `Drift` | Hakkımda bölümünde ilke sütunu farklı hızda süzülür (masaüstü) |
| `TiltIn` | `stack.toml` penceresi perspektifle açılır |

## React Bits

Kaynaklar resmi React Bits registry'sinden (`DavidHDev/react-bits`, TS + Tailwind) alındı. Dosyalar `src/components/reactbits/` altında, telif ve lisans başlıklarıyla duruyor (MIT + Commons Clause, `LICENSE.md`).

| Bileşen | Nerede |
| --- | --- |
| **Topography** | Varsayılan hero arka planı (yerel değişiklik: StrictMode'da bozulan `loseContext()` çağrısı kaldırıldı) |
| **LightRays** | Hero arka planı seçeneği: spot ışığı |
| **ShapeWaves** | Hero arka planı seçeneği (yerel değişiklik: `maskPainter`/`maskKey` ile vektör oyma, maske boyutu 640) |
| **LetterGlitch** | Masaüstü hero imzasının ASCII dolgusu (yerel değişiklikler: `fontWeight` prop'u, StrictMode'da bozulan `loseContext()` çağrısı kaldırıldı) |
| **TextType** | Hero'daki `whoami` komut satırı (yazılma + caret) |
| **DecryptedText** | Bölüm başlıklarının görünür olunca çözülmesi |
| **AnimatedContent** | Bölüm, satır ve kart girişleri |
| **SpotlightCard** | Öne çıkan projede imlece tepki veren yüzey (yerel değişiklik: varsayılan köşe/dolgu kaldırıldı) |
| **Magnet** | Gönder ve proje bağlantı düğmelerinde ölçülü manyetik çekim |

İmza geçişi ve sinematik sahneler elle yazıldı (Motion); mobil menü ve komut paleti geçişlerinde de Motion kullanılıyor.

### React Bits MCP

React Bits, MCP'yi shadcn MCP sunucusu üzerinden sunuyor. Kurulum projede hazır:

- `components.json` içinde `"@react-bits": "https://reactbits.dev/r/{name}.json"` registry'si,
- `.mcp.json` içinde `shadcn` sunucusu (`npx shadcn@latest mcp init --client claude` ile oluşturuldu).

Claude Code'u proje klasöründe yeniden başlatın; ilk açılışta proje MCP sunucusunu onaylayın, `/mcp` ile bağlı olduğunu görün. Sonra "React Bits'ten şu bileşeni ekle" gibi istekler doğrudan registry'den kurulum yapar (ör. `npx shadcn@latest add @react-bits/ShapeWaves-TS-TW`).
