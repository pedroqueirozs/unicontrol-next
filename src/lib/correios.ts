// Integração com a API dos Correios (CWS) para rastreamento de objetos.
// Docs: https://cws.correios.com.br (API "Token" + API "SRO - Rastro")

type CorreiosTokenResponse = {
  token: string
  expiraEm: string
}

type CorreiosUnidade = {
  tipo?: string
  endereco?: {
    cidade?: string
    uf?: string
  }
}

type CorreiosEvento = {
  codigo: string
  descricao: string
  detalhe?: string
  dtHrCriado: string
  unidade?: CorreiosUnidade
  unidadeDestino?: CorreiosUnidade
}

type CorreiosObjeto = {
  codObjeto: string
  mensagem?: string
  dtPrevista?: string
  eventos: CorreiosEvento[]
}

type CorreiosSroResponse = {
  quantidade: number
  objetos: CorreiosObjeto[]
}

const TOKEN_URL = "https://api.correios.com.br/token/v1/autentica/contrato"
const RASTRO_URL = "https://api.correios.com.br/srorastro/v1/objetos"

let cachedToken: { token: string; expiraEm: number } | null = null

// Reutiliza o token em memória enquanto ele estiver válido, renovando
// com folga de 5 minutos antes de expirar (a validade é de ~24h).
async function getCorreiosToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiraEm - now > 5 * 60 * 1000) {
    return cachedToken.token
  }

  const usuario = process.env.CORREIOS_USUARIO
  const codigoAcesso = process.env.CORREIOS_CODIGO_ACESSO
  const contrato = process.env.CORREIOS_CONTRATO
  const dr = process.env.CORREIOS_DR

  if (!usuario || !codigoAcesso || !contrato) {
    throw new Error("Credenciais dos Correios não configuradas (CORREIOS_USUARIO / CORREIOS_CODIGO_ACESSO / CORREIOS_CONTRATO).")
  }

  const basicAuth = Buffer.from(`${usuario}:${codigoAcesso}`).toString("base64")

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      numero: contrato,
      ...(dr ? { dr: Number(dr) } : {}),
    }),
  })

  if (!res.ok) {
    throw new Error(`Falha ao autenticar na API dos Correios (status ${res.status}).`)
  }

  const data: CorreiosTokenResponse = await res.json()
  cachedToken = { token: data.token, expiraEm: new Date(data.expiraEm).getTime() }
  return data.token
}

export type TrackingLocation = {
  type?: string
  city?: string
  uf?: string
}

export type TrackingEvent = {
  code: string
  description: string
  detail?: string
  date: string
  unit?: TrackingLocation
  destinationUnit?: TrackingLocation
}

export type TrackingResult = {
  object: string
  forecast?: string
  events: TrackingEvent[]
}

// Consulta o rastreio de um único objeto (ex: "AA123456789BR").
// Faz uma nova tentativa de autenticação caso o token em cache tenha sido
// rejeitado (401/403), o que pode acontecer se ele expirar ou for revogado.
export async function trackCorreiosObject(codigoObjeto: string): Promise<TrackingResult> {
  const doFetch = async (token: string) =>
    fetch(`${RASTRO_URL}/${encodeURIComponent(codigoObjeto)}?resultado=T`, {
      headers: { Authorization: `Bearer ${token}`, "Accept-Language": "pt-BR" },
    })

  let token = await getCorreiosToken()
  let res = await doFetch(token)

  if (res.status === 401 || res.status === 403) {
    cachedToken = null
    token = await getCorreiosToken()
    res = await doFetch(token)
  }

  if (!res.ok) {
    throw new Error(`Falha ao consultar rastreio dos Correios (status ${res.status}).`)
  }

  const data: CorreiosSroResponse = await res.json()
  const objeto = data.objetos?.[0]
  if (!objeto) {
    throw new Error("Objeto não encontrado no rastreio dos Correios.")
  }

  return {
    object: objeto.codObjeto,
    forecast: objeto.dtPrevista,
    events: (objeto.eventos ?? []).map((e) => ({
      code: e.codigo,
      description: e.descricao,
      detail: e.detalhe,
      date: e.dtHrCriado,
      unit: e.unidade
        ? { type: e.unidade.tipo, city: e.unidade.endereco?.cidade, uf: e.unidade.endereco?.uf }
        : undefined,
      destinationUnit: e.unidadeDestino
        ? {
            type: e.unidadeDestino.tipo,
            city: e.unidadeDestino.endereco?.cidade,
            uf: e.unidadeDestino.endereco?.uf,
          }
        : undefined,
    })),
  }
}
