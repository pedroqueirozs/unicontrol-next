import { notFound } from "next/navigation"
import { Package, MapPin, Truck, ExternalLink, CheckCircle2 } from "lucide-react"
import { prisma } from "@/lib/prisma"
import { trackCorreiosObject, type TrackingResult } from "@/lib/correios"

function formatDate(date: Date | null): string {
  if (!date) return "—"
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(date)
}

// Os eventos dos Correios vêm sem timezone (ex: "2026-07-06T16:03:11"),
// já representando o horário local do evento — por isso formatamos direto
// da string, sem passar por Date/Intl (evitaria conversão de timezone indevida).
function formatEventDateTime(iso: string): string {
  const [datePart, timePart] = iso.split("T")
  const [y, m, d] = datePart.split("-")
  const hm = timePart?.slice(0, 5) ?? ""
  return `${d}/${m}/${y}${hm ? ` às ${hm}` : ""}`
}

function formatUnit(unit?: { type?: string; city?: string; uf?: string }): string | null {
  if (!unit?.city) return null
  const place = unit.uf ? `${unit.city} - ${unit.uf}` : unit.city
  return unit.type ? `${unit.type}, ${place}` : place
}

export default async function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const shipment = await prisma.goodsShipped.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      documentNumber: true,
      city: true,
      uf: true,
      transporter: true,
      shippingDate: true,
      deliveryForecast: true,
      deliveryDate: true,
      trackingCodes: true,
      companyId: true,
      company: { select: { name: true, logoUrl: true } },
    },
  })

  if (!shipment) notFound()

  const carrier = await prisma.carrier.findFirst({
    where: { companyId: shipment.companyId, name: shipment.transporter },
    select: { trackingUrl: true },
  })

  const carrierUrl =
    carrier?.trackingUrl && carrier.trackingUrl.endsWith("=")
      ? carrier.trackingUrl + shipment.documentNumber
      : (carrier?.trackingUrl ?? null)

  const isCorreios = shipment.transporter === "Correios"

  let trackings: { code: string; result?: TrackingResult; error?: string }[] = []
  if (isCorreios && shipment.trackingCodes.length > 0) {
    trackings = await Promise.all(
      shipment.trackingCodes.map(async (code) => {
        try {
          return { code, result: await trackCorreiosObject(code) }
        } catch {
          return { code, error: "Não foi possível consultar o rastreio deste código no momento." }
        }
      })
    )
  }

  // Só mostramos o link externo da transportadora quando não temos uma linha
  // do tempo real pra exibir aqui mesmo (ex: Braspress, ou falha na consulta
  // aos Correios). Pros Correios com rastreio funcionando, o link seria
  // redundante — os eventos já aparecem na própria página.
  const hasLiveTracking = trackings.some((t) => t.result && t.result.events.length > 0)
  const showCarrierUrl = carrierUrl && !hasLiveTracking

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-lg flex flex-col gap-4">
        {/* Header / branding */}
        <div className="flex flex-col items-center text-center gap-2 mb-2">
          {shipment.company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={shipment.company.logoUrl}
              alt={shipment.company.name}
              className="h-12 object-contain"
            />
          ) : (
            <p className="font-semibold text-foreground text-lg">{shipment.company.name}</p>
          )}
          <p className="text-sm text-muted-foreground">Rastreio de encomenda</p>
        </div>

        {/* Shipment summary */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-semibold text-foreground">{shipment.name}</p>
              <p className="text-sm text-muted-foreground mt-0.5">NF {shipment.documentNumber}</p>
            </div>
            {shipment.deliveryDate ? (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium bg-details-green/15 text-details-green shrink-0">
                <CheckCircle2 size={13} /> Entregue
              </span>
            ) : (
              <span className="inline-flex text-xs px-2 py-1 rounded-full font-medium bg-primary/10 text-primary shrink-0">
                Em andamento
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin size={14} /> {shipment.city}/{shipment.uf}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Truck size={14} /> {shipment.transporter}
            </div>
            <div className="col-span-2 text-muted-foreground">
              Envio: <span className="text-foreground">{formatDate(shipment.shippingDate)}</span>
              {shipment.deliveryDate ? (
                <>
                  {" "}
                  · Entregue em:{" "}
                  <span className="text-details-green font-medium">{formatDate(shipment.deliveryDate)}</span>
                </>
              ) : shipment.deliveryForecast ? (
                <>
                  {" "}
                  · Previsão: <span className="text-foreground">{formatDate(shipment.deliveryForecast)}</span>
                </>
              ) : null}
            </div>
          </div>

          {showCarrierUrl && (
            <a
              href={carrierUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline mt-4"
            >
              <ExternalLink size={14} /> Rastrear no site da transportadora
            </a>
          )}
        </div>

        {/* Tracking timelines */}
        {trackings.map(({ code, result, error }) => (
          <div key={code} className="bg-card border border-border rounded-2xl p-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3 font-mono">
              {code}
            </p>

            {error ? (
              <p className="text-sm text-muted-foreground">{error}</p>
            ) : result && result.events.length > 0 ? (
              <ol className="flex flex-col gap-4">
                {result.events.map((ev, i) => (
                  <li key={i} className="flex gap-3">
                    <div className="flex flex-col items-center pt-1">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${i === 0 ? "bg-primary" : "bg-border"}`} />
                      {i < result.events.length - 1 && <span className="w-px flex-1 bg-border mt-1" />}
                    </div>
                    <div className="pb-1">
                      <p className={`text-sm ${i === 0 ? "font-medium text-foreground" : "text-foreground/80"}`}>
                        {ev.description}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{formatEventDateTime(ev.date)}</p>
                      {formatUnit(ev.unit) && (
                        <p className="text-xs text-muted-foreground mt-1">de {formatUnit(ev.unit)}</p>
                      )}
                      {formatUnit(ev.destinationUnit) && (
                        <p className="text-xs text-muted-foreground">para {formatUnit(ev.destinationUnit)}</p>
                      )}
                      {ev.detail && <p className="text-xs text-foreground/80 mt-1 italic">{ev.detail}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum evento de rastreio encontrado ainda.</p>
            )}
          </div>
        ))}

        {isCorreios && shipment.trackingCodes.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 text-center">
            <Package size={28} className="mx-auto mb-2 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Código de rastreio ainda não informado para este envio.</p>
          </div>
        )}
      </div>
    </div>
  )
}
