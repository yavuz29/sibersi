# Cyberfoot 2026
React + Vite + Tailwind + Firebase Realtime DB. 4. Ligden Süper Lige, 4 kişiye kadar online.
## Çalıştır
`npm install && npm run dev` — build: `npm run build`
## Firebase kurulumu
1. console.firebase.google.com → proje oluştur → Build → Realtime Database → Create (test modu).
2. Project settings → Web app ekle → config nesnesini **JSON** olarak (anahtarlar tırnaklı, `databaseURL` dahil) kopyala.
3. Oyunda Lobi → "Sunucu Ayarları" → yapıştır → Kaydet. Config girmezsen yerel mod çalışır.
4. Bir oyuncu "Yeni kod" + "Odaya gir"; diğerleri aynı kodla girer; kurucu "Oyunu başlat"a basar.
## Yayın
Vercel: repoyu içe aktar (vercel.json hazır). Netlify: build `npm run build`, publish `dist`.
## Özellikler
Kadro/diziliş yönetimi, transfer pazarı (AI, serbest, satış, arkadaşlara teklif), finans, Türkiye Kupası, sakatlık, altyapı, tur sayacı, .json yama.
Ek: kayıt (localStorage), maç içi taktik/oyuncu değişikliği (yerel modda), baskı/pas/agresiflik, sponsor seçimi, sözleşme/uzatma, kulüp adı+renk.
Ek: kırmızı kart etkisi, oyuncu maaşı/serbest bırakma, online işlemler hafta geçişinde uygulanır, kayıt indir/yükle.
## Oda kodu + TV modu
`src/firebaseConfig.js` dosyasına Firebase config'ini bir kez yapıştır; oyuncular sadece oda kodu girer. Normal mod: herkes kendi ekranında. TV modu: TV'de "Bu cihazı TV yap", telefonlar TV'deki kodla girer, maçlar TV'de oynanır.
Online: biri taktik/değişiklik/penaltı için durdurunca tüm oyuncuların maçı durur, aynı dakikadan devam eder.
## Gerçek oyuncular
`src/data/players.csv` dosyasına `takım;isim;mevki;yaş;güç` satırları ekle (takım adı listedekiyle aynı olmalı). Dosyada oyuncusu olan takımlar bu oyuncularla kurulur, diğerleri otomatik üretilir. Dosya projeyle yayınlandığı için tüm oyuncularda aynıdır.
