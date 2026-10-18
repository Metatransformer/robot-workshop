import { supplierLinks, type SupplierLink } from "@/lib/supplier-links";

export type PartPurchaseLinksProps = {
  itemId: string;
  requiredQuantity?: number;
  ownedQuantity?: number;
};

const panelStyle = {
  marginTop: "0.85rem",
  padding: "0.8rem 0.9rem",
  border: "1px solid color-mix(in srgb, currentColor 18%, transparent)",
  borderRadius: "0.75rem",
  background: "color-mix(in srgb, Canvas 94%, #dce9e5)",
  color: "CanvasText",
  font: "500 0.82rem/1.45 ui-sans-serif, system-ui, sans-serif",
} as const;

const linkStyle = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "2.2rem",
  padding: "0.35rem 0.7rem",
  borderRadius: "999px",
  background: "#195e54",
  color: "#fff",
  fontWeight: 750,
  textDecoration: "none",
} as const;

function supplierForItem(itemId: string): SupplierLink | undefined {
  return supplierLinks[itemId]
    ?? Object.values(supplierLinks).find((supplier) => supplier.catalogItemId === itemId);
}

export function PartPurchaseLinks({ itemId, requiredQuantity, ownedQuantity }: PartPurchaseLinksProps) {
  const supplier = supplierForItem(itemId);
  if (!supplier) return null;

  const hasRequired = requiredQuantity !== undefined;
  const hasOwned = ownedQuantity !== undefined;
  const stillNeeded = hasRequired && hasOwned
    ? Math.max(0, requiredQuantity - ownedQuantity)
    : undefined;

  return (
    <aside style={panelStyle} aria-label={`Verified supplier reference for ${supplier.name}`}>
      <div style={{ display: "flex", gap: "0.65rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div>
          <strong style={{ display: "block", fontSize: "0.88rem" }}>{supplier.name}</strong>
          <span>{supplier.manufacturer} · {supplier.model}{supplier.sku ? ` · SKU ${supplier.sku}` : ""}</span>
        </div>
        <a href={supplier.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Open supplier <span aria-hidden="true" style={{ marginLeft: "0.35rem" }}>↗</span>
        </a>
      </div>

      {(hasRequired || hasOwned) && (
        <div style={{ marginTop: "0.7rem", paddingTop: "0.65rem", borderTop: "1px solid color-mix(in srgb, currentColor 12%, transparent)" }}>
          {hasRequired && <span>Required: <strong>{requiredQuantity}</strong></span>}
          {hasRequired && hasOwned && <span aria-hidden="true"> · </span>}
          {hasOwned && <span>Recorded owned: <strong>{ownedQuantity}</strong></span>}
          {stillNeeded !== undefined && <span> · Still needed: <strong>{stillNeeded}</strong></span>}
          {stillNeeded === undefined && <span> · Still needed: <strong>unknown</strong> (both quantities are needed)</span>}
          <div style={{ marginTop: "0.25rem" }}>Confirm that every owned unit is the exact, usable variant before relying on this calculation.</div>
        </div>
      )}

      <details style={{ marginTop: "0.65rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 700 }}>Variant and compatibility notes</summary>
        <ul style={{ margin: "0.45rem 0 0", paddingLeft: "1.2rem" }}>
          {supplier.selectionNotes.map((note) => <li key={note} style={{ marginTop: "0.25rem" }}>{note}</li>)}
        </ul>
      </details>
      <p style={{ margin: "0.6rem 0 0", opacity: 0.78 }}>
        Official page checked {supplier.checkedAt}. Reference only: stock was not checked, electrical suitability is not qualified, and no purchase is made here.
      </p>
    </aside>
  );
}

export default PartPurchaseLinks;
