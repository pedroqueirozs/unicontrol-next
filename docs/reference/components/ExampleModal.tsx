import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Input from "@/components/Input";
import { Product } from "./types";

const schema = yup.object({
  name: yup.string().required("Nome obrigatório"),
  sku: yup.string().required("Código/SKU obrigatório"),
  unit: yup.string().required("Unidade obrigatória"),
  minStock: yup
    .number()
    .typeError("Deve ser um número")
    .min(0, "Mínimo 0")
    .required("Estoque mínimo obrigatório"),
});

type FormData = yup.InferType<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (data: FormData) => void;
  editItem?: Product | null;
  loading?: boolean;
}

export function ProductModal({ open, onClose, onSave, editItem, loading }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({ resolver: yupResolver(schema) });

  useEffect(() => {
    if (open) {
      if (editItem) {
        reset({
          name: editItem.name,
          sku: editItem.sku,
          unit: editItem.unit,
          minStock: editItem.minStock,
        });
      } else {
        reset({ name: "", sku: "", unit: "un", minStock: 0 });
      }
    }
  }, [open, editItem, reset]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-background_primary_400">
            {editItem ? "Editar Produto" : "Novo Produto"}
          </h2>
        </div>
        <form onSubmit={handleSubmit(onSave)} className="p-6 flex flex-col gap-4">
          <Input
            labelName="Nome do produto"
            labelId="prod-name"
            id="prod-name"
            errorMessage={errors.name?.message}
            {...register("name")}
          />
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                labelName="Código / SKU"
                labelId="prod-sku"
                id="prod-sku"
                errorMessage={errors.sku?.message}
                {...register("sku")}
              />
            </div>
            <div className="w-28">
              <Input
                labelName="Unidade"
                labelId="prod-unit"
                id="prod-unit"
                errorMessage={errors.unit?.message}
                placeholder="un, kg, cx…"
                {...register("unit")}
              />
            </div>
          </div>
          <Input
            labelName="Estoque mínimo"
            labelId="prod-min"
            id="prod-min"
            type="number"
            errorMessage={errors.minStock?.message}
            {...register("minStock")}
          />
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-lg bg-background_primary_400 text-white font-medium hover:opacity-90 transition disabled:opacity-60"
            >
              {loading ? "Salvando…" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
