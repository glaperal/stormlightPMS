import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "@/components/DataTable";

interface Row {
  id: string;
  name: string;
  amount: number;
}

const rows: Row[] = [
  { id: "1", name: "Bright Discovery", amount: 26583.48 },
  { id: "2", name: "Arte Manila", amount: 138506 },
  { id: "3", name: "Dr. Chua", amount: 13604.5 },
];

const columns: DataTableColumn<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortValue: (r) => r.name },
  {
    key: "amount",
    header: "Amount",
    accessor: (r) => r.amount.toFixed(2),
    sortValue: (r) => r.amount,
  },
];

function rowNames() {
  const body = screen
    .getAllByRole("row")
    .slice(1); // drop header row
  return body.map((r) => within(r).getAllByRole("cell")[0].textContent);
}

describe("DataTable", () => {
  it("filters rows by substring match", async () => {
    const user = userEvent.setup();
    render(<DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />);

    const filter = screen.getByLabelText("Filter records");
    await user.type(filter, "arte");

    expect(rowNames()).toEqual(["Arte Manila"]);
  });

  it("sorts rows asc then desc when header clicked", async () => {
    const user = userEvent.setup();
    render(<DataTable rows={rows} columns={columns} rowKey={(r) => r.id} />);

    const header = screen.getByText("Name");
    await user.click(header);
    expect(rowNames()).toEqual(["Arte Manila", "Bright Discovery", "Dr. Chua"]);

    await user.click(header);
    expect(rowNames()).toEqual(["Dr. Chua", "Bright Discovery", "Arte Manila"]);
  });

  it("renders empty state when no rows", () => {
    render(
      <DataTable
        rows={[]}
        columns={columns}
        rowKey={(r) => r.id}
        emptyMessage="Nothing here"
      />,
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });
});
