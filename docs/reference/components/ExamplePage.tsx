import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";

dayjs.extend(customParseFormat);

import InputSelect from "@/components/InputSelect";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { CustomDataGrid } from "@/components/CustomDataGrid";
import { useConfirmDialog } from "@/components/ConfimDialog";
import { GridColDef } from "@mui/x-data-grid";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button as MuiButton,
} from "@mui/material";

import { db } from "@/services/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  Timestamp,
  updateDoc,
} from "firebase/firestore";

import { notify } from "@/utils/notify";
import { ptBR } from "@mui/x-data-grid/locales";
import { Check, Copy, ExternalLink, Flag, Pencil, Search, Trash2, X } from "lucide-react";

// ── Constantes ────────────────────────────────────────────────────────────────

const BRAZILIAN_STATES = [
  { value: "AC", label: "AC - Acre" },
  { value: "AL", label: "AL - Alagoas" },
  { value: "AP", label: "AP - Amapá" },
  { value: "AM", label: "AM - Amazonas" },
  { value: "BA", label: "BA - Bahia" },
  { value: "CE", label: "CE - Ceará" },
  { value: "DF", label: "DF - Distrito Federal" },
  { value: "ES", label: "ES - Espírito Santo" },
  { value: "GO", label: "GO - Goiás" },
  { value: "MA", label: "MA - Maranhão" },
  { value: "MT", label: "MT - Mato Grosso" },
  { value: "MS", label: "MS - Mato Grosso do Sul" },
  { value: "MG", label: "MG - Minas Gerais" },
  { value: "PA", label: "PA - Pará" },
  { value: "PB", label: "PB - Paraíba" },
  { value: "PR", label: "PR - Paraná" },
  { value: "PE", label: "PE - Pernambuco" },
  { value: "PI", label: "PI - Piauí" },
  { value: "RJ", label: "RJ - Rio de Janeiro" },
  { value: "RN", label: "RN - Rio Grande do Norte" },
  { value: "RS", label: "RS - Rio Grande do Sul" },
  { value: "RO", label: "RO - Rondônia" },
  { value: "RR", label: "RR - Roraima" },
  { value: "SC", label: "SC - Santa Catarina" },
  { value: "SP", label: "SP - São Paulo" },
  { value: "SE", label: "SE - Sergipe" },
  { value: "TO", label: "TO - Tocantins" },
];

// ── Tipos ─────────────────────────────────────────────────────────────────────

type NoteEntry = {
  id: string;
  text: string;
  createdAt: Timestamp;
};

type ClientRecord = {
  id: string;
  code: string;
  cnpj: string;
  name: string;
  city: string;
  state: string;
};

export type MerchandiseFormData = {
  name: string;
  document_number: string;
  city: string;
  uf: string;
  transporter: string;
  shipping_date: string;
  delivery_forecast: string;
  delivery_date?: string | null;
  notes?: string | null;
};

export type MerchandiseFirestoreData = Omit<
  MerchandiseFormData,
  "shipping_date" | "delivery_forecast" | "delivery_date"
> & {
  shipping_date: Timestamp;
  delivery_forecast: Timestamp;
  delivery_date?: Timestamp | null;
  created_at: Timestamp;
  clientId?: string;
  clientCode?: string;
  flagged?: boolean;
  trackingCodes?: string[];
  notesHistory?: NoteEntry[];
};

export type MerchandiseUIData = Omit<
  MerchandiseFirestoreData,
  "shipping_date" | "delivery_forecast" | "delivery_date" | "created_at"
> & {
  id: string;
  shipping_date: string;
  delivery_forecast: string;
  delivery_date?: string;
  created_at: string;
  notes: string;
  situation: string;
  flagged?: boolean;
  notesHistory: NoteEntry[];
};

// ── Schema ────────────────────────────────────────────────────────────────────

const defaultFormValues: MerchandiseFormData = {
  name: "",
  document_number: "",
  city: "",
  uf: "SP",
  transporter: "",
  shipping_date: "",
  delivery_forecast: "",
  delivery_date: "",
  notes: "",
};

const schema = yup.object({
  name: yup.string().max(200, "Máximo de 200 caracteres").required("*"),
  document_number: yup
    .string()
    .max(50, "Máximo de 50 caracteres")
    .required("*"),
  city: yup.string().max(100, "Máximo de 100 caracteres").required("*"),
  uf: yup.string().required("*"),
  transporter: yup.string().required("*"),
  shipping_date: yup.string().required("*"),
  delivery_forecast: yup.string().when("transporter", {
    is: "Retirada na Empresa",
    then: (s) => s.notRequired(),
    otherwise: (s) =>
      s.required("*").test(
        "delivery-forecast-after-shipping",
        "Deve ser igual ou posterior à data de envio",
        function (value) {
          const { shipping_date } = this.parent;
          if (!value || !shipping_date) return true;
          return value >= shipping_date;
        }
      ),
  }),
  delivery_date: yup.string().when("transporter", {
    is: "Retirada na Empresa",
    then: (s) =>
      s.required("Informe a data de entrega").test(
        "delivery-date-pickup-after-shipping",
        "Deve ser igual ou posterior à data de envio",
        function (value) {
          const { shipping_date } = this.parent;
          if (!value || !shipping_date) return true;
          return value >= shipping_date;
        }
      ),
    otherwise: (s) =>
      s.notRequired().test(
        "delivery-date-after-shipping",
        "Deve ser igual ou posterior à data de envio",
        function (value) {
          const { shipping_date } = this.parent;
          if (!value || !shipping_date) return true;
          return value >= shipping_date;
        }
      ),
  }),
  notes: yup.string().notRequired().max(1000, "Máximo de 1000 caracteres"),
}) as yup.ObjectSchema<MerchandiseFormData>;

// ── Componente ────────────────────────────────────────────────────────────────

export default function GoodsShipped() {
  const { userData } = useAuth();
  const companyId = userData?.companyId ?? "";
  const [searchParams] = useSearchParams();
  const initialSituation = searchParams.get("situation") ?? "";

  const [data, setData] = useState<MerchandiseUIData[]>([]);
  const [tableIsLoading, setTableIsLoading] = useState(false);
  const { confirm, dialog } = useConfirmDialog();
  const [visibleForm, setVisibleForm] = useState(false);
  const [editItem, setEditItem] = useState<MerchandiseUIData | null>(null);
  const [detailItem, setDetailItem] = useState<MerchandiseUIData | null>(null);
  const [carriers, setCarriers] = useState<{ value: string; label: string; trackingUrl?: string }[]>([]);

  // ── Estado de rastreio ──────────────────────────────────────────────────────
  const [trackingCodes, setTrackingCodes] = useState<string[]>([]);
  const [trackingInput, setTrackingInput] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  function handleCopyCode(code: string) {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  }

  // ── Estado do histórico de observações ──────────────────────────────────────
  const [newNoteText, setNewNoteText] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  async function handleAddNote() {
    if (!detailItem || !newNoteText.trim()) return;
    setAddingNote(true);
    try {
      const newEntry: NoteEntry = {
        id: crypto.randomUUID(),
        text: newNoteText.trim(),
        createdAt: Timestamp.now(),
      };
      await updateDoc(
        doc(db, "companies", companyId, "goods_shipped", detailItem.id),
        { notesHistory: arrayUnion(newEntry) }
      );
      const updatedItem: MerchandiseUIData = {
        ...detailItem,
        notesHistory: [...detailItem.notesHistory, newEntry],
      };
      setDetailItem(updatedItem);
      setData((prev) => prev.map((d) => d.id === detailItem.id ? updatedItem : d));
      setNewNoteText("");
      notify.success("Observação adicionada.");
    } catch {
      notify.error("Erro ao adicionar observação.");
    } finally {
      setAddingNote(false);
    }
  }

  // ── Estado da busca de clientes ─────────────────────────────────────────────
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [showClientResults, setShowClientResults] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientRecord | null>(null);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  const paginationModel = { page: 0, pageSize: 10 };

  const {
    handleSubmit,
    register,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<MerchandiseFormData>({
    resolver: yupResolver(schema),
    defaultValues: defaultFormValues,
  });

  const watchedTransporter = watch("transporter");
  const watchedShippingDate = watch("shipping_date");
  const isPickup = watchedTransporter === "Retirada na Empresa";

  useEffect(() => {
    if (isPickup && watchedShippingDate) {
      setValue("delivery_date", watchedShippingDate);
    }
  }, [isPickup, watchedShippingDate, setValue]);

  useEffect(() => {
    if (isPickup) {
      setValue("delivery_forecast", "");
    }
  }, [isPickup, setValue]);

  // ── Carrega transportadoras e clientes ──────────────────────────────────────

  useEffect(() => {
    if (!companyId) return;

    async function loadInitialData() {
      try {
        const [carriersSnap, clientsSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, "companies", companyId, "carriers"),
              orderBy("createdAt", "asc")
            )
          ),
          getDocs(
            query(
              collection(db, "companies", companyId, "clients"),
              orderBy("name", "asc")
            )
          ),
        ]);

        setCarriers(
          carriersSnap.docs.map((d) => {
            const raw = d.data() as { name: string; trackingUrl?: string };
            return { value: raw.name, label: raw.name, trackingUrl: raw.trackingUrl };
          })
        );

        setClients(
          clientsSnap.docs.map((d) => {
            const raw = d.data() as { code: string; cnpj: string; name: string; city: string; state: string };
            return { id: d.id, code: raw.code, cnpj: raw.cnpj ?? "", name: raw.name, city: raw.city, state: raw.state };
          })
        );
      } catch {
        notify.error("Erro ao carregar dados iniciais.");
      }
    }

    loadInitialData();
  }, [companyId]);

  // ── Fecha dropdown ao clicar fora ───────────────────────────────────────────

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        clientSearchRef.current &&
        !clientSearchRef.current.contains(e.target as Node)
      ) {
        setShowClientResults(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Busca de clientes ───────────────────────────────────────────────────────

  const trimmed = clientSearch.trim().toLowerCase();
  const clientSearchResults =
    trimmed.length >= 1
      ? clients
          .filter(
            (c) =>
              c.name.toLowerCase().includes(trimmed) ||
              (c.cnpj ?? "").toLowerCase().includes(trimmed)
          )
          .slice(0, 8)
      : [];

  function handleSelectClient(client: ClientRecord) {
    setSelectedClient(client);
    setValue("name", client.name);
    setValue("city", client.city);
    setValue("uf", client.state);
    setClientSearch("");
    setShowClientResults(false);
  }

  function handleClearClient() {
    setSelectedClient(null);
    setValue("name", "");
    setValue("city", "");
    setValue("uf", "");
  }

  // ── Tabela ──────────────────────────────────────────────────────────────────

  const columns: GridColDef[] = [
    { field: "name", headerName: "Cliente", width: 150 },
    { field: "document_number", headerName: "Nota Fiscal", width: 120 },
    { field: "city", headerName: "Cidade", width: 150 },
    { field: "uf", headerName: "UF", width: 70 },
    { field: "transporter", headerName: "Transportador", width: 160 },
    { field: "shipping_date", headerName: "Data de Envio", width: 130 },
    {
      field: "situation",
      headerName: "Situação",
      width: 130,
      renderCell: (params) => {
        const value = params.value as string;
        let color = "";
        if (value === "Atrasada") color = "#E74C3C";
        if (value === "Entregue") color = "#34D399";
        if (value === "No Prazo") color = "#3B82F6";
        return <span style={{ color, fontWeight: "bold" }}>{value}</span>;
      },
    },
    {
      field: "delivery_forecast",
      headerName: "Previsão de entrega",
      width: 150,
    },
    { field: "delivery_date", headerName: "Data da entrega", width: 130 },
    {
      field: "actions",
      headerName: "Ações",
      width: 170,
      renderCell: (params) => {
        const row = params.row as MerchandiseUIData;
        const carrierTrackingUrl = carriers.find((c) => c.value === row.transporter)?.trackingUrl;
        return (
          <div className="flex h-full gap-3 items-center">
            <button
              title={row.flagged ? "Remover alerta" : "Marcar em atenção"}
              onClick={(e) => {
                e.stopPropagation();
                handleToggleFlag(row);
              }}
              style={{ color: row.flagged ? "#EF4444" : "#D1D5DB" }}
            >
              <Flag size={18} fill={row.flagged ? "#EF4444" : "none"} />
            </button>
            {carrierTrackingUrl ? (
              <a
                href={carrierTrackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir página de rastreio"
                className="text-blue-400 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={18} />
              </a>
            ) : (
              <span style={{ width: 18 }} />
            )}
            <button
              className="text-text_description"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.id as string);
              }}
            >
              <Trash2 />
            </button>
            <button
              className="text-text_description"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(params.row);
              }}
            >
              <Pencil />
            </button>
          </div>
        );
      },
    },
  ];

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleEdit(item: MerchandiseUIData) {
    setEditItem(item);
    setClientSearch("");
    setVisibleForm(true);

    setTrackingCodes(item.trackingCodes ?? []);
    setTrackingInput("");

    const found = clients.find((c) => c.id === item.clientId);
    if (found) {
      setSelectedClient(found);
    } else {
      setSelectedClient({
        id: item.clientId ?? "",
        code: item.clientCode ?? "",
        cnpj: "",
        name: item.name,
        city: item.city,
        state: item.uf,
      });
    }

    const parseDateForInput = (dateStr?: string) => {
      if (!dateStr) return "";
      return dayjs(dateStr, "DD/MM/YYYY", true).format("YYYY-MM-DD");
    };

    reset({
      name: item.name,
      document_number: item.document_number,
      city: item.city,
      uf: item.uf,
      transporter: item.transporter,
      shipping_date: parseDateForInput(item.shipping_date),
      delivery_forecast: parseDateForInput(item.delivery_forecast),
      delivery_date: parseDateForInput(item.delivery_date),
      notes: item.notes ?? "",
    });
  }

  function handleAddTracking() {
    const code = trackingInput.trim().toUpperCase();
    if (!code || trackingCodes.includes(code)) return;
    setTrackingCodes((prev) => [...prev, code]);
    setTrackingInput("");
  }

  async function handleRemoveTracking(code: string) {
    const confirmed = await confirm(`Remover o código de rastreio "${code}"?`);
    if (confirmed) setTrackingCodes((prev) => prev.filter((c) => c !== code));
  }

  async function handleToggleFlag(item: MerchandiseUIData) {
    const newValue = !item.flagged;
    try {
      await updateDoc(
        doc(db, "companies", companyId, "goods_shipped", item.id),
        { flagged: newValue }
      );
      setData((prev) =>
        prev.map((d) => (d.id === item.id ? { ...d, flagged: newValue } : d))
      );
    } catch {
      notify.error("Erro ao atualizar alerta.");
    }
  }

  async function handleDelete(id: string) {
    try {
      const confirmed = await confirm("Deseja deletar este registro?");
      if (confirmed) {
        await deleteDoc(doc(db, "companies", companyId, "goods_shipped", id));
        notify.success("Registro deletado com sucesso!");
        await getAllDocuments();
      }
    } catch {
      notify.error("Erro ao deletar o registro.");
    }
  }

  async function getAllDocuments() {
    if (!companyId) return;
    setTableIsLoading(true);
    try {
      const q = query(
        collection(db, "companies", companyId, "goods_shipped"),
        orderBy("created_at", "desc")
      );
      const snapshot = await getDocs(q);
      const docs = snapshot.docs.map((doc) => {
        const data = doc.data() as MerchandiseFirestoreData;
        const deliveryDate = data.delivery_date ? data.delivery_date.toDate() : null;
        const deliveryForecast = data.delivery_forecast.toDate();
        return {
          id: doc.id,
          ...data,
          shipping_date: dayjs(data.shipping_date.toDate()).format("DD/MM/YYYY"),
          delivery_forecast: dayjs(data.delivery_forecast.toDate()).format("DD/MM/YYYY"),
          delivery_date: data.delivery_date
            ? dayjs(data.delivery_date.toDate()).format("DD/MM/YYYY")
            : "",
          created_at: dayjs(data.created_at.toDate()).format("DD/MM/YYYY"),
          notes: data.notes ?? "",
          notesHistory: data.notesHistory ?? [],
          situation: calculateSituation(deliveryDate, deliveryForecast),
        };
      });
      setData(docs);
    } catch {
      notify.error("Erro ao carregar os registros.");
    } finally {
      setTableIsLoading(false);
    }
  }

  function calculateSituation(deliveryDate: Date | null, deliveryForecast: Date): string {
    const today = dayjs().startOf("day");
    if (deliveryDate) return "Entregue";
    if (today.isAfter(dayjs(deliveryForecast))) return "Atrasada";
    return "No Prazo";
  }

  useEffect(() => {
    getAllDocuments();
  }, [companyId]);

  async function onSubmit(formData: MerchandiseFormData) {
    if (!selectedClient) {
      notify.error("Selecione um cliente do cadastro antes de salvar.");
      return;
    }
    const shippingDate = dayjs(formData.shipping_date).startOf("day").toDate();
    const deliveryForecast = isPickup
      ? shippingDate
      : dayjs(formData.delivery_forecast).startOf("day").toDate();
    const deliveryDate = formData.delivery_date
      ? dayjs(formData.delivery_date).startOf("day").toDate()
      : null;

    const pendingCode = trackingInput.trim().toUpperCase();
    const finalTrackingCodes = pendingCode && !trackingCodes.includes(pendingCode)
      ? [...trackingCodes, pendingCode]
      : trackingCodes;

    const { notes, ...restFormData } = formData;

    const basePayload = {
      ...restFormData,
      name: selectedClient.name,
      city: selectedClient.city,
      uf: selectedClient.state,
      shipping_date: Timestamp.fromDate(shippingDate),
      delivery_forecast: Timestamp.fromDate(deliveryForecast),
      delivery_date: deliveryDate ? Timestamp.fromDate(deliveryDate) : null,
      clientId: selectedClient.id,
      clientCode: selectedClient.code,
      trackingCodes: finalTrackingCodes,
    };

    try {
      const confirmed = await confirm(
        editItem ? "Deseja salvar as alterações?" : "Tem certeza que deseja cadastrar essa mercadoria?"
      );
      if (!confirmed) return;

      if (editItem) {
        const ref = doc(db, "companies", companyId, "goods_shipped", editItem.id);
        await updateDoc(ref, basePayload);
        notify.success("Registro atualizado com sucesso!");
      } else {
        const initialNote = notes?.trim();
        const now = Timestamp.now();
        const notesHistory: NoteEntry[] = initialNote
          ? [{ id: crypto.randomUUID(), text: initialNote, createdAt: now }]
          : [];
        await addDoc(collection(db, "companies", companyId, "goods_shipped"), {
          ...basePayload,
          notesHistory,
          created_at: now,
        });
        notify.success("Cadastrado com sucesso!");
      }

      setEditItem(null);
      setSelectedClient(null);
      setClientSearch("");
      setTrackingCodes([]);
      setTrackingInput("");
      reset(defaultFormValues);
      setVisibleForm(false);
      await getAllDocuments();
    } catch {
      notify.error("Erro ao salvar registro.");
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div>
      <div className="flex justify-between text-center items-center mb-8">
        <h2 className="text-2xl text-color_primary_400 font-bold">
          Lista de mercadorias enviadas
        </h2>
        <Button
          type="button"
          text={visibleForm ? "Fechar" : "Cadastrar nova +"}
          onClick={() => {
            if (visibleForm) {
              setEditItem(null);
              setSelectedClient(null);
              setClientSearch("");
              reset(defaultFormValues);
            }
            setVisibleForm((prev) => !prev);
          }}
        />
        {dialog}
      </div>

      {visibleForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 my-8">

          {/* ── Busca de cliente ─────────────────────────────────────────── */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Selecione o cliente do cadastro
            </p>

            {selectedClient ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <span className="text-sm font-semibold text-blue-800">
                    {selectedClient.name}
                  </span>
                  {selectedClient.cnpj && (
                    <span className="text-xs text-blue-500">
                      {selectedClient.cnpj}
                    </span>
                  )}
                  <span className="text-xs text-blue-400">
                    {selectedClient.city} / {selectedClient.state}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleClearClient}
                  className="text-gray-400 hover:text-gray-600 flex items-center gap-1 text-xs"
                >
                  <X size={14} /> limpar
                </button>
              </div>
            ) : (
              <div ref={clientSearchRef} className="relative max-w-md">
                <div className="flex items-center border border-gray-300 rounded-lg bg-white px-3 gap-2 focus-within:ring-1 focus-within:ring-color_primary_400 focus-within:border-color_primary_400">
                  <Search size={15} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setShowClientResults(true);
                    }}
                    onFocus={() => setShowClientResults(true)}
                    placeholder="Buscar por nome ou CNPJ/CPF..."
                    className="flex-1 py-2 text-sm bg-transparent outline-none"
                  />
                  {clientSearch && (
                    <button
                      type="button"
                      onClick={() => { setClientSearch(""); setShowClientResults(false); }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {showClientResults && clientSearchResults.length > 0 && (
                  <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {clientSearchResults.map((client) => (
                      <li
                        key={client.id}
                        onMouseDown={() => handleSelectClient(client)}
                        className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      >
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {client.name}
                          </span>
                          {client.cnpj && (
                            <span className="text-xs text-gray-400 ml-2">
                              {client.cnpj}
                            </span>
                          )}
                          <p className="text-xs text-gray-400 mt-0.5">
                            {client.city} / {client.state}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

                {showClientResults && trimmed.length >= 1 && clientSearchResults.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3">
                    <p className="text-sm text-gray-400">
                      Nenhum cliente encontrado para "{clientSearch}".
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Campos do formulário ────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
            <Input
              id="name"
              type="text"
              labelName="Nome do Cliente"
              labelId="name"
              {...register("name")}
              disabled
              errorMessage={errors.name?.message}
            />
            <Input
              id="document_number"
              labelName="Documento / Nota Fiscal"
              labelId="document_number"
              {...register("document_number")}
              errorMessage={errors.document_number?.message}
            />
            <Input
              id="city"
              type="text"
              labelName="Cidade"
              labelId="city"
              {...register("city")}
              disabled
              errorMessage={errors.city?.message}
            />
            <InputSelect
              id="uf"
              labelName="UF"
              labelId="uf"
              options={BRAZILIAN_STATES}
              {...register("uf")}
              disabled
            />
            <InputSelect
              id="carrier"
              labelName="Transportadora"
              labelId="carrier"
              options={
                carriers.length > 0
                  ? [{ value: "", label: "Selecione..." }, ...carriers]
                  : [{ value: "", label: "Nenhuma transportadora cadastrada" }]
              }
              {...register("transporter")}
            />
            <Input
              id="shipping_date"
              type="date"
              labelName="Data do envio"
              labelId="shipping_date"
              {...register("shipping_date")}
              errorMessage={errors.shipping_date?.message}
            />

            {!isPickup && (
              <Input
                id="delivery_forecast"
                type="date"
                labelName="Previsão de Entrega"
                labelId="delivery_forecast"
                {...register("delivery_forecast")}
                errorMessage={errors.delivery_forecast?.message}
              />
            )}

            <Input
              id="delivery_date"
              type="date"
              labelName={isPickup ? "Data da Entrega (Retirada)" : "Data da Entrega"}
              labelId="delivery_date"
              {...register("delivery_date")}
              errorMessage={errors.delivery_date?.message}
            />

            {!editItem && (
              <Input
                id="notes"
                type="text"
                labelName="Observação inicial (opcional)"
                labelId="notes"
                {...register("notes")}
                errorMessage={errors.notes?.message}
              />
            )}
          </div>

          {/* ── Códigos de rastreio ──────────────────────────────────────── */}
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Códigos de rastreio{" "}
              <span className="text-xs font-normal text-gray-400">(opcional)</span>
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTracking();
                  }
                }}
                placeholder="Ex: AA123456789BR"
                className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 font-mono focus:outline-none focus:ring-1 focus:ring-color_info"
              />
              <button
                type="button"
                onClick={handleAddTracking}
                className="px-4 py-2 text-sm bg-color_info text-white rounded-md hover:opacity-90 flex-shrink-0"
              >
                Adicionar
              </button>
            </div>
            {trackingCodes.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {trackingCodes.map((code) => (
                  <span
                    key={code}
                    className="flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-mono px-3 py-1 rounded-full"
                  >
                    {code}
                    <button
                      type="button"
                      onClick={() => handleRemoveTracking(code)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="w-52 flex gap-4">
            <Button text={editItem ? "Atualizar" : "Salvar"} type="submit" />
            <Button
              onClick={() => {
                reset(defaultFormValues);
                setSelectedClient(null);
                setClientSearch("");
                setTrackingCodes([]);
                setTrackingInput("");
              }}
              backgroundColor="#F5F7FA"
              color="#555555"
              borderColor="#E0E0E0"
              text="Limpar"
            />
          </div>
          {editItem && (
            <Button
              text="Cancelar edição"
              onClick={() => {
                setEditItem(null);
                setSelectedClient(null);
                setClientSearch("");
                setTrackingCodes([]);
                setTrackingInput("");
                setVisibleForm(false);
                reset(defaultFormValues);
              }}
              backgroundColor="transparent"
              color="#555555"
              borderColor="#E0E0E0"
            />
          )}
        </form>
      )}

      {/* ── Tabela ─────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <CustomDataGrid
          columns={columns}
          rows={data}
          localeText={ptBR.components.MuiDataGrid.defaultProps.localeText}
          loading={tableIsLoading}
          initialState={{
            pagination: { paginationModel },
            filter: initialSituation
              ? {
                  filterModel: {
                    items: [
                      {
                        field: "situation",
                        operator: "equals",
                        value: initialSituation,
                      },
                    ],
                  },
                }
              : undefined,
          }}
          pageSizeOptions={[10, 20, 30]}
          showToolbar
          getRowClassName={(params) =>
            (params.row as MerchandiseUIData).flagged ? "row-flagged" : ""
          }
          onRowClick={(params) => setDetailItem(params.row as MerchandiseUIData)}
          sx={{
            cursor: "pointer",
            "& .row-flagged": {
              backgroundColor: "#FEF2F2",
              borderLeft: "3px solid #EF4444",
            },
            "& .row-flagged:hover": {
              backgroundColor: "#FEE2E2 !important",
            },
            "& .MuiDataGrid-columnHeaderTitle": {
              color: "#1A2A38",
              fontWeight: "bold",
            },
            "& .MuiDataGrid-cell:focus-within": {
              outline: "none",
              boxShadow: "none",
            },
          }}
        />
      </div>

      {/* ── Modal de detalhe ───────────────────────────────────────────────── */}
      <Dialog
        open={!!detailItem}
        onClose={() => { setDetailItem(null); setNewNoteText(""); }}
        maxWidth="sm"
        fullWidth
      >
        {detailItem && (
          <>
            <DialogTitle sx={{ pb: 1 }}>
              <span className="font-bold text-color_primary_400">
                {detailItem.name}
              </span>
              <p className="text-sm font-normal text-gray-500 mt-1">
                NF {detailItem.document_number} · {detailItem.city}/{detailItem.uf} · Envio: {detailItem.shipping_date}
              </p>
            </DialogTitle>

            <DialogContent dividers>
              {/* Códigos de rastreio */}
              {detailItem.trackingCodes && detailItem.trackingCodes.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                    Códigos de Rastreio
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {detailItem.trackingCodes.map((code) => (
                      <span
                        key={code}
                        className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-sm font-mono px-3 py-1 rounded-full"
                      >
                        {code}
                        <button
                          onClick={() => handleCopyCode(code)}
                          title="Copiar código"
                          className="text-gray-400 hover:text-color_info transition-colors"
                        >
                          {copiedCode === code
                            ? <Check size={13} className="text-green-500" />
                            : <Copy size={13} />
                          }
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Histórico de observações */}
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Histórico de Observações
              </p>

              {detailItem.notesHistory.length === 0 && !detailItem.notes ? (
                <p className="text-sm text-gray-400 italic mb-4">
                  Nenhuma observação registrada.
                </p>
              ) : (
                <div className="flex flex-col gap-2 mb-4">
                  {[...detailItem.notesHistory].reverse().map((entry) => (
                    <div key={entry.id} className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-xs text-gray-400 mb-1">
                        {dayjs(entry.createdAt.toDate()).format("DD/MM/YYYY [às] HH:mm")}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{entry.text}</p>
                    </div>
                  ))}
                  {/* Nota legada (campo notes antigo) */}
                  {detailItem.notesHistory.length === 0 && detailItem.notes && (
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{detailItem.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Adicionar nova observação */}
              <div className="border-t pt-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Nova Observação
                </p>
                <textarea
                  className="w-full border border-gray-300 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-color_primary_400"
                  rows={3}
                  placeholder="Descreva o que aconteceu..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                />
              </div>
            </DialogContent>

            <DialogActions>
              <MuiButton
                onClick={() => { setDetailItem(null); setNewNoteText(""); }}
                sx={{ color: "#555" }}
              >
                Fechar
              </MuiButton>
              <MuiButton
                onClick={handleAddNote}
                disabled={addingNote || !newNoteText.trim()}
                variant="contained"
                sx={{ backgroundColor: "#34D399", "&:hover": { backgroundColor: "#45c596" } }}
              >
                {addingNote ? "Salvando..." : "Adicionar"}
              </MuiButton>
            </DialogActions>
          </>
        )}
      </Dialog>
    </div>
  );
}
