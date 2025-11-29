import { useState, useEffect } from "react";
import { Column, Task } from "@/types/task";
import { TaskColumn } from "@/components/TaskColumn";
import { TaskDialog } from "@/components/TaskDialog";
import { ColumnDialog } from "@/components/ColumnDialog";
import { Button } from "@/components/ui/button";
import { Plus, Kanban } from "lucide-react";
import { DndContext, DragEndEvent, closestCorners } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "task-manager-data";

const defaultColumns: Column[] = [
  { id: "1", title: "A Fazer", order: 0, tasks: [] },
  { id: "2", title: "Em Progresso", order: 1, tasks: [] },
  { id: "3", title: "Concluído", order: 2, tasks: [] },
];

const Index = () => {
  const [columns, setColumns] = useState<Column[]>(defaultColumns);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>();
  const [editingColumn, setEditingColumn] = useState<Column | undefined>();
  const [activeColumnId, setActiveColumnId] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setColumns(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(columns));
  }, [columns]);

  const handleAddTask = (columnId: string) => {
    setActiveColumnId(columnId);
    setEditingTask(undefined);
    setTaskDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setActiveColumnId(task.columnId);
    setTaskDialogOpen(true);
  };

  const handleSaveTask = (taskData: Omit<Task, "id" | "order"> & { id?: string }) => {
    setColumns((prev) => {
      const updated = [...prev];
      const colIndex = updated.findIndex((c) => c.id === taskData.columnId);
      if (colIndex === -1) return prev;

      if (taskData.id) {
        // EDITAR
        const tIndex = updated[colIndex].tasks.findIndex((t) => t.id === taskData.id);
        if (tIndex !== -1) {
          updated[colIndex].tasks[tIndex] = {
            ...updated[colIndex].tasks[tIndex],
            ...taskData,
          };
        }
      } else {
        // CRIAR
        updated[colIndex].tasks.push({
          id: Date.now().toString(),
          title: taskData.title,
          description: taskData.description,
          tags: taskData.tags,
          columnId: taskData.columnId,
          order: updated[colIndex].tasks.length,
        });
      }

      return updated;
    });

    toast({
      title: taskData.id ? "Tarefa atualizada" : "Tarefa criada",
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setColumns((prev) =>
      prev.map((c) => ({
        ...c,
        tasks: c.tasks.filter((t) => t.id !== taskId),
      }))
    );

    toast({
      title: "Tarefa removida",
      description: "A tarefa foi excluída.",
    });
  };

  const handleAddColumn = () => {
    setEditingColumn(undefined);
    setColumnDialogOpen(true);
  };

  const handleEditColumn = (column: Column) => {
    setEditingColumn(column);
    setColumnDialogOpen(true);
  };

  const handleSaveColumn = (title: string, columnId?: string) => {
    if (columnId) {
      setColumns((prev) =>
        prev.map((c) => (c.id === columnId ? { ...c, title } : c))
      );
      toast({ title: "Coluna atualizada" });
    } else {
      const newColumn: Column = {
        id: Date.now().toString(),
        title,
        order: columns.length,
        tasks: [],
      };
      setColumns([...columns, newColumn]);
      toast({ title: "Coluna criada" });
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (!column) return;

    if (column.tasks.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: "Remova todas as tarefas antes.",
        variant: "destructive",
      });
      return;
    }

    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    toast({ title: "Coluna removida" });
  };

  // DRAG & DROP FINAL (VERSÃO FUNCIONAL)
  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    setColumns((prev) => {
      const sourceColumn = prev.find((c) => c.tasks.some((t) => t.id === activeId));
      const targetColumn =
        prev.find((c) => c.tasks.some((t) => t.id === overId)) ||
        prev.find((c) => c.id === overId);

      if (!sourceColumn || !targetColumn) return prev;

      const activeTask = sourceColumn.tasks.find((t) => t.id === activeId);
      if (!activeTask) return prev;

      const sourceTasks = sourceColumn.tasks.filter((t) => t.id !== activeId);

      const targetIndex = targetColumn.tasks.findIndex((t) => t.id === overId);

      let newTargetTasks;

      // MESMA COLUNA
      if (sourceColumn.id === targetColumn.id) {
        const oldIndex = sourceColumn.tasks.findIndex((t) => t.id === activeId);
        const newIndex = targetIndex === -1 ? sourceColumn.tasks.length : targetIndex;

        const moved = arrayMove(sourceColumn.tasks, oldIndex, newIndex);
        newTargetTasks = moved;
      }
      // COLUNA DIFERENTE
      else {
        const updatedTask = { ...activeTask, columnId: targetColumn.id };

        if (targetIndex === -1) {
          newTargetTasks = [...targetColumn.tasks, updatedTask];
        } else {
          newTargetTasks = [
            ...targetColumn.tasks.slice(0, targetIndex),
            updatedTask,
            ...targetColumn.tasks.slice(targetIndex),
          ];
        }
      }

      const normalize = (tasks: Task[]) =>
        tasks.map((t, i) => ({ ...t, order: i }));

      return prev.map((c) => {
        if (c.id === sourceColumn.id)
          return { ...c, tasks: normalize(sourceTasks) };

        if (c.id === targetColumn.id)
          return { ...c, tasks: normalize(newTargetTasks) };

        return c;
      });
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <Kanban className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Task Manager</h1>
          </div>
          <Button onClick={handleAddColumn} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nova Coluna
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4">
            {columns
              .sort((a, b) => a.order - b.order)
              .map((column) => (
                <TaskColumn
                  key={column.id}
                  column={column}
                  onAddTask={handleAddTask}
                  onEditTask={handleEditTask}
                  onDeleteTask={handleDeleteTask}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                />
              ))}
          </div>
        </DndContext>
      </main>

      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        task={editingTask}
        columnId={activeColumnId}
        onSave={handleSaveTask}
      />

      <ColumnDialog
        open={columnDialogOpen}
        onOpenChange={setColumnDialogOpen}
        column={editingColumn}
        onSave={handleSaveColumn}
      />
    </div>
  );
};

export default Index;

