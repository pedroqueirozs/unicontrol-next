import { useEffect, useState } from "react";
import { Menu, User } from "lucide-react";
import { auth } from "@/services/firebaseConfig";
import { useConfirmDialog } from "@/components/ConfimDialog";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export function Header({ title, onMenuClick }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const { confirm, dialog } = useConfirmDialog();

  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  async function handleSignout() {
    const confirmed = await confirm("Realmente deseja sair ?");
    if (confirmed) {
      signOut(auth);
      setOpen(false);
      navigate("/");
    }
  }

  return (
    <div className="flex w-full justify-between items-center h-20 p-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-text_primary_400"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-text_primary_400 font-bold text-xl uppercase">
          {title}
        </h1>
      </div>
      <div className="flex gap-4 justify-center items-center  ">
        <span className="hidden md:inline">Bem vindo, {auth?.currentUser?.displayName?.split(" ")[0]}</span>

        <div className="flex items-center justify-center">
          <button
            data-cy="user-avatar"
            onClick={() => setOpen((prev) => !prev)}
          >
            {auth?.currentUser?.photoURL ? (
              <img
                alt="Avatar do usuário"
                className="w-16 h-16 rounded-full object-cover"
                src={auth?.currentUser?.photoURL}
              />
            ) : (
              <User className="bg-background_primary_400 size-11 text-white p-2 rounded-full" />
            )}
          </button>
        </div>

        {open && (
          <>
            {/* overlay invisível — fecha o dropdown ao clicar fora */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <div className="absolute right-0 top-16 w-48 bg-background_white shadow-lg rounded-xl py-2 z-50">
            <button
              onClick={() => {
                navigate("/profile");
                setOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:opacity-70"
            >
              Meu Perfil
            </button>
            <button
              onClick={handleSignout}
              className="block w-full text-left px-4 py-2 hover:opacity-70"
            >
              Sair
            </button>
            {dialog}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
