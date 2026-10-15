import { useState } from "react";
import { Check, Pencil, Plus, Settings2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inputCls } from "@/components/fnb-dialogs";
import { useFnb } from "@/lib/fnb-store";

export function GroupFilters({ kind, value, onChange, count }: { kind: "ingredient" | "recipe"; value: string; onChange: (name: string) => void; count: (name: string) => number }) {
  const { ingredientGroups, recipeGroups, addGroup, renameGroup, deleteGroup } = useFnb();
  const groups = kind === "ingredient" ? ingredientGroups : recipeGroups;
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const valid = (text: string, original?: string) => text.trim().length > 0 && text.trim().length <= 80 && text.trim() !== "Tất cả" && !groups.some((g) => g !== original && g.toLocaleLowerCase("vi") === text.trim().toLocaleLowerCase("vi"));
  return <div className="no-print space-y-3">
    <div className="flex flex-wrap items-center gap-2" aria-label={kind === "ingredient" ? "Nhóm nguyên liệu" : "Nhóm món"}>
      {["Tất cả", ...groups].map((g) => <Button key={g} size="sm" variant={value === g ? "default" : "outline"} aria-pressed={value === g} className="h-auto min-h-9 max-w-full whitespace-normal break-words text-left" onClick={() => onChange(g)}>{g}<span className="text-xs opacity-70">{count(g)}</span></Button>)}
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}><Settings2 className="size-4" /> Quản lý nhóm</Button>
    </div>
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); setEditing(null); setName(""); }}>
      <DialogContent className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{kind === "ingredient" ? "Quản lý nhóm nguyên liệu" : "Quản lý nhóm món"}</DialogTitle><DialogDescription>Khi xóa nhóm, các mục thuộc nhóm được chuyển sang Khác.</DialogDescription></DialogHeader>
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (!valid(name)) return; addGroup(kind, name.trim()); setName(""); }}><input aria-label="Tên nhóm mới" maxLength={80} className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên nhóm mới" /><Button type="submit" disabled={!valid(name)}><Plus className="size-4" /> Thêm</Button></form>
        <ul className="divide-y divide-border">{groups.map((g) => <li key={g} className="flex min-w-0 items-center gap-2 py-2">{editing === g ? <><input aria-label="Tên nhóm chỉnh sửa" className={inputCls} maxLength={80} value={draft} onChange={(e) => setDraft(e.target.value)} /><Button size="icon" aria-label="Lưu tên nhóm" disabled={!valid(draft, g)} onClick={() => { renameGroup(kind, g, draft.trim()); if (value === g) onChange(draft.trim()); setEditing(null); }}><Check className="size-4" /></Button><Button size="icon" variant="ghost" aria-label="Hủy sửa nhóm" onClick={() => setEditing(null)}><X className="size-4" /></Button></> : <><span className="min-w-0 flex-1 break-words text-sm font-medium">{g}</span><span className="text-xs text-muted-foreground">{count(g)}</span><Button size="icon" variant="ghost" disabled={g === "Khác"} aria-label={`Sửa nhóm ${g}`} onClick={() => { setEditing(g); setDraft(g); }}><Pencil className="size-4" /></Button><Button size="icon" variant="ghost" disabled={g === "Khác"} aria-label={`Xóa nhóm ${g}`} onClick={() => { if (!window.confirm(`Xóa nhóm “${g}”? Các mục sẽ chuyển sang Khác.`)) return; deleteGroup(kind, g); if (value === g) onChange("Tất cả"); }}><Trash2 className="size-4" /></Button></>}</li>)}</ul>
      </DialogContent>
    </Dialog>
  </div>;
}