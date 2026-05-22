import type { RationaleBullet } from "@/lib/exam/itemTypes";

export default function RationaleSection({
  title,
  bullets,
}: {
  title: string;
  bullets: RationaleBullet[];
}) {
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {bullets.map((bullet) => (
          <li key={`${bullet.bold}-${bullet.choiceRef}`}>
            <strong>{bullet.bold}</strong> {bullet.body} <span>[Choice {bullet.choiceRef}]</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
