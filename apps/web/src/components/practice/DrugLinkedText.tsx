import Link from "next/link";
import { getDrugCardTerms } from "@/lib/drug-cards";

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const drugTerms = getDrugCardTerms();
const drugPattern = drugTerms.length
  ? new RegExp(`\\b(${drugTerms.map((entry) => escapeRegExp(entry.term)).join("|")})\\b`, "gi")
  : null;

export default function DrugLinkedText({ text }: { text: string }) {
  if (!drugPattern || !text) {
    return <>{text}</>;
  }

  const parts: Array<string | { label: string; href: string }> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(drugPattern)) {
    const label = match[0];
    const index = match.index ?? 0;
    const term = drugTerms.find((entry) => entry.term.toLowerCase() === label.toLowerCase());
    if (!term) continue;

    if (index > lastIndex) {
      parts.push(text.slice(lastIndex, index));
    }
    parts.push({ label, href: `/study/pharmacology/${term.card.id}` });
    lastIndex = index + label.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  if (parts.length === 0) {
    return <>{text}</>;
  }

  return (
    <>
      {parts.map((part, index) => typeof part === "string" ? part : (
        <Link key={`${part.href}-${part.label}-${index}`} href={part.href} className="font-semibold text-[#5A7F88] underline decoration-[rgba(90,127,136,0.25)] underline-offset-4 hover:text-dark">
          {part.label}
        </Link>
      ))}
    </>
  );
}
