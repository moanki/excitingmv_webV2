import { listPartnerRequests } from "@/lib/services/partner-service";

function csvEscape(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const selectedIds = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const partners = await listPartnerRequests();
  const rowsToExport = selectedIds.length
    ? partners.filter((partner) => selectedIds.includes(partner.id))
    : partners;
  const rows = [
    ["Agency Name", "Contact Name", "Email", "Market", "Status", "Notes", "Created At"],
    ...rowsToExport.map((partner) => [
      partner.agencyName,
      partner.contactName,
      partner.email,
      partner.market,
      partner.status,
      partner.notes,
      partner.createdAt
    ])
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="partner-requests.csv"'
    }
  });
}
