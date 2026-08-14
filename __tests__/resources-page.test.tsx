import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ResourcesPage from "@/pages/team/[id]/resources";
import type { Resource } from "@/types/squadup";

const fetchResourcesMock = vi.fn();
const createResourceMock = vi.fn();
const getClientMock = vi.fn();

vi.mock("@/lib/api", () => ({
  api: () => ({
    resources: {
      fetchResources: fetchResourcesMock,
      createResource: createResourceMock,
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

function makeResource(overrides: Partial<Resource> = {}): Resource {
  return {
    id: "r1",
    team: "t1",
    type: "figma",
    url: "https://www.figma.com/file/abc/Design",
    title: "Design v1",
    uploadedBy: "u-me",
    embeddable: true,
    createdAt: "2026-08-14T08:00:00.000Z",
    ...overrides,
  };
}

function pageResult(resources: Resource[], totalPages = 1) {
  return {
    items: resources,
    page: 1,
    perPage: 12,
    totalItems: resources.length,
    totalPages,
  };
}

beforeEach(() => {
  fetchResourcesMock.mockReset();
  createResourceMock.mockReset();
  getClientMock.mockReset();
});

describe("resource hub — /team/[id]/resources", () => {
  it("embeds embeddable links as iframe previews", async () => {
    fetchResourcesMock.mockResolvedValue(pageResult([makeResource()]));

    render(<ResourcesPage />);

    const frame = await screen.findByTitle("Design v1");
    expect(frame.tagName).toBe("IFRAME");
    expect(frame).toHaveAttribute(
      "src",
      "https://www.figma.com/file/abc/Design"
    );
    expect(screen.getByText("figma")).toBeInTheDocument();
  });

  it("renders non-embeddable links as cards with an open button", async () => {
    fetchResourcesMock.mockResolvedValue(
      pageResult([
        makeResource({
          id: "r2",
          type: "github",
          title: "SquadUp repo",
          url: "https://github.com/10xdev4u-alt/squadup",
          embeddable: false,
        }),
      ])
    );

    render(<ResourcesPage />);

    expect(await screen.findByText("SquadUp repo")).toBeInTheDocument();
    expect(screen.queryByTitle("SquadUp repo")).not.toBeInTheDocument();
    const open = screen.getByRole("link", { name: /open/i });
    expect(open).toHaveAttribute(
      "href",
      "https://github.com/10xdev4u-alt/squadup"
    );
  });

  it("adds a resource from the form", async () => {
    fetchResourcesMock.mockResolvedValue(pageResult([]));
    createResourceMock.mockResolvedValue(makeResource());

    render(<ResourcesPage />);

    await userEvent.type(
      await screen.findByLabelText(/link url/i),
      "https://www.figma.com/file/abc/Design"
    );
    await userEvent.type(screen.getByLabelText(/title/i), "Design v1");
    await userEvent.click(
      screen.getByRole("button", { name: /add resource/i })
    );

    await waitFor(() =>
      expect(createResourceMock).toHaveBeenCalledWith("t1", {
        url: "https://www.figma.com/file/abc/Design",
        title: "Design v1",
      })
    );
  });

  it("shows pagination when there are more pages", async () => {
    fetchResourcesMock.mockResolvedValue(pageResult([makeResource()], 3));

    render(<ResourcesPage />);

    await screen.findByTitle("Design v1");
    const next = screen.getByRole("button", { name: /next/i });
    await userEvent.click(next);

    await waitFor(() =>
      expect(fetchResourcesMock).toHaveBeenLastCalledWith("t1", 2)
    );
  });

  it("shows an empty state when nothing is shared yet", async () => {
    fetchResourcesMock.mockResolvedValue(pageResult([]));

    render(<ResourcesPage />);

    expect(await screen.findByText(/no resources yet/i)).toBeInTheDocument();
  });
});
