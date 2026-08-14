// ============================================================================
// Tasks domain module — the workspace kanban (§4B, §8). DTO in, DTO out.
// Only team members can read or move cards: the collection rules scope reads,
// the before-create/update hooks scope writes, and this module sends only
// client-owned fields (status/priority defaults are server-derived).
// Realtime delivery is deduped by task id so reconnects never double-apply.
// ============================================================================

import type { Task, TaskStatus } from "@/types/squadup";
import type { PbClient, UnsubscribeFunc } from "@/lib/api/types";
import { normalizeError } from "@/lib/api/error";
import { pbEscape } from "./filter";

function toTask(record: Record<string, unknown>): Task {
  return {
    id: String(record.id),
    team: String(record.team),
    title: String(record.title),
    description: String(record.description ?? ""),
    status: record.status as TaskStatus,
    assignedTo: record.assignedTo ? String(record.assignedTo) : null,
    dueDate: record.dueDate ? String(record.dueDate) : null,
    priority: record.priority as Task["priority"],
  };
}

/** Fields the client may send when creating a task (§8 server-owned rules). */
export interface NewTask {
  title: string;
  description?: string;
  priority: Task["priority"];
}

export function createTasksApi(client: PbClient) {
  const tasks = () => client.collection("tasks");

  async function fetchTasks(teamId: string): Promise<Task[]> {
    try {
      const list = await tasks().getList(1, 50, {
        filter: `team = ${pbEscape(teamId)}`,
        sort: "created",
      });
      return list.items.map((r) => toTask(r as Record<string, unknown>));
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Admin-scoped: every task across every team (§4E analytics). Gated by the
   * relaxed list rule — create/update stay member-scoped.
   */
  async function fetchAllTasks(): Promise<Task[]> {
    try {
      const list = await tasks().getList(1, 200, { sort: "created" });
      return list.items.map((r) => toTask(r as Record<string, unknown>));
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function createTask(teamId: string, input: NewTask): Promise<Task> {
    try {
      const record = await tasks().create({
        team: teamId,
        title: input.title,
        description: input.description ?? "",
        priority: input.priority,
      });
      return toTask(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  async function updateTaskStatus(
    taskId: string,
    status: TaskStatus
  ): Promise<Task> {
    try {
      const record = await tasks().update(taskId, { status });
      return toTask(record);
    } catch (err) {
      throw normalizeError(err);
    }
  }

  /**
   * Live board sync. The subscription dedupes by task id so a reconnect that
   * replays already-seen events never re-applies a move.
   */
  async function subscribeTasks(
    teamId: string,
    onTask: (task: Task) => void
  ): Promise<UnsubscribeFunc> {
    const seen = new Set<string>();
    return tasks().subscribe(
      "*",
      (e) => {
        if (e.action !== "update" && e.action !== "create") return;
        const task = toTask(e.record as Record<string, unknown>);
        if (String(task.team) !== teamId) return;
        if (seen.has(task.id)) return;
        seen.add(task.id);
        onTask(task);
      },
      { filter: `team = ${pbEscape(teamId)}` }
    );
  }

  return {
    fetchTasks,
    fetchAllTasks,
    createTask,
    updateTaskStatus,
    subscribeTasks,
  };
}
