export default function BurnStagingTable() {
  const rows = [
    ["Superficial", "Red, painful, dry; no blisters", "Epidermis only"],
    ["Superficial partial-thickness", "Blisters, moist, very painful", "Epidermis and dermis"],
    ["Deep partial-thickness", "Pale or mottled, less blanching", "Deeper dermis"],
    ["Full-thickness", "Leathery, waxy, painless area", "Entire dermis"],
  ];

  return (
    <figure>
      <svg viewBox="0 0 420 170" role="img" aria-label="Burn depth reference diagram">
        <rect x="20" y="18" width="380" height="132" fill="#fff" stroke="#D6DCE3" />
        <rect x="20" y="18" width="380" height="28" fill="#E8F0F8" />
        <text x="34" y="37" fontSize="13" fontWeight="700" fill="#1A2533">Burn staging reference</text>
        <rect x="54" y="62" width="70" height="60" fill="#F6C7B6" stroke="#C8453A" />
        <rect x="154" y="62" width="70" height="60" fill="#E8A08B" stroke="#C8453A" />
        <rect x="254" y="62" width="70" height="60" fill="#B85C3D" stroke="#7A2C1C" />
        <path d="M54 84H124M154 94H224M254 106H324" stroke="#7A2C1C" strokeWidth="3" />
        <text x="58" y="140" fontSize="11" fill="#1A2533">less depth</text>
        <text x="256" y="140" fontSize="11" fill="#1A2533">more depth</text>
      </svg>
      <table>
        <thead>
          <tr>
            <th>Depth</th>
            <th>Appearance</th>
            <th>Example</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([depth, appearance, example]) => (
            <tr key={depth}>
              <td>{depth}</td>
              <td>{appearance}</td>
              <td>{example}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
