import { defineWidgetConfig } from "@medusajs/admin-sdk";
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types";
import { Container, Heading, Select, Input, Button, Text, toast, Table } from "@medusajs/ui";
import { useEffect, useState } from "react";

type Supplier = { id: string; name: string; type: string };
type Mapping = {
  id?: string;
  variant_id: string;
  supplier_id?: string;
  supplier_sku?: string;
  supplier_variant_id?: string;
  cost_amount?: number;
  ship_from?: "us" | "cn" | "other";
  is_preferred?: boolean;
};

const ProductSupplierMappingWidget = ({
  data: product,
}: DetailWidgetProps<AdminProduct>) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [rows, setRows] = useState<Record<string, Mapping>>({});
  const [supplierId, setSupplierId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/admin/suppliers`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setSuppliers(d.suppliers ?? []);
        if (d.suppliers?.[0]) setSupplierId(d.suppliers[0].id);
      });
  }, []);

  useEffect(() => {
    if (!supplierId) return;
    fetch(`/admin/suppliers/${supplierId}/variants`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, Mapping> = {};
        for (const v of product.variants ?? []) {
          const existing = (d.supplier_variants ?? []).find(
            (sv: Mapping) => sv.variant_id === v.id
          );
          map[v.id] = existing ?? { variant_id: v.id, supplier_id: supplierId };
        }
        setRows(map);
      });
  }, [supplierId, product.variants]);

  const update = (variantId: string, patch: Partial<Mapping>) =>
    setRows((r) => ({ ...r, [variantId]: { ...r[variantId], ...patch } }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = Object.values(rows).filter(
        (r) => r.supplier_sku || r.supplier_variant_id
      );
      const res = await fetch(`/admin/suppliers/${supplierId}/variants`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: payload }),
      });
      if (!res.ok) throw new Error("save failed");
      const d = await res.json();
      toast.success(`Saved (${d.created} new, ${d.updated} updated)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Supplier mapping</Heading>
        <div className="w-48">
          <Select value={supplierId} onValueChange={setSupplierId}>
            <Select.Trigger>
              <Select.Value placeholder="Supplier" />
            </Select.Trigger>
            <Select.Content>
              {suppliers.map((s) => (
                <Select.Item key={s.id} value={s.id}>
                  {s.name} ({s.type})
                </Select.Item>
              ))}
            </Select.Content>
          </Select>
        </div>
      </div>
      <div className="px-6 py-4">
        {suppliers.length === 0 ? (
          <Text size="small" className="text-ui-fg-subtle">
            No suppliers — create one under Settings → Suppliers.
          </Text>
        ) : (
          <>
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.HeaderCell>Variant</Table.HeaderCell>
                  <Table.HeaderCell>Supplier SKU</Table.HeaderCell>
                  <Table.HeaderCell>Supplier variant id</Table.HeaderCell>
                  <Table.HeaderCell>Cost</Table.HeaderCell>
                  <Table.HeaderCell>Ship from</Table.HeaderCell>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(product.variants ?? []).map((v) => {
                  const row = rows[v.id] ?? { variant_id: v.id };
                  return (
                    <Table.Row key={v.id}>
                      <Table.Cell>{v.title}</Table.Cell>
                      <Table.Cell>
                        <Input
                          size="small"
                          value={row.supplier_sku ?? ""}
                          onChange={(e) => update(v.id, { supplier_sku: e.target.value })}
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          size="small"
                          value={row.supplier_variant_id ?? ""}
                          onChange={(e) =>
                            update(v.id, { supplier_variant_id: e.target.value })
                          }
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Input
                          size="small"
                          type="number"
                          value={row.cost_amount ?? ""}
                          onChange={(e) =>
                            update(v.id, { cost_amount: Number(e.target.value) })
                          }
                        />
                      </Table.Cell>
                      <Table.Cell>
                        <Select
                          value={row.ship_from ?? "other"}
                          onValueChange={(val) =>
                            update(v.id, { ship_from: val as Mapping["ship_from"] })
                          }
                        >
                          <Select.Trigger>
                            <Select.Value />
                          </Select.Trigger>
                          <Select.Content>
                            <Select.Item value="us">us</Select.Item>
                            <Select.Item value="cn">cn</Select.Item>
                            <Select.Item value="other">other</Select.Item>
                          </Select.Content>
                        </Select>
                      </Table.Cell>
                    </Table.Row>
                  );
                })}
              </Table.Body>
            </Table>
            <div className="mt-4">
              <Button onClick={save} disabled={saving}>
                {saving ? "Saving…" : "Save mapping"}
              </Button>
            </div>
          </>
        )}
      </div>
    </Container>
  );
};

export const config = defineWidgetConfig({
  zone: "product.details.side.after",
});

export default ProductSupplierMappingWidget;
