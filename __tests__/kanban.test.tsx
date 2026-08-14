import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KanbanBoardPage from "@/pages/team/[id]/board";
import type { Task } from "@/types/squadup";

const fetchTasksMock = vi.fn();
const createTaskMock = vi.fn();
const updateTaskStatusMock = vi.fn();
const subscribeTasksMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    tasks: {
      fetchTasks: fetchTasksMock,
      createTask: createTaskMock,
      updateTaskStatus: updateTaskStatusMock,
      subscribeTasks: subscribeTasksMock,
    },
  }),
  getApiErrorMessage: (err: unknown) =>
    err instanceof Error ? err.message : "Something went wrong on our end.",
}));

vi.mock("@/lib/api/client", () => ({
  getClient: () => getClientMock(),
}));

vi.mock("@/lib/use-require-auth", () => ({
  useRequireAuth: () => true,
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ query: { id: "t1" } }),
}));

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "k1",
    team: "t1",
    title: "Wire the swipe deck",
    description: "",
    status: "idea",
    assignedTo: null,
    dueDate: null,
    priority: "high",
    ...overrides,
  };
}

beforeEach(() => {
  fetchTasksMock.mockReset();
  createTaskMock.mockReset();
  updateTaskStatusMock.mockReset();
  subscribeTasksMock.mockReset();
  getClientMock.mockReset();
  subscribeTasksMock.mockResolvedValue(async () => {});
});

describe("kanban board — /team/[id]/board", () => {
  it("renders the five §4B columns with their cards", async () => {
    fetchTasksMock.mockResolvedValue([makeTask()]);

    render(<KanbanBoardPage />);

    for (const column of [
      "Idea",
      "PPT Draft",
      "Prototype",
      "Testing",
      "Final Pitch",
    ]) {
      expect(
        await screen.findByRole("heading", { name: new RegExp(column, "i") })
      ).toBeInTheDocument();
    }
    expect(screen.getByText("Wire the swipe deck")).toBeInTheDocument();
  });

  it("creates a card from the add form", async () => {
    fetchTasksMock.mockResolvedValue([]);
    createTaskMock.mockResolvedValue(
      makeTask({ id: "k2", title: "Design the logo" })
    );

    render(<KanbanBoardPage />);

    await userEvent.type(
      await screen.findByLabelText(/task title/i),
      "Design the logo"
    );
    await userEvent.click(screen.getByRole("button", { name: /add task/i }));

    await waitFor(() =>
      expect(createTaskMock).toHaveBeenCalledWith("t1", {
        title: "Design the logo",
        description: "",
        priority: "medium",
      })
    );
  });

  it("moves a card via its accessible move control", async () => {
    fetchTasksMock.mockResolvedValue([makeTask()]);
    updateTaskStatusMock.mockResolvedValue(
      makeTask({ status: "prototype" })
    );

    render(<KanbanBoardPage />);

    const move = await screen.findByRole("button", {
      name: /move.*prototype/i,
    });
    await userEvent.click(move);

    await waitFor(() =>
      expect(updateTaskStatusMock).toHaveBeenCalledWith("k1", "prototype")
    );
    expect(await screen.findByText("Wire the swipe deck")).toBeInTheDocument();
  });

  it("applies realtime card moves from teammates", async () => {
    let handler: ((task: Task) => void) | undefined;
    subscribeTasksMock.mockImplementation(
      async (_teamId: string, cb: (task: Task) => void) => {
        handler = cb;
        return vi.fn(async () => {});
      }
    );
    fetchTasksMock.mockResolvedValue([makeTask()]);

    render(<KanbanBoardPage />);
    await screen.findByText("Wire the swipe deck");

    await waitFor(() => expect(handler).toBeDefined());
    handler?.(makeTask({ id: "k9", title: "Live sync card", status: "testing" }));

    expect(await screen.findByText("Live sync card")).toBeInTheDocument();
  });
});
