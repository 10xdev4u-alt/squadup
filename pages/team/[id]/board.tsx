// ============================================================================
// Kanban board — the M2 workspace heart (§4B, §9). Five columns matching the
// tasks.status select: Idea -> PPT Draft -> Prototype -> Testing -> Final
// Pitch. Pointer drag via dnd-kit (spec §13); every card also carries an
// accessible "Move to <column>" control so keyboard/AT users (and tests)
// can move cards without dragging. Realtime sync, deduped by task id.
// ============================================================================

import Link from "next/link";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import Layout from "@/components/Layout";
import { Badge } from "@/components/ui/badge";
import { useRequireAuth } from "@/lib/use-require-auth";
import { api, getApiErrorMessage } from "@/lib/api";
import type { Task, TaskPriority, TaskStatus } from "@/types/squadup";

const COLUMNS: { status: TaskStatus; label: string }[] = [
  { status: "idea", label: "Idea" },
  { status: "ppt_draft", label: "PPT Draft" },
  { status: "prototype", label: "Prototype" },
  { status: "testing", label: "Testing" },
  { status: "final_pitch", label: "Final Pitch" },
];

function priorityClass(priority: TaskPriority): string {
  if (priority === "high") return "bg-destructive/10 text-destructive";
  if (priority === "medium") return "bg-amber-500/10 text-amber-600";
  return "bg-muted text-muted-foreground";
}

function KanbanCard({
  task,
  onMove,
}: {
  task: Task;
  onMove: (status: TaskStatus) => void;
}) {
  return (
    <article className="rounded-control border border-border bg-background p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-medium leading-snug">{task.title}</h3>
        <Badge
          variant="secondary"
          className={priorityClass(task.priority)}
        >
          {task.priority}
        </Badge>
      </div>
      {task.description && (
        <p className="mt-1 text-xs text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-2 flex flex-wrap gap-1">
        {COLUMNS.filter((c) => c.status !== task.status).map((c) => (
          <button
            key={c.status}
            type="button"
            onClick={() => onMove(c.status)}
            aria-label={`Move "${task.title}" to ${c.label}`}
            className="rounded border border-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            Move to {c.label}
          </button>
        ))}
      </div>
    </article>
  );
}

function Column({
  status,
  label,
  tasks,
  onMove,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  onMove: (taskId: string, status: TaskStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <section
      ref={setNodeRef}
      aria-labelledby={`col-${status}`}
      className={`flex min-h-[16rem] flex-col rounded-card border bg-card/50 p-3 transition-colors ${
        isOver ? "border-primary/60" : "border-border"
      }`}
    >
      <h2
        id={`col-${status}`}
        className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
      >
        {label} <span className="ml-1 text-foreground/60">({tasks.length})</span>
      </h2>
      <div className="flex flex-1 flex-col gap-2">
        {tasks.map((task) => (
          <KanbanCard
            key={task.id}
            task={task}
            onMove={(next) => onMove(task.id, next)}
          />
        ))}
        {tasks.length === 0 && (
          <p className="rounded-control border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            No cards
          </p>
        )}
      </div>
    </section>
  );
}

export default function KanbanBoardPage() {
  useRequireAuth();
  const router = useRouter();
  const teamId = String(router.query.id ?? "");

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor));

  const load = useCallback(async () => {
    try {
      setTasks(await api().tasks.fetchTasks(teamId));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    load();
  }, [teamId, load]);

  useEffect(() => {
    if (!teamId) return;
    const unsub = api().tasks.subscribeTasks(teamId, (task) =>
      setTasks((prev) => {
        const exists = prev.some((t) => t.id === task.id);
        return exists
          ? prev.map((t) => (t.id === task.id ? task : t))
          : [...prev, task];
      })
    );
    // realtime is best-effort; the board still works on fetch + manual moves
    unsub.catch(() => {});
    return () => {
      unsub.then((fn) => fn()).catch(() => {});
    };
  }, [teamId]);

  async function handleMove(taskId: string, status: TaskStatus) {
    try {
      const updated = await api().tasks.updateTaskStatus(taskId, status);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? updated : t))
      );
    } catch (err) {
      setError(getApiErrorMessage(err));
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const taskId = String(event.active.id);
    const next = event.over?.id as TaskStatus | undefined;
    if (!next || next === event.active.id) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === next) return;
    void handleMove(taskId, next);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const created = await api().tasks.createTask(teamId, {
        title: title.trim(),
        description: "",
        priority,
      });
      setTasks((prev) => [...prev, created]);
      setTitle("");
      setPriority("medium");
    } catch (err) {
      setFormError(getApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (error && tasks.length === 0) {
    return (
      <Layout>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h1 className="text-2xl font-semibold">Couldn&apos;t load this board</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <Link
            href={`/team/${teamId}`}
            className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl px-6 py-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Team Workspace
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Kanban Board
            </h1>
          </div>
          <Link
            href={`/team/${teamId}`}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Back to dashboard
          </Link>
        </header>

        <form
          onSubmit={handleCreate}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-card border border-border bg-card p-4"
        >
          <label className="flex flex-1 flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Task title
            </span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Wire the swipe deck"
              className="rounded-control border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-xs font-medium text-muted-foreground">
              Priority
            </span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="rounded-control border border-border bg-background px-3 py-2 focus:border-primary focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <button
            type="submit"
            disabled={saving || !title.trim()}
            className="rounded-control bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Add Task
          </button>
          {formError && (
            <p className="w-full text-xs text-destructive">{formError}</p>
          )}
        </form>

        {loading ? (
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
            {COLUMNS.map((c) => (
              <div key={c.status} className="h-56 animate-pulse rounded-card bg-muted" />
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
              {COLUMNS.map((column) => (
                <Column
                  key={column.status}
                  status={column.status}
                  label={column.label}
                  tasks={tasks.filter((t) => t.status === column.status)}
                  onMove={handleMove}
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </Layout>
  );
}
