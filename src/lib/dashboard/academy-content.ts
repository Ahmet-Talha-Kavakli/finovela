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
      {
        slug: "sohbetle-portfoy",
        title: "Sohbetle portföy kurmak",
        minutes: 5,
        xp: 90,
        body: `Finovela ile portföyünü adım adım, konuşarak inşa edebilirsin — tablo doldurmaya, karmaşık ekranlara gerek yok.

## Nasıl?
- Hedefini söyle: "uzun vadeli, dengeli bir portföy istiyorum"
- Finovela öneri + gerekçe sunar (hangi sektör, neden, ne ağırlık)
- Beğenmediğini değiştir: "kriptoyu azalt, temettü hissesi ekle"
- Onayladığını **paper portföyünde** uygula, sonucu izle

## Diyalog = kontrol
Güzel yanı: her adımda sen karar verirsin. AI hızlı taslak çıkarır, sen ince ayar yaparsın. Bu, sıfırdan tek tek hisse seçmekten çok daha hızlı ve öğreticidir — çünkü Finovela her önerinin **nedenini** açıklar.`,
        quiz: {
          question: "Sohbetle portföy kurmanın en güçlü yanı nedir?",
          options: [
            { text: "AI her şeyi senin yerine, sorgusuz yapar", correct: false },
            { text: "Her adımda gerekçe görüp sen ince ayar yaparsın", correct: true },
            { text: "Hiç karar vermene gerek kalmaz", correct: false },
          ],
          explain: "Finovela hızlı taslak ve gerekçe sunar; nihai kararı ve ince ayarı sen yaparsın — bu hem hızlı hem öğreticidir.",
        },
        applyHint: "Sohbet'e 'dengeli uzun vadeli portföy öner' yaz, gerekçeleri oku.",
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
      {
        slug: "fiyati-ne-hareket-ettirir",
        title: "Fiyatı gerçekte ne hareket ettirir?",
        minutes: 5,
        xp: 90,
        body: `Kısa vadede fiyat, şirketin "değerinden" çok **beklenti ve duyguyla** hareket eder. Bunu anlamak, panik ve FOMO'dan korur.

## Başlıca itici güçler
- **Beklenti vs gerçekleşen:** Şirket iyi bilanço açıklasa bile, beklentinin altındaysa fiyat **düşebilir**. Önemli olan sürprizdir.
- **Haber ve duygu:** Sektör haberi, faiz kararı, genel piyasa korkusu/açgözlülüğü fiyatı sürükler.
- **Arz-talep:** Sonuçta fiyat, almak isteyenle satmak isteyenin dengesidir.

## Uzun vade farkı
Uzun vadede fiyat, şirketin gerçek **kazanç gücüne** yaklaşma eğilimindedir. Yani kısa vadeli gürültüye kapılmadan, temel veriye ve kendi planına bağlı kalmak çoğu zaman daha sağlıklıdır. Finovela Pulse, senin varlıklarını etkileyen haberleri süzerek bu gürültüyü yönetmene yardım eder.`,
        quiz: {
          question: "Bir şirket iyi bilanço açıkladığı halde hissesi neden düşebilir?",
          options: [
            { text: "İyi bilanço her zaman fiyatı düşürür", correct: false },
            { text: "Sonuç beklentinin altında kalmış olabilir", correct: true },
            { text: "Bilançonun fiyata etkisi yoktur", correct: false },
          ],
          explain: "Piyasa beklentiyi fiyatlar; gerçekleşen sonuç beklentinin altındaysa, iyi olsa bile fiyat düşebilir. Önemli olan sürprizdir.",
        },
        applyHint: "Finovela Pulse'ta varlıklarını etkileyen haberleri incele.",
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
      {
        slug: "spread",
        title: "Spread: riski sınırlamak",
        minutes: 5,
        xp: 100,
        body: `Tek bir opsiyon almak risklidir; **spread**, iki opsiyonu birlikte kullanarak hem maliyeti hem riski azaltır.

## Mantığı
Bir opsiyon **alırsın**, aynı anda başka bir opsiyon **satarsın**. Sattığın opsiyon sana prim kazandırır, böylece toplam maliyetin düşer.

- **Boğa call spread:** Yükseliş beklersin ama sınırlı. Düşük strike call al, yüksek strike call sat.
- **Sonuç:** Hem kazancın hem kaybın **tavanlanmış** olur — sürpriz yok.

## Neden kullanılır?
Spread, "fiyat şu aralıkta hareket eder" görüşünü ucuza ve **tanımlı riskle** ifade etmenin yoludur. Yeni başlayanlar için tek-bacaklı opsiyondan daha güvenlidir çünkü maksimum kaybın önceden bellidir.`,
        quiz: {
          question: "Spread'in en büyük avantajı nedir?",
          options: [
            { text: "Sınırsız kazanç sağlar", correct: false },
            { text: "Maksimum kaybı önceden tanımlar", correct: true },
            { text: "Hiç risk içermez", correct: false },
          ],
          explain: "Spread'de hem kazanç hem kayıp tavanlıdır — maksimum kaybın baştan bellidir, bu yüzden tek opsiyondan daha kontrollüdür.",
        },
        applyHint: "What-If Stüdyosu'nda bir senaryoyu kâr/zarar tavanıyla düşün.",
      },
      {
        slug: "opsiyon-risk",
        title: "Opsiyonlarda risk yönetimi",
        minutes: 4,
        xp: 90,
        body: `Opsiyonlar güçlü ama acımasız olabilir. En sık yapılan hata, **kaldıracı** anlamadan büyük pozisyon açmaktır.

## Altın kurallar
- **Küçük başla:** Portföyünün yalnızca küçük bir kısmını opsiyona ayır.
- **Vadeyi hesaba kat:** Opsiyon her gün **zaman değeri** kaybeder; haklı olsan bile geç kalırsan kaybedebilirsin.
- **Tanımlı risk:** Mümkünse spread gibi maksimum kaybı belli stratejileri tercih et.

## Paper'da prova
Finovela'nın sanal portföyünde opsiyon stratejilerini **gerçek para riski olmadan** dene. Bir kez kaldıracın iki yönlü çalıştığını paper'da gördüğünde, gerçek kararların çok daha sağlam olur.`,
        quiz: {
          question: "Opsiyonlarda en sık yapılan hata hangisidir?",
          options: [
            { text: "Küçük pozisyon açmak", correct: false },
            { text: "Kaldıracı anlamadan büyük pozisyon açmak", correct: true },
            { text: "Spread kullanmak", correct: false },
          ],
          explain: "Kaldıraç kazancı da kaybı da büyütür; anlamadan büyük pozisyon açmak hızlı kayıplara yol açar. Küçük başla, paper'da prova yap.",
        },
        applyHint: "Opsiyonlar sayfasında küçük bir paper denemesi yap.",
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
      {
        slug: "kripto-guvenlik",
        title: "Kriptoyu güvenle tutmak",
        minutes: 5,
        xp: 80,
        body: `Kriptoda en büyük risk fiyat değil, **güvenliktir**. "Anahtarın değilse, kripton değil" sözü buradan gelir.

## Temel kavramlar
- **Cüzdan:** Kriptonu tuttuğun yer. Borsada (kolay ama borsaya bağımlı) veya kendi cüzdanında (tam kontrol ama sorumluluk sende) tutabilirsin.
- **Özel anahtar / seed:** Cüzdanına erişim sağlayan gizli dizi. **Kimseyle paylaşma**, kaybedersen kripton da gider.

## Güvenli alışkanlıklar
- Seed'ini **çevrimdışı** ve güvenli sakla
- **Resmi olmayan** linklere, "ücretsiz kripto" vaatlerine kanma (dolandırıcılık)
- Büyük tutarları soğuk (offline) cüzdanda tut

Finovela'da kripto **paper** olarak izlenir — güvenlik kavramlarını risksiz öğrenir, sonra gerçek cüzdan kararını bilinçli verirsin.`,
        quiz: {
          question: "'Anahtarın değilse, kripton değil' ne anlama gelir?",
          options: [
            { text: "Kripto her zaman borsada tutulmalı", correct: false },
            { text: "Özel anahtarı kontrol etmiyorsan, varlık tam senin kontrolünde değildir", correct: true },
            { text: "Kripto tutmak yasadışıdır", correct: false },
          ],
          explain: "Özel anahtar/seed cüzdana erişimi sağlar; onu kontrol etmiyorsan (örn. tamamen borsaya bağımlıysan) varlık üzerinde tam hakimiyetin yoktur.",
        },
        applyHint: "Watchlist'e BTC ekle, fiyat hareketini paper'da izle.",
      },
      {
        slug: "kripto-portfoy",
        title: "Kripto portföye nasıl uyar?",
        minutes: 4,
        xp: 80,
        body: `Kripto yüksek getiri potansiyeli kadar yüksek **oynaklık** taşır. Doğru soru "almalı mıyım?" değil, "**ne kadar**?" olmalı.

## Konumlandırma
- Birçok yatırımcı kriptoyu portföyünün **küçük bir yüzdesiyle** sınırlar.
- Kripto, hisse senedi gibi geleneksel varlıklarla her zaman aynı yönde hareket etmez — bu **çeşitlendirme** sağlayabilir.
- Ama sert düşüşlere hazır ol: %50+ değer kaybı kriptoda olağandır.

## Disiplin
Heyecanla "hepsini kriptoya" demek en sık görülen hatadır. Önce hedefini ve risk toleransını belirle, sonra kriptoyu o çerçeveye **küçük bir parça** olarak yerleştir. What-If Stüdyosu'nda farklı kripto ağırlıklarını risksiz dene.`,
        quiz: {
          question: "Kriptoyu portföye eklerken doğru yaklaşım nedir?",
          options: [
            { text: "Tüm portföyü kriptoya çevirmek", correct: false },
            { text: "Risk toleransına göre küçük bir parça ayırmak", correct: true },
            { text: "Hiç kripto tutmamak şart", correct: false },
          ],
          explain: "Kripto yüksek oynaklık taşır; çoğu yatırımcı onu portföyün küçük bir yüzdesiyle sınırlar ve risk toleransına göre konumlandırır.",
        },
        applyHint: "What-If Stüdyosu'nda farklı kripto ağırlıklarını karşılaştır.",
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
      {
        slug: "vade-vergi",
        title: "Uzun vade ve vergi",
        minutes: 4,
        xp: 90,
        body: `Ne zaman sattığın, ne kadar vergi ödeyeceğini etkileyebilir. Birçok sistemde **uzun vadeli** tutulan varlıklar daha avantajlı vergilenir.

## Genel mantık
- **Kısa vade:** Hızlı al-sat genellikle daha yüksek oranda vergilenir.
- **Uzun vade:** Daha uzun tutmak bazı ülkelerde indirimli oran veya istisna sağlayabilir.

## Yatırıma etkisi
Vergi tek başına karar sebebi olmamalı ama **bilmek** önemlidir: aynı kazanç, satış zamanlamasına göre cebinde farklı kalır. Sık al-sat eden biri, kazancının önemli bir kısmını vergiye ve işlem maliyetine kaptırabilir.

Kurallar ülkeye göre çok değişir — bu **genel bilgidir**, kesin uygulama için mali müşavire danış. Finovela bunu eğitim amaçlı görselleştirir, vergi tavsiyesi vermez.`,
        quiz: {
          question: "Birçok vergi sisteminde uzun vadeli tutulan varlıklar için genellikle ne geçerlidir?",
          options: [
            { text: "Daha yüksek vergi oranı", correct: false },
            { text: "Çoğu zaman daha avantajlı vergileme", correct: true },
            { text: "Vergi hiç alınmaz", correct: false },
          ],
          explain: "Birçok sistemde uzun vadeli tutuş indirimli oran/istisna sağlayabilir; yine de kurallar ülkeye göre değişir — kesin bilgi için mali müşavir gerekir.",
        },
        applyHint: "Hedefler'de uzun vadeli bir hedef tanımla.",
      },
      {
        slug: "maliyeti-dusurmek",
        title: "Görünmez düşman: maliyetler",
        minutes: 4,
        xp: 90,
        body: `Getirini sessizce yiyen şey çoğu zaman piyasa değil, **maliyetlerdir**: işlem ücretleri, yüksek fon giderleri, gereksiz sık al-sat.

## Nereye dikkat
- **İşlem sıklığı:** Her al-sat ücret ve vergi doğurur. Aşırı işlem (overtrading) getiriyi eritir.
- **Fon giderleri:** Bazı fonların yıllık gideri yüksektir; uzun vadede büyük fark yaratır.
- **Spread/komisyon:** Küçük görünen farklar, çok işlemde toplanır.

## Akıllı yaklaşım
Bileşik getirinin gücü, **maliyetleri düşük tutmakla** katlanır. Az ama bilinçli işlem, çok ve dürtüsel işlemden genelde daha iyidir. Finovela Coach, paper işlemlerinde aşırı işlem gibi maliyet-artıran davranışları sana gösterir.`,
        quiz: {
          question: "Uzun vadede getiriyi en çok eriten gizli faktörlerden biri nedir?",
          options: [
            { text: "Çeşitlendirme", correct: false },
            { text: "Yüksek maliyetler ve aşırı işlem", correct: true },
            { text: "Uzun vadeli tutuş", correct: false },
          ],
          explain: "İşlem ücretleri, fon giderleri ve aşırı al-sat getiriyi sessizce eritir; maliyetleri düşük tutmak bileşik getiriyi güçlendirir.",
        },
        applyHint: "Geçmiş İşlemler'de Coach'a işlem sıklığını analiz ettir.",
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
