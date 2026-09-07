import { defineRouteConfig } from "@medusajs/admin-sdk";
import { Buildings } from "@medusajs/icons";
import {
  Container,
  Heading,
  Button,
  Table,
  Badge,
  Input,
  Select,
  Label,
  toast,
  FocusModal,
} from "@medusajs/ui";
import { useEffect, useState } from "react";

type Supplier = {
  id: string;
  name: string;
  type: string;
  is_active: boolean;
  has_credentials: boolean;
  config?: Record<string, unknown>;
};

const SuppliersPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "printify",
    sandbox: true,
    shopId: "",
    token: "",
    email: "",
    apiKey: "",
  });

  const load = () =>
    fetch("/admin/suppliers", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSuppliers(d.suppliers ?? []));

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const credentials: Record<string, string> = {};
    if (form.type === "printify" && form.token) credentials.token = form.token;
    if (form.type === "cj") {
      if (form.email) credentials.email = form.email;
      if (form.apiKey) credentials.apiKey = form.apiKey;
    }
    const res = await fetch("/admin/suppliers", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        type: form.type,
        credentials: Object.keys(credentials).length ? credentials : undefined,
        config: {
          sandbox: form.sandbox,
          ...(form.shopId ? { shopId: form.shopId } : {}),
        },
      }),
    });
    if (res.ok) {
      toast.success("Supplier created");
      setOpen(false);
      setForm({ ...form, name: "", token: "", apiKey: "", email: "", shopId: "" });
      load();
    } else {
      toast.error("Create failed");
    }
  };

  const toggle = async (s: Supplier) => {
    await fetch(`/admin/suppliers/${s.id}`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !s.is_active }),
    });
    load();
  };

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading>Suppliers</Heading>
        <Button onClick={() => setOpen(true)}>Add supplier</Button>
      </div>
      <div className="px-6 py-4">
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Name</Table.HeaderCell>
              <Table.HeaderCell>Type</Table.HeaderCell>
              <Table.HeaderCell>Credentials</Table.HeaderCell>
              <Table.HeaderCell>Sandbox</Table.HeaderCell>
              <Table.HeaderCell>Active</Table.HeaderCell>
              <Table.HeaderCell />
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {suppliers.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell>{s.name}</Table.Cell>
                <Table.Cell>{s.type}</Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color={s.has_credentials ? "green" : "grey"}>
                    {s.has_credentials ? "set" : "none"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>{(s.config as { sandbox?: boolean })?.sandbox ? "yes" : "no"}</Table.Cell>
                <Table.Cell>
                  <Badge size="2xsmall" color={s.is_active ? "green" : "red"}>
                    {s.is_active ? "active" : "off"}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Button size="small" variant="secondary" onClick={() => toggle(s)}>
                    {s.is_active ? "Disable" : "Enable"}
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <FocusModal.Header>
            <Heading>New supplier</Heading>
          </FocusModal.Header>
          <FocusModal.Body className="flex flex-col gap-4 p-6">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  <Select.Item value="printify">printify</Select.Item>
                  <Select.Item value="cj">cj</Select.Item>
                  <Select.Item value="manual">manual</Select.Item>
                </Select.Content>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.sandbox}
                onChange={(e) => setForm({ ...form, sandbox: e.target.checked })}
              />
              Sandbox mode (no real API calls)
            </label>
            {form.type === "printify" && (
              <>
                <div>
                  <Label>Shop ID</Label>
                  <Input value={form.shopId} onChange={(e) => setForm({ ...form, shopId: e.target.value })} />
                </div>
                <div>
                  <Label>API token</Label>
                  <Input type="password" value={form.token} onChange={(e) => setForm({ ...form, token: e.target.value })} />
                </div>
              </>
            )}
            {form.type === "cj" && (
              <>
                <div>
                  <Label>Account email</Label>
                  <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <Label>API key</Label>
                  <Input type="password" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
                </div>
              </>
            )}
            <Button onClick={create} disabled={!form.name}>
              Create
            </Button>
          </FocusModal.Body>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Suppliers",
  icon: Buildings,
});

export default SuppliersPage;
