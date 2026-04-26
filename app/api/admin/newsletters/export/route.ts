import { listNewsletterSubmissions } from "@/lib/services/newsletter-service";

function csvEscape(value: string) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const selectedIds = (url.searchParams.get("ids") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const submissions = await listNewsletterSubmissions();
  const rowsToExport = selectedIds.length
    ? submissions.filter((submission) => selectedIds.includes(submission.id))
    : submissions;
  const rows = [
    [
      "Full Name",
      "Agency Name",
      "Email",
      "Country of Origin",
      "Contact Number",
      "Primary Market",
      "Additional Notes",
      "Status",
      "Created At"
    ],
    ...rowsToExport.map((submission) => [
      submission.fullName,
      submission.agencyName,
      submission.email,
      submission.countryOfOrigin,
      submission.contactNumber,
      submission.primaryMarket,
      submission.additionalNotes,
      submission.status,
      submission.createdAt
    ])
  ];

  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="newsletter-submissions.csv"'
    }
  });
}
