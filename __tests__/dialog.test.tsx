import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function TestDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm join</DialogTitle>
          <DialogDescription>Join this team?</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

describe("dialog primitive", () => {
  it("opens on trigger click and closes on overlay click", async () => {
    render(<TestDialog />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /open dialog/i }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Confirm join")).toBeInTheDocument();

    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    expect(overlay).not.toBeNull();
    fireEvent.pointerDown(overlay as Element);
    fireEvent.pointerUp(overlay as Element);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
