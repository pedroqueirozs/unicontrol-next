import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  Button,
} from "@mui/material";

let resolveCallback: (value: boolean) => void;

export function useConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const confirm = (msg: string) => {
    setMessage(msg);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveCallback = resolve;
    });
  };

  const handleClose = (result: boolean) => {
    setOpen(false);
    resolveCallback(result);
  };

  const dialog = (
    <Dialog open={open} onClose={() => handleClose(false)}>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button
          sx={{
            color: "#E74C3C",
          }}
          onClick={() => handleClose(false)}
        >
          Cancelar
        </Button>
        <Button
          sx={{
            backgroundColor: "#34D399",
            "&:hover": {
              backgroundColor: "#45c596",
            },
          }}
          onClick={() => handleClose(true)}
          variant="contained"
        >
          Confirmar
        </Button>
      </DialogActions>
    </Dialog>
  );

  return { confirm, dialog };
}
