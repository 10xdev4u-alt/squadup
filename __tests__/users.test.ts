import { describe, expect, it, vi } from "vitest";
import { createUsersApi, type ProfileUpdate } from "@/lib/api/users";
import { makeClient, makeService } from "@/__tests__/helpers/client";

const updatedRecord = {
  id: "u1",
  email: "jane@college.edu",
  name: "Jane Doe",
  collegeId: "21CS001",
  avatar: null,
  bio: "Full-stack dev, hackathon addict",
  githubUrl: "https://github.com/janedoe",
  skills: [],
  primaryRole: "Developer",
  status: "solo",
  lookingFor: "",
};

describe("users api", () => {
  it("updates the profile sending only editable fields", async () => {
    const service = makeService({ update: vi.fn(async () => updatedRecord) });
    const api = createUsersApi(makeClient(service));

    const profile: ProfileUpdate = {
      name: "Jane Doe",
      bio: "Full-stack dev, hackathon addict",
      githubUrl: "https://github.com/janedoe",
    };
    const user = await api.updateProfile("u1", profile);

    expect(service.update).toHaveBeenCalledWith("u1", {
      name: "Jane Doe",
      bio: "Full-stack dev, hackathon addict",
      githubUrl: "https://github.com/janedoe",
    });
    // server-owned fields never sent by the client
    expect(service.update).not.toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ collegeId: expect.anything() })
    );
    expect(service.update).not.toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ status: expect.anything() })
    );
    expect(user).toMatchObject({
      id: "u1",
      name: "Jane Doe",
      bio: "Full-stack dev, hackathon addict",
    });
  });

  it("appends avatar when a file is provided", async () => {
    const service = makeService({ update: vi.fn(async () => updatedRecord) });
    const api = createUsersApi(makeClient(service));
    const avatar = new File(["data"], "avatar.png", { type: "image/png" });

    await api.updateProfile("u1", {
      name: "Jane Doe",
      bio: "",
      githubUrl: null,
      avatar,
    });

    expect(service.update).toHaveBeenCalledWith(
      "u1",
      expect.objectContaining({ avatar })
    );
  });

  it("normalizes update failures into typed ApiErrors", async () => {
    const service = makeService({
      update: vi.fn(async () => {
        throw new Error("fetch failed");
      }),
    });
    const api = createUsersApi(makeClient(service));

    await expect(
      api.updateProfile("u1", { name: "Jane", bio: "", githubUrl: null })
    ).rejects.toMatchObject({ kind: "server" });
  });
});
