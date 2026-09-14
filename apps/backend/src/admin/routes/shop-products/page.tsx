import { defineRouteConfig } from "@medusajs/admin-sdk";
import { ShoppingBag, Plus, Minus } from "@medusajs/icons";
import {
  Container,
  Heading,
  Text,
  Table,
  Badge,
  Button,
  Input,
  Checkbox,
  toast,
} from "@medusajs/ui";
import { useEffect, useState, useMemo } from "react";

type SalesChannel = {
  id: string;
  name: string;
  description?: string;
};

type Product = {
  id: string;
  title: string;
  handle: string;
  thumbnail?: string;
  status: string;
  sales_channels?: SalesChannel[];
};

const ShopProductsPage = () => {
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/admin/shop-products", { credentials: "include" });
      const data = await res.json();
      setChannels(data.sales_channels ?? []);
      setProducts(data.products ?? []);
    } catch (err) {
      toast.error("Error loading products and sales channels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products by active tab and search query
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.handle.toLowerCase().includes(search.toLowerCase());

      if (!matchesSearch) return false;

      if (activeChannelId === "all") return true;

      return p.sales_channels?.some((sc) => sc.id === activeChannelId);
    });
  }, [products, activeChannelId, search]);

  const activeChannel = useMemo(
    () => channels.find((c) => c.id === activeChannelId),
    [channels, activeChannelId]
  );

  const handleToggleProduct = async (
    productId: string,
    channelId: string,
    action: "add" | "remove"
  ) => {
    try {
      const res = await fetch("/admin/shop-products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: [productId],
          sales_channel_id: channelId,
          action,
        }),
      });

      if (res.ok) {
        toast.success(
          action === "add"
            ? "Đã thêm sản phẩm vào Shop"
            : "Đã gỡ sản phẩm khỏi Shop"
        );
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Thao tác thất bại");
      }
    } catch (e) {
      toast.error("Lỗi khi kết nối đến máy chủ");
    }
  };

  const handleBulkAction = async (action: "add" | "remove") => {
    if (!selectedIds.length || activeChannelId === "all") return;

    try {
      const res = await fetch("/admin/shop-products", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_ids: selectedIds,
          sales_channel_id: activeChannelId,
          action,
        }),
      });

      if (res.ok) {
        toast.success(
          action === "add"
            ? `Đã thêm ${selectedIds.length} sản phẩm vào ${activeChannel?.name}`
            : `Đã gỡ ${selectedIds.length} sản phẩm khỏi ${activeChannel?.name}`
        );
        setSelectedIds([]);
        loadData();
      } else {
        const err = await res.json();
        toast.error(err.message || "Thao tác thất bại");
      }
    } catch (e) {
      toast.error("Lỗi kết nối máy chủ");
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <Container className="p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <Heading level="h1">Sản Phẩm Theo Shop (Sales Channels)</Heading>
        <Text className="text-ui-fg-subtle">
          Phân chia và quản lý sản phẩm cho từng kênh bán lẻ (Cases, Eyewear, Toys, Watches...)
        </Text>
      </div>

      {/* Tabs list for Channels */}
      <div className="flex flex-wrap gap-2 border-b border-ui-border-base pb-3">
        <Button
          variant={activeChannelId === "all" ? "primary" : "transparent"}
          size="small"
          onClick={() => {
            setActiveChannelId("all");
            setSelectedIds([]);
          }}
        >
          Tất cả shop ({products.length})
        </Button>
        {channels.map((ch) => {
          const count = products.filter((p) =>
            p.sales_channels?.some((sc) => sc.id === ch.id)
          ).length;

          return (
            <Button
              key={ch.id}
              variant={activeChannelId === ch.id ? "primary" : "transparent"}
              size="small"
              onClick={() => {
                setActiveChannelId(ch.id);
                setSelectedIds([]);
              }}
            >
              {ch.name} ({count})
            </Button>
          );
        })}
      </div>

      {/* Controls & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Tìm theo tên hoặc handle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {activeChannelId !== "all" && (
          <div className="flex items-center gap-2">
            <Text className="text-ui-fg-subtle text-sm">
              Đang chọn: <span className="font-semibold text-ui-fg-base">{activeChannel?.name}</span>
            </Text>
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                <Button
                  size="small"
                  variant="secondary"
                  onClick={() => handleBulkAction("add")}
                >
                  <Plus /> Thêm {selectedIds.length} SP vào Shop
                </Button>
                <Button
                  size="small"
                  variant="danger"
                  onClick={() => handleBulkAction("remove")}
                >
                  <Minus /> Gỡ {selectedIds.length} SP khỏi Shop
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Product Table */}
      <Table>
        <Table.Header>
          <Table.Row>
            {activeChannelId !== "all" && (
              <Table.HeaderCell className="w-10">
                <Checkbox
                  checked={
                    filteredProducts.length > 0 &&
                    selectedIds.length === filteredProducts.length
                  }
                  onCheckedChange={toggleSelectAll}
                />
              </Table.HeaderCell>
            )}
            <Table.HeaderCell>Sản phẩm</Table.HeaderCell>
            <Table.HeaderCell>Trạng thái</Table.HeaderCell>
            <Table.HeaderCell>Shop / Sales Channels đang bán</Table.HeaderCell>
            <Table.HeaderCell className="text-right">Thao tác</Table.HeaderCell>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                Đang tải dữ liệu sản phẩm...
              </Table.Cell>
            </Table.Row>
          ) : filteredProducts.length === 0 ? (
            <Table.Row>
              <Table.Cell colSpan={5} className="text-center py-8 text-ui-fg-subtle">
                Không tìm thấy sản phẩm nào.
              </Table.Cell>
            </Table.Row>
          ) : (
            filteredProducts.map((p) => {
              const inActiveShop =
                activeChannelId !== "all" &&
                p.sales_channels?.some((sc) => sc.id === activeChannelId);

              return (
                <Table.Row key={p.id}>
                  {activeChannelId !== "all" && (
                    <Table.Cell>
                      <Checkbox
                        checked={selectedIds.includes(p.id)}
                        onCheckedChange={() => toggleSelectOne(p.id)}
                      />
                    </Table.Cell>
                  )}
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="w-10 h-10 object-cover rounded border border-ui-border-base"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-ui-bg-subtle rounded border border-ui-border-base flex items-center justify-center text-xs text-ui-fg-muted">
                          No Pic
                        </div>
                      )}
                      <div>
                        <Text className="font-medium text-ui-fg-base">{p.title}</Text>
                        <Text className="text-xs text-ui-fg-subtle">{p.handle}</Text>
                      </div>
                    </div>
                  </Table.Cell>

                  <Table.Cell>
                    <Badge color={p.status === "published" ? "green" : "grey"}>
                      {p.status}
                    </Badge>
                  </Table.Cell>

                  <Table.Cell>
                    <div className="flex flex-wrap gap-1">
                      {p.sales_channels && p.sales_channels.length > 0 ? (
                        p.sales_channels.map((sc) => (
                          <Badge key={sc.id} color="blue" size="small">
                            {sc.name}
                          </Badge>
                        ))
                      ) : (
                        <Text className="text-xs text-ui-fg-muted">Chưa gán shop nào</Text>
                      )}
                    </div>
                  </Table.Cell>

                  <Table.Cell className="text-right">
                    {activeChannelId === "all" ? (
                      <Text className="text-xs text-ui-fg-subtle">
                        Chọn 1 shop ở phía trên để thao tác
                      </Text>
                    ) : inActiveShop ? (
                      <Button
                        size="small"
                        variant="transparent"
                        className="text-ui-fg-error hover:bg-ui-bg-base-hover"
                        onClick={() =>
                          handleToggleProduct(p.id, activeChannelId, "remove")
                        }
                      >
                        Gỡ khỏi {activeChannel?.name}
                      </Button>
                    ) : (
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={() =>
                          handleToggleProduct(p.id, activeChannelId, "add")
                        }
                      >
                        Thêm vào {activeChannel?.name}
                      </Button>
                    )}
                  </Table.Cell>
                </Table.Row>
              );
            })
          )}
        </Table.Body>
      </Table>
    </Container>
  );
};

export const config = defineRouteConfig({
  label: "Products by Shop",
  icon: ShoppingBag,
});

export default ShopProductsPage;

