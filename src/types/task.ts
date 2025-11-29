export type TagColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'gray';

export interface Tag {
  id: string;
  label: string;
  color: TagColor;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  tags: Tag[];
  columnId: string;
  order: number;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  tasks: Task[];
}
