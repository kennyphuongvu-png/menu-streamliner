export async function downloadXlsx(filename: string, sheets: Record<string, (string | number)[][]>) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = (rows[0] ?? []).map(() => ({ wch: 20 }));
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }
  XLSX.writeFile(wb, filename);
}

export async function readSheetRows(file: File): Promise<Record<string, unknown>[]> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer());
  const ws = wb.Sheets[wb.SheetNames[0]!];
  return ws ? XLSX.utils.sheet_to_json<Record<string, unknown>>(ws) : [];
}
