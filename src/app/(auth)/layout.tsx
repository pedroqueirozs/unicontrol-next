import Image from "next/image"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">

      {/* Painel esquerdo — branding. Só aparece em telas md+ */}
      <div className="hidden md:flex md:w-1/2 lg:w-2/5 bg-sidebar flex-col items-center justify-center gap-6 p-12">
        <Image
          src="/unicontrol-logo-light.svg"
          alt="UniControl"
          width={200}
          height={60}
          priority
        />
        <p className="text-sidebar-foreground text-center text-base leading-relaxed max-w-xs">
          Sistema interno de controle de processos
        </p>
      </div>

      {/* Painel direito — formulário */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-background">

        {/* Logo mobile — aparece quando o painel esquerdo some */}
        <div className="md:hidden mb-10">
          <Image
            src="/unicontrol-logo-dark.svg"
            alt="UniControl"
            width={160}
            height={48}
            priority
          />
        </div>

        <div className="w-full max-w-sm">
          {children}
        </div>

      </div>
    </div>
  )
}
