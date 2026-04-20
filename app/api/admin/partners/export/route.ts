import { listPartnerRequests } from "@/lib/services/partner-service";

function csvEscape(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET() {
  const partners = await listPartnerRequests();
  const rows = [
    ["Agency Name", "Contact Name", "Email", "Market", "Status", "Notes", "Created At"],
    ...partners.map((partner) => [
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
