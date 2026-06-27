import type { Metadata } from "next";
import { LegalDoc, LegalSection } from "@/components/site/legal-doc";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni — Finovela",
  description:
    "6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Finovela aydınlatma metni.",
};

export default function KvkkPage() {
  return (
    <LegalDoc
      title="KVKK Aydınlatma Metni"
      updated="26 Haziran 2026"
      intro={
        <>
          Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
          kapsamında, veri sorumlusu sıfatıyla Finovela tarafından kişisel
          verilerinizin işlenmesine ilişkin olarak sizi aydınlatmak amacıyla
          hazırlanmıştır. Uluslararası kullanıcılar için ayrıca{" "}
          <a href="/privacy" className="text-[#7fb0ff] hover:text-white">Privacy Policy</a>{" "}
          geçerlidir.
        </>
      }
    >
      <LegalSection n={1} title="Veri Sorumlusu">
        <p>
          Kişisel verileriniz, veri sorumlusu sıfatıyla Finovela tarafından, aşağıda
          açıklanan kapsamda işlenmektedir. İletişim:{" "}
          <a href="mailto:kvkk@finovela.com" className="text-[#7fb0ff] hover:text-white">
            kvkk@finovela.com
          </a>.
        </p>
      </LegalSection>

      <LegalSection n={2} title="İşlenen Kişisel Veriler">
        <ul className="list-disc space-y-1.5 pl-6">
          <li><strong>Kimlik ve iletişim:</strong> ad-soyad, e-posta ve kimlik doğrulama bilgileri.</li>
          <li><strong>Profil:</strong> kayıt sırasında verdiğiniz risk profili, hedefler ve tercihler.</li>
          <li><strong>Kullanım:</strong> portföy, izleme listesi, alarmlar, sohbetler ve otomasyon ayarlarınız.</li>
          <li><strong>Bağlantı meta verisi:</strong> bağladığınız borsa/aracı kurum ve verdiğiniz yetki kapsamı. API anahtarları şifreli saklanır.</li>
          <li><strong>İşlem güvenliği:</strong> cihaz, tarayıcı, IP adresi ve log kayıtları.</li>
          <li><strong>Ödeme:</strong> ödeme sağlayıcısı tarafından işlenir; tam kart numarası tarafımızca saklanmaz.</li>
        </ul>
      </LegalSection>

      <LegalSection n={3} title="İşleme Amaçları">
        <ul className="list-disc space-y-1.5 pl-6">
          <li>hizmetin sunulması, geliştirilmesi ve sürdürülmesi;</li>
          <li>hesabınızın ve bağlantılarınızın güvenliğinin sağlanması;</li>
          <li>yapay zeka özelliklerinin çalıştırılması;</li>
          <li>abonelik, kredi ve ödeme işlemlerinin yürütülmesi;</li>
          <li>hukuki yükümlülüklerin yerine getirilmesi ve dolandırıcılığın önlenmesi.</li>
        </ul>
      </LegalSection>

      <LegalSection n={4} title="Hukuki Sebepler (KVKK m.5)">
        <p>
          Kişisel verileriniz; bir sözleşmenin kurulması veya ifası için gerekli olması,
          hukuki yükümlülüğün yerine getirilmesi, ilgili kişinin temel hak ve
          özgürlüklerine zarar vermemek kaydıyla veri sorumlusunun meşru menfaati ve
          gerekli hallerde açık rızanız hukuki sebeplerine dayanılarak işlenir.
        </p>
      </LegalSection>

      <LegalSection n={5} title="Aktarım">
        <p>
          Kişisel verileriniz; hizmetin sunulabilmesi için kimlik doğrulama, barındırma,
          yapay zeka, piyasa verisi, ödeme sağlayıcıları ve bağlamayı seçtiğiniz
          borsa/aracı kurumlar ile sınırlı olarak ve gerekli güvenlik önlemleri altında
          paylaşılabilir. Verileriniz hiçbir şekilde satılmaz. Yurt dışına aktarım,
          KVKK&apos;da öngörülen şartlar ve uygun güvenceler çerçevesinde yapılır.
        </p>
      </LegalSection>

      <LegalSection n={6} title="Saklama Süresi">
        <p>
          Kişisel verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatta
          öngörülen zamanaşımı/saklama süreleri boyunca saklanır; sürenin dolması veya
          hesabınızın silinmesi halinde silinir, yok edilir veya anonim hale getirilir.
        </p>
      </LegalSection>

      <LegalSection n={7} title="İlgili Kişinin Hakları (KVKK m.11)">
        <p>KVKK m.11 uyarınca; kişisel verilerinizin işlenip işlenmediğini öğrenme, buna ilişkin bilgi talep etme, işlenme amacını öğrenme, düzeltilmesini veya silinmesini isteme, aktarıldığı üçüncü kişileri bilme ve zararın giderilmesini talep etme haklarına sahipsiniz.</p>
        <p>
          Bu haklarınızı kullanmak için{" "}
          <a href="mailto:kvkk@finovela.com" className="text-[#7fb0ff] hover:text-white">
            kvkk@finovela.com
          </a>{" "}
          adresine başvurabilir veya hesabınızı ayarlar sayfasından silebilirsiniz.
        </p>
      </LegalSection>

      <LegalSection n={8} title="Önemli Uyarı — Yatırım Tavsiyesi Değildir">
        <p>
          Finovela bir aracı kurum, yatırım danışmanı veya saklama kuruluşu değildir;
          paranızı tutmaz. Platformdaki içerik yatırım tavsiyesi niteliği taşımaz.
          Ayrıntı için{" "}
          <a href="/disclaimer" className="text-[#7fb0ff] hover:text-white">Risk Bildirimi</a>{" "}
          metnini inceleyiniz.
        </p>
      </LegalSection>
    </LegalDoc>
  );
}
