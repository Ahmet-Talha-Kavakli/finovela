/**
 * Kod ile çizilmiş gerçekçi yeni-model iPhone çerçevesi (kalın bezel + Dynamic Island).
 * İçi `children` ile doldurulur — böylece görsel üretmeye gerek yok, ekran HEP net,
 * arka plan zemine kaynaşır (kutu/benek sorunu imkansız).
 */
export function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto aspect-[9/19.2] w-full max-w-[380px]">
      {/* gövde / titanyum çerçeve */}
      <div className="absolute inset-0 rounded-[3.2rem] bg-[linear-gradient(145deg,#3a3a42,#1a1a1f_45%,#2c2c33)] p-[3px] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
        {/* bezel */}
        <div className="relative h-full w-full overflow-hidden rounded-[3rem] bg-black p-[10px]">
          {/* ekran */}
          <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-[#071026]">
            {/* Dynamic Island */}
            <div className="absolute left-1/2 top-2 z-20 h-[26px] w-[92px] -translate-x-1/2 rounded-full bg-black" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
