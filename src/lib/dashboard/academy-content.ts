/**
 * Finovela Academy ders içeriği — oyunlaştırılmış yatırım eğitimi.
 * 6 track, her track'te öz ve öğretici dersler + ders sonu mini quiz.
 * İçerik GENEL EĞİTİM amaçlıdır, yatırım tavsiyesi değildir.
 *
 * Markdown body: ## başlık, **kalın**, - madde listesi. AI'ye sor + uygula
 * (What-If / Sohbet) köprüleriyle "öğren → dene" döngüsünü kapatır.
 */

export type QuizOption = { text: string; correct: boolean };
export type Quiz = { question: string; options: QuizOption[]; explain: string };
export type Lesson = {
  slug: string;
  title: string;
  minutes: number;
  xp: number;
  body: string;
  quiz: Quiz;
  applyHint?: string;
};
export type Track = {
  slug: string;
  name: string;
  level: "Başlangıç" | "Orta" | "İleri";
  blurb: string;
  iconKey: "intro" | "ai" | "markets" | "options" | "crypto" | "tax";
  lessons: Lesson[];
};

export const ACADEMY_TRACKS: Track[] = [
  {
    slug: "giris",
    name: "Yatırıma Giriş",
    level: "Başlangıç",
    blurb: "Sanal portföyle risksiz başla, temelleri otur.",
    iconKey: "intro",
    lessons: [
      {
        slug: "paper-portfoy",
        title: "Sanal portföy nedir, neden risksiz?",
        minutes: 4,
        xp: 60,
        body: `Finovela sana **sanal (paper) $100.000** ile başlatır. Bu gerçek para değildir; gerçek piyasa fiyatlarıyla işlem yapar gibi pratik yaparsın ama **hiçbir kayıp riski yoktur**.

## Neden önemli?
Yeni başlayanların en büyük hatası, daha temelleri öğrenmeden gerçek parayla işlem açmaktır. Sanal portföy sana şunu verir:

- Gerçek fiyatlarla, gerçek arayüzde **deneyim**
- Hata yapma **özgürlüğü** (gerçek kayıp yok)
- Stratejini **kanıtlama** alanı — işe yarıyor mu, görürsün

## Finovela'da nasıl?
Genel Bakış'taki portföy değerin başta $100.000 nakittir. İlk işlemini yaptığında bu nakit varlığa dönüşür. Her hamleni Finovela analiz eder ve sana geri bildirim verir.`,
        quiz: {
          question: "Sanal (paper) portföyün en büyük avantajı nedir?",
          options: [
            { text: "Gerçek para kazandırır", correct: false },
            { text: "Gerçek fiyatlarla risksiz pratik sağlar", correct: true },
            { text: "Vergi avantajı sunar", correct: false },
          ],
          explain: "Paper portföy gerçek piyasa fiyatlarını kullanır ama para gerçek değildir — kayıp riski olmadan deneyim kazandırır.",
        },
        applyHint: "Genel Bakış'a git, portföyünün $100.000 nakitle başladığını gör.",
      },
      {
        slug: "ilk-islem",
        title: "İlk işlemini yapmak",
        minutes: 4,
        xp: 70,
        body: `İlk işlem korkutucu görünebilir ama mantığı basittir: bir varlık **al**, fiyatı değişir, istersen **sat**.

## Adımlar
- Bir hisse veya kripto **ara** (örn. AAPL, BTC)
- Ne kadarlık almak istediğine karar ver
- Al — artık o varlığa **pozisyonun** var
- Fiyat yükselirse kârdasın, düşerse zararda

## Akıllı başlangıç
Tüm paranı tek bir varlığa yatırma. Küçük başla, nasıl hareket ettiğini izle. Finovela'ya **"ne alayım?"** diye sorabilir, gerekçesiyle öneri alabilirsin — ama kararı her zaman sen verirsin.`,
        quiz: {
          question: "İlk işlemde en sağlıklı yaklaşım hangisidir?",
          options: [
            { text: "Tüm parayı tek varlığa koymak", correct: false },
            { text: "Küçük başlayıp izlemek", correct: true },
            { text: "Hiç al-sat yapmadan beklemek", correct: false },
          ],
          explain: "Küçük başlamak, varlığın nasıl hareket ettiğini riski sınırlı tutarak öğrenmeni sağlar.",
        },
        applyHint: "Finovela Sohbet'e 'ne alayım?' diye sor, önerinin gerekçesini oku.",
      },
      {
        slug: "risk-getiri",
        title: "Risk ve getiri dengesi",
        minutes: 5,
        xp: 80,
        body: `Yatırımın değişmez kuralı: **yüksek getiri, yüksek risk** demektir. Bedava yüksek getiri yoktur.

## Temel ilişki
- Düşük risk (tahvil, mevduat) → düşük ama istikrarlı getiri
- Yüksek risk (tek hisse, kripto) → yüksek ama oynak getiri

## Senin için doğru denge
Doğru denge **risk profiline** bağlıdır: ne kadar dalgalanmaya tahammülün var? Finovela onboarding'de bunu sorar (temkinli / dengeli / agresif) ve önerilerini buna göre ayarlar.

Unutma: amacın "en yüksek getiri" değil, **uyuyabildiğin** bir portföydür.`,
        quiz: {
          question: "Yüksek getiri potansiyeli genellikle neyle birlikte gelir?",
          options: [
            { text: "Daha düşük risk", correct: false },
            { text: "Daha yüksek risk", correct: true },
            { text: "Garantili kâr", correct: false },
          ],
          explain: "Getiri ve risk birlikte hareket eder — yüksek getiri arıyorsan daha fazla dalgalanmayı kabul etmen gerekir.",
        },
        applyHint: "What-If Stüdyosu'nda farklı risk profillerini karşılaştır.",
      },
    ],
  },
  {
    slug: "ai-ile-yatirim",
    name: "AI ile Yatırım",
    level: "Başlangıç",
    blurb: "Finovela'ya nasıl talimat verilir, AI'ye nasıl güvenilir (ve doğrulanır).",
    iconKey: "ai",
    lessons: [
      {
        slug: "finovelaya-talimat",
        title: "Finovela'ya nasıl talimat verilir",
        minutes: 4,
        xp: 70,
        body: `Finovela'yı düz konuşma diliyle kullanırsın. Karmaşık komut ezberlemene gerek yok.

## İyi talimat örnekleri
- "Portföyüm nasıl gidiyor, en büyük riskim ne?"
- "Nvidia'dan 500 dolarlık al ve stop koy"
- "NVDA, AMD ve AVGO'yu karşılaştır"

## İpucu: bağlam ver
AI ne kadar bağlam verirsen o kadar isabetli olur. "Bir şey al" yerine "uzun vadeli, düşük riskli bir teknoloji hissesi öner" demek çok daha iyi sonuç verir.

Finovela canlı veriye ve senin portföyüne bakarak yanıtlar — genel bir sohbet botu gibi değil, **senin durumuna özel**.`,
        quiz: {
          question: "Finovela'dan daha isabetli yanıt almanın yolu nedir?",
          options: [
            { text: "Mümkün olduğunca kısa yazmak", correct: false },
            { text: "Bağlam ve hedef vermek", correct: true },
            { text: "Sadece tek kelime yazmak", correct: false },
          ],
          explain: "Hedefini ve kısıtlarını (vade, risk, sektör) belirtmek AI'nin sana özel ve isabetli yanıt vermesini sağlar.",
        },
        applyHint: "Sohbet'te 'düşük riskli temettü hissesi öner' gibi bağlamlı bir soru dene.",
      },
      {
        slug: "guven-dogrula",
        title: "AI'ye güven — ama doğrula",
        minutes: 5,
        xp: 90,
        body: `Finovela güçlü bir yardımcıdır ama **körü körüne** takip edilmemeli. En iyi yatırımcı, AI'yi bir danışman gibi kullanıp kendi kararını veren kişidir.

## Glass-Box yaklaşımı
Finovela yanıtlarının altında **"Kaynak:"** rozetleri gösterir — hangi veriyi (fiyat, haber, temel veri) kullandığını görürsün. Bu şeffaflık sana **doğrulama** imkânı verir.

## Sağlıklı alışkanlıklar
- Önerinin **gerekçesini** oku, sadece sonucu değil
- Önemli kararları **paper'da** önce dene
- Kendi araştırmanla **çapraz kontrol** et

AI hata yapabilir; senin paran (gerçekte) senin sorumluluğunda.`,
        quiz: {
          question: "AI önerisini değerlendirirken en sağlıklı davranış nedir?",
          options: [
            { text: "Her öneriyi sorgusuz uygulamak", correct: false },
            { text: "Gerekçesini okuyup doğrulamak", correct: true },
            { text: "AI'yi hiç kullanmamak", correct: false },
          ],
          explain: "AI'yi danışman gibi kullan: gerekçeyi oku, kaynakları kontrol et, önemli kararları paper'da test et.",
        },
        applyHint: "Sohbet'te bir öneri al, altındaki 'Kaynak:' rozetlerine bak.",
      },
    ],
  },
  {
    slug: "piyasayi-okumak",
    name: "Piyasayı Okumak",
    level: "Orta",
    blurb: "Grafikler, temel veriler ve fiyatı gerçekte ne hareket ettirir.",
    iconKey: "markets",
    lessons: [
      {
        slug: "mum-grafik",
        title: "Mum grafiği nasıl okunur",
        minutes: 5,
        xp: 80,
        body: `Mum (candlestick) grafiği, bir varlığın belirli bir zaman aralığındaki fiyat hareketini özetler.

## Bir mum neyi gösterir?
Her mum 4 bilgiyi taşır:
- **Açılış** ve **kapanış** fiyatı (gövde)
- **En yüksek** ve **en düşük** (fitiller)

Yeşil/içi boş mum = kapanış açılıştan yüksek (yükseliş). Kırmızı/dolu mum = düşüş.

## Ne işine yarar?
Tek bir mum az şey söyler; **örüntüler** anlamlıdır. Uzun fitiller kararsızlığı, art arda yeşil mumlar momentumu gösterebilir. Ama grafik tek başına geleceği garantilemez — temel verilerle birlikte değerlendir.`,
        quiz: {
          question: "Bir mum gövdesi neyi gösterir?",
          options: [
            { text: "En yüksek ve en düşük fiyatı", correct: false },
            { text: "Açılış ve kapanış fiyatını", correct: true },
            { text: "Sadece işlem hacmini", correct: false },
          ],
          explain: "Gövde açılış-kapanış aralığıdır; fitiller ise o periyottaki en yüksek ve en düşük fiyatı gösterir.",
        },
        applyHint: "Piyasalar'da bir hisse aç, mum grafiğini incele.",
      },
      {
        slug: "temel-veri",
        title: "Temel veriler: F/K, büyüme, kâr",
        minutes: 6,
        xp: 90,
        body: `Grafik fiyatın **nasıl** hareket ettiğini gösterir; temel veriler **neden** değerli olduğunu anlatır.

## Bakılan başlıca veriler
- **F/K (Fiyat/Kazanç):** Hisse, kazancının kaç katına satılıyor? Düşük her zaman ucuz demek değildir.
- **Gelir/kâr büyümesi:** Şirket büyüyor mu, küçülüyor mu?
- **Borç durumu:** Aşırı borç riski artırır.

## Bağlam şart
Bir teknoloji şirketinin yüksek F/K'si büyüme beklentisini yansıtabilir; aynı oran olgun bir şirkette pahalılık işareti olabilir. **Sektörle kıyasla** değerlendir. Finovela'ya "bu hissenin temel verileri nasıl?" diye sorabilirsin.`,
        quiz: {
          question: "Düşük F/K oranı her zaman ne anlama gelir?",
          options: [
            { text: "Hisse kesin ucuzdur", correct: false },
            { text: "Tek başına yeterli değildir, bağlam gerekir", correct: true },
            { text: "Şirket zarar ediyordur", correct: false },
          ],
          explain: "F/K'yi sektör ve büyüme beklentisiyle birlikte değerlendirmek gerekir; düşük oran bazen sorun, bazen fırsat işaretidir.",
        },
        applyHint: "Sohbet'e 'AAPL'in temel verilerini özetle' diye sor.",
      },
    ],
  },
  {
    slug: "opsiyonlar",
    name: "Opsiyonların Sırrı",
    level: "Orta",
    blurb: "Call, put ve riski parmak yakmadan yönetmek.",
    iconKey: "options",
    lessons: [
      {
        slug: "call-put",
        title: "Call ve Put nedir?",
        minutes: 5,
        xp: 90,
        body: `Opsiyon, bir varlığı belirli bir fiyattan **alma veya satma hakkı** veren sözleşmedir (zorunluluk değil).

## İki temel tür
- **Call (alım):** Fiyatın yükseleceğini düşünüyorsan, belirli fiyattan **alma** hakkı.
- **Put (satım):** Fiyatın düşeceğini düşünüyorsan, belirli fiyattan **satma** hakkı.

## Dikkat
Opsiyonlar kaldıraçlıdır: küçük hareketler büyük kâr/zarar yaratabilir ve **zamanla değer kaybederler** (vade). Yeni başlayan biri için riskli bir araçtır — önce paper'da, küçük denemelerle öğren.`,
        quiz: {
          question: "Fiyatın yükseleceğini düşünen biri hangisini tercih eder?",
          options: [
            { text: "Put (satım opsiyonu)", correct: false },
            { text: "Call (alım opsiyonu)", correct: true },
            { text: "İkisi de fark etmez", correct: false },
          ],
          explain: "Call, belirli fiyattan alma hakkı verir — fiyat yükselirse değer kazanır.",
        },
        applyHint: "Opsiyonlar sayfasında bir opsiyon zincirini incele (paper).",
      },
    ],
  },
  {
    slug: "kripto",
    name: "Kripto Temelleri",
    level: "Başlangıç",
    blurb: "Kripto nedir, nasıl güvenle tutulur, portföye nasıl uyar.",
    iconKey: "crypto",
    lessons: [
      {
        slug: "kripto-nedir",
        title: "Kripto para nedir?",
        minutes: 4,
        xp: 70,
        body: `Kripto para, merkezi bir banka olmadan, **blok zinciri** adı verilen dağıtık bir defter üzerinde çalışan dijital varlıktır.

## Öne çıkan özellikler
- **Merkeziyetsiz:** Tek bir kurum kontrol etmez.
- **Sınırlı arz (bazılarında):** Örneğin Bitcoin'in toplam arzı 21 milyonla sınırlıdır.
- **Yüksek oynaklık:** Fiyatlar çok hızlı ve sert değişebilir.

## Portföydeki yeri
Kripto yüksek riskli bir varlık sınıfıdır. Birçok yatırımcı portföyünün yalnızca **küçük bir kısmını** kriptoya ayırır. Finovela'da BTC, ETH gibi varlıkları paper portföyünde risksiz deneyebilirsin.`,
        quiz: {
          question: "Kripto paranın temel özelliği hangisidir?",
          options: [
            { text: "Bir merkez bankası tarafından basılır", correct: false },
            { text: "Merkeziyetsiz blok zincirinde çalışır", correct: true },
            { text: "Fiyatı hiç değişmez", correct: false },
          ],
          explain: "Kripto, merkezi bir otorite olmadan dağıtık blok zinciri üzerinde çalışır ve genellikle yüksek oynaklığa sahiptir.",
        },
        applyHint: "Piyasalar'da BTC'yi ara, fiyat grafiğine bak.",
      },
    ],
  },
  {
    slug: "vergi",
    name: "Vergi-Akıllı Yatırım",
    level: "İleri",
    blurb: "Zarar mahsubu ve getirinin daha fazlasını elinde tutmak.",
    iconKey: "tax",
    lessons: [
      {
        slug: "zarar-mahsubu",
        title: "Zarar mahsubu (tax-loss harvesting)",
        minutes: 5,
        xp: 100,
        body: `Zarar mahsubu, zarardaki bir pozisyonu **bilinçli satarak** o zararı kârlarınla mahsup etme stratejisidir — böylece vergiye esas kazancın azalır.

## Mantığı
- Bir varlık X'te zararda, başka bir varlık Y'de kârdasın.
- X'i satıp zararı **gerçekleştirirsen**, bu zarar Y'deki vergiye esas kârı düşürebilir.

## Dikkat edilmesi gerekenler
- Bu **genel bir kavramdır**; vergi kuralları ülkeye ve duruma göre değişir.
- Kesin uygulama için bir **mali müşavire** danışmak gerekir.

Finovela Vergi Merkezi bu kavramları görselleştirir, ama nihai vergi planlaması profesyonel iştir — bu ders yatırım/vergi tavsiyesi değildir.`,
        quiz: {
          question: "Zarar mahsubunun amacı nedir?",
          options: [
            { text: "Daha fazla işlem ücreti ödemek", correct: false },
            { text: "Zararı kârla mahsup edip vergiye esas kazancı azaltmak", correct: true },
            { text: "Garantili kâr elde etmek", correct: false },
          ],
          explain: "Gerçekleşen zararlar, gerçekleşen kârları dengeleyerek vergiye esas kazancı düşürebilir — kurallar ülkeye göre değişir.",
        },
        applyHint: "Vergi Merkezi'nde mahsup senaryolarını incele.",
      },
    ],
  },
];

/** Tüm ders sayısı + toplam XP (özet kartları için). */
export function academyTotals() {
  let lessons = 0;
  let xp = 0;
  for (const t of ACADEMY_TRACKS) {
    lessons += t.lessons.length;
    for (const l of t.lessons) xp += l.xp;
  }
  return { tracks: ACADEMY_TRACKS.length, lessons, xp };
}

/** "trackSlug/lessonSlug" → benzersiz ders id. */
export function lessonId(trackSlug: string, lessonSlug: string): string {
  return `${trackSlug}/${lessonSlug}`;
}
