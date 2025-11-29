import { useState, useEffect } from "react";
import { Task, Tag, TagColor } from "@/types/task";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { TaskTag } from "./TaskTag";
import { Plus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task?: Task;
  columnId: string;
  onSave: (task: Omit<Task, "order">) => void;
}

const TAG_COLORS: { value: TagColor; label: string }[] = [
  { value: "red", label: "Vermelho" },
  { value: "orange", label: "Laranja" },
  { value: "yellow", label: "Amarelo" },
  { value: "green", label: "Verde" },
  { value: "blue", label: "Azul" },
  { value: "purple", label: "Roxo" },
  { value: "pink", label: "Rosa" },
  { value: "gray", label: "Cinza" },
];

export const TaskDialog = ({
  open,
  onOpenChange,
  task,
  columnId,
  onSave,
}: TaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState<TagColor>("blue");

  // 🔥 Preenche a tarefa quando abre o modal
  useEffect(() => {
    if (open) {
      setTitle(task?.title ?? "");
      setDescription(task?.description ?? "");
      setTags(task?.tags ?? []);
    }
  }, [open, task]);

  const handleAddTag = () => {
    if (!newTagLabel.trim()) return;

    const newTag: Tag = {
      id: Date.now().toString(),
      label: newTagLabel.trim(),
      color: newTagColor,
    };

    setTags((prev) => [...prev, newTag]);
    setNewTagLabel("");
    setNewTagColor("blue");
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      id: task?.id,
      title: title.trim(),
      description: description.trim(),
      tags,
      columnId,
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{task ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Nome da tarefa"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione mais detalhes..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Etiquetas</Label>

            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <TaskTag
                    key={tag.id}
                    tag={tag}
                    onRemove={() => handleRemoveTag(tag.id)}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                placeholder="Nova etiqueta"
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              />

              <Select
                value={newTagColor}
                onValueChange={(value) => setNewTagColor(value as TagColor)}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_COLORS.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full bg-tag-${color.value}`}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button type="button" size="icon" variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>{task ? "Salvar" : "Criar"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

