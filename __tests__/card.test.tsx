import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

describe("card primitive", () => {
  it("renders header, title, description, and content slots", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Project Alpha</CardTitle>
          <CardDescription>Building the next big thing</CardDescription>
        </CardHeader>
        <CardContent>Five members strong.</CardContent>
      </Card>
    );
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Building the next big thing")).toBeInTheDocument();
    expect(screen.getByText("Five members strong.")).toBeInTheDocument();
  });
});
