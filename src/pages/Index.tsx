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
      const updatedColumns = [...prev];
      const columnIndex = updatedColumns.findIndex((c) => c.id === taskData.columnId);

      if (columnIndex === -1) return prev;

      if (taskData.id) {
        // Editing existing task
        const taskIndex = updatedColumns[columnIndex].tasks.findIndex(
          (t) => t.id === taskData.id
        );
        if (taskIndex !== -1) {
          updatedColumns[columnIndex].tasks[taskIndex] = {
            ...updatedColumns[columnIndex].tasks[taskIndex],
            ...taskData,
          } as Task;
        }
      } else {
        // Creating new task
        const newTask: Task = {
          id: Date.now().toString(),
          title: taskData.title,
          description: taskData.description,
          tags: taskData.tags,
          columnId: taskData.columnId,
          order: updatedColumns[columnIndex].tasks.length,
        };
        updatedColumns[columnIndex].tasks.push(newTask);
      }

      return updatedColumns;
    });

    toast({
      title: taskData.id ? "Tarefa atualizada" : "Tarefa criada",
      description: taskData.id
        ? "A tarefa foi atualizada com sucesso."
        : "Uma nova tarefa foi adicionada.",
    });
  };

  const handleDeleteTask = (taskId: string) => {
    setColumns((prev) =>
      prev.map((col) => ({
        ...col,
        tasks: col.tasks.filter((t) => t.id !== taskId),
      }))
    );

    toast({
      title: "Tarefa excluída",
      description: "A tarefa foi removida com sucesso.",
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
        prev.map((col) => (col.id === columnId ? { ...col, title } : col))
      );
      toast({
        title: "Coluna atualizada",
        description: "O nome da coluna foi atualizado.",
      });
    } else {
      const newColumn: Column = {
        id: Date.now().toString(),
        title,
        order: columns.length,
        tasks: [],
      };
      setColumns([...columns, newColumn]);
      toast({
        title: "Coluna criada",
        description: "Uma nova coluna foi adicionada.",
      });
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    if (column && column.tasks.length > 0) {
      toast({
        title: "Não é possível excluir",
        description: "Remova todas as tarefas antes de excluir a coluna.",
        variant: "destructive",
      });
      return;
    }

    setColumns((prev) => prev.filter((col) => col.id !== columnId));
    toast({
      title: "Coluna excluída",
      description: "A coluna foi removida com sucesso.",
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeTaskId = active.id as string;
    const overColumnId = over.id as string;

    setColumns((prev) => {
      const sourceColumn = prev.find((col) =>
        col.tasks.some((t) => t.id === activeTaskId)
      );
      const targetColumn = prev.find((col) => col.id === overColumnId);

      if (!sourceColumn || !targetColumn) return prev;

      const task = sourceColumn.tasks.find((t) => t.id === activeTaskId);
      if (!task) return prev;

      // Remove from source
      const newSourceTasks = sourceColumn.tasks.filter((t) => t.id !== activeTaskId);
      
      // Add to target
      const updatedTask = { ...task, columnId: overColumnId };
      const newTargetTasks =
        sourceColumn.id === targetColumn.id
          ? arrayMove(
              sourceColumn.tasks,
              sourceColumn.tasks.findIndex((t) => t.id === activeTaskId),
              targetColumn.tasks.findIndex((t) => t.id === over.id)
            )
          : [...targetColumn.tasks, updatedTask];

      return prev.map((col) => {
        if (col.id === sourceColumn.id && sourceColumn.id !== targetColumn.id) {
          return { ...col, tasks: newSourceTasks };
        }
        if (col.id === targetColumn.id) {
          return { ...col, tasks: newTargetTasks };
        }
        return col;
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
