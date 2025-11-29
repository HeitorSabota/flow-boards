import { useState, useEffect } from "react";
import { Column } from "@/types/task";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ColumnDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  column?: Column;
  onSave: (title: string, columnId?: string) => void;
}

export const ColumnDialog = ({
  open,
  onOpenChange,
  column,
  onSave,
}: ColumnDialogProps) => {
  const [title, setTitle] = useState("");

  useEffect(() => {
    if (column) {
      setTitle(column.title);
    } else {
      setTitle("");
    }
  }, [column, open]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave(title.trim(), column?.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>
            {column ? "Editar coluna" : "Nova coluna"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="column-title">Nome da coluna</Label>
            <Input
              id="column-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: A Fazer, Em Progresso, Concluído"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {column ? "Salvar" : "Criar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
