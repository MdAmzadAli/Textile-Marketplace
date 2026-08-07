import { PrismaClient, ProductStatus, OrderStatus, Role, Prisma } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// ---------------------------------------------------------------------------
// Category taxonomy: 4 parent groups, each with several leaf categories.
// Products are always assigned to a LEAF; parents exist purely for
// navigation (navbar mega-menu, category strip, category landing pages).
// ---------------------------------------------------------------------------

type Kind = "fabric" | "notion" | "embellishment";

interface LeafDef {
  name: string;
  slug: string;
  unit: string;
  priceRange: [number, number];
  kind: Kind;
}

const CATEGORY_TREE: { name: string; slug: string; children: LeafDef[] }[] = [
  {
    name: "Raw & Finished Fabrics",
    slug: "raw-finished-fabrics",
    children: [
      { name: "Cotton", slug: "cotton", unit: "meter", priceRange: [120, 450], kind: "fabric" },
      { name: "Silk", slug: "silk", unit: "meter", priceRange: [350, 3500], kind: "fabric" },
      { name: "Wool", slug: "wool", unit: "meter", priceRange: [400, 4200], kind: "fabric" },
      { name: "Polyester", slug: "polyester", unit: "meter", priceRange: [90, 320], kind: "fabric" },
      { name: "Nylon", slug: "nylon", unit: "meter", priceRange: [100, 380], kind: "fabric" },
      { name: "Denim", slug: "denim", unit: "meter", priceRange: [150, 650], kind: "fabric" },
      { name: "Linen", slug: "linen", unit: "meter", priceRange: [280, 1800], kind: "fabric" },
    ],
  },
  {
    name: "Trims & Notions",
    slug: "trims-notions",
    children: [
      { name: "Threads", slug: "threads", unit: "spool", priceRange: [8, 60], kind: "notion" },
      { name: "Zippers", slug: "zippers", unit: "piece", priceRange: [5, 120], kind: "notion" },
      { name: "Buttons", slug: "buttons", unit: "pack", priceRange: [20, 250], kind: "notion" },
      { name: "Elastic Bands", slug: "elastic-bands", unit: "meter", priceRange: [10, 80], kind: "notion" },
      { name: "Velcro", slug: "velcro", unit: "meter", priceRange: [25, 150], kind: "notion" },
    ],
  },
  {
    name: "Embellishments",
    slug: "embellishments",
    children: [
      { name: "Laces", slug: "laces", unit: "meter", priceRange: [20, 300], kind: "embellishment" },
      { name: "Borders (Gota / Lace Patti)", slug: "borders-gota-patti", unit: "meter", priceRange: [30, 500], kind: "embellishment" },
      { name: "Sequins", slug: "sequins", unit: "pack", priceRange: [40, 350], kind: "embellishment" },
      { name: "Patches", slug: "patches", unit: "pack", priceRange: [50, 400], kind: "embellishment" },
      { name: "Ribbons", slug: "ribbons", unit: "meter", priceRange: [10, 150], kind: "embellishment" },
    ],
  },
  {
    name: "Linings & Interfacings",
    slug: "linings-interfacings",
    children: [
      { name: "Canvas", slug: "canvas", unit: "meter", priceRange: [80, 300], kind: "fabric" },
      { name: "Buckram", slug: "buckram", unit: "meter", priceRange: [60, 220], kind: "fabric" },
      { name: "Inner Lining Material", slug: "inner-lining-material", unit: "meter", priceRange: [50, 280], kind: "fabric" },
    ],
  },
];

const SUPPLIER_BUSINESS_TYPES = ["Manufacturer", "Wholesaler", "Mill / Weaver", "Exporter", "Trading Company", "Dyeing & Processing Unit"];
const OPERATING_HOURS = ["Mon–Sat, 9am–6pm", "Mon–Fri, 9am–6pm", "Mon–Sun, 9am–9pm", "24/7", "Mon–Sat, 10am–7pm"];
const BUYER_BUSINESS_TYPES = ["Manufacturer", "Retailer", "Wholesaler", "Exporter", "Trading Company", "Boutique / Designer Label", "E-commerce Brand"];
const INDUSTRIES = ["Fashion Apparel", "Home Textiles", "Institutional & Uniforms", "Upholstery & Furnishing", "Automotive Textiles", "Technical & Industrial Textiles", "Fashion Accessories"];
const BUDGET_RANGES = ["Under ₹50,000", "₹50,000–₹2,00,000", "₹2,00,000–₹10,00,000", "Above ₹10,00,000"];
const FABRIC_TYPES = ["Cotton", "Silk", "Linen", "Wool", "Denim", "Polyester", "Rayon", "Blends"];

const COLOR_PALETTE = [
  "Ivory", "Charcoal", "Indigo", "Terracotta", "Olive", "Mustard", "Maroon",
  "Sage Green", "Navy", "Blush Pink", "Slate Grey", "Rust", "Cream", "Black",
  "Off White", "Teal", "Burgundy", "Camel", "Gold", "Silver",
];

const CITIES = [
  { city: "Surat", state: "Gujarat" },
  { city: "Ludhiana", state: "Punjab" },
  { city: "Tiruppur", state: "Tamil Nadu" },
  { city: "Bhilwara", state: "Rajasthan" },
  { city: "Panipat", state: "Haryana" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Erode", state: "Tamil Nadu" },
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Delhi", state: "Delhi" },
  { city: "Jaipur", state: "Rajasthan" },
];

const WEAVES = ["Plain Weave", "Twill", "Satin", "Herringbone", "Basket Weave", "Jacquard", "Rib Knit", "Interlock Knit"];
const FINISHES = ["Mercerized", "Enzyme Washed", "Peach Finish", "Calendered", "Sanforized", "Brushed", "Raw / Unfinished"];
const NOTION_MATERIALS = ["Polyester", "Nylon", "Brass", "Plastic", "Cotton", "Metal Alloy", "Acrylic"];
const PRODUCT_ADJECTIVES = ["Premium", "Classic", "Signature", "Deluxe", "Everyday", "Studio", "Artisan", "Heritage"];

function pick<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}
function one<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function int(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function float(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

const SUPPLIER_NAMES = [
  "Vishal Textile Mills",
  "Ganges Weaving Co.",
  "Sunrise Fabric House",
  "Konark Cotton Traders",
  "Heritage Loom Works",
  "Nilkamal Synthetics Pvt. Ltd.",
  "Om Trims & Notions",
  "Radiant Embellishers",
];

function buildProductContent(leaf: LeafDef, seq: number) {
  if (leaf.kind === "fabric") {
    const gsm = int(80, 420);
    const width = one([44, 54, 58, 60, 72, 108]);
    const name = `${one(PRODUCT_ADJECTIVES)} ${leaf.name} ${one(WEAVES)} #${seq}`;
    const description =
      `${gsm} GSM ${leaf.name.toLowerCase()} fabric, ${one(WEAVES).toLowerCase()} construction with a ${one(FINISHES).toLowerCase()} finish. ` +
      `Suitable for ${one(["apparel", "home furnishing", "institutional uniforms", "accessories", "upholstery"])} manufacturing. ` +
      `Supplied in bulk rolls, sold by the ${leaf.unit}, bulk discounts available above MOQ.`;
    const specs = {
      gsm,
      widthInches: width,
      composition: one(["100% Cotton", "65% Polyester / 35% Cotton", "100% Silk", "80% Wool / 20% Nylon", "100% Linen", "95% Cotton / 5% Elastane"]),
      weave: one(WEAVES),
      finish: one(FINISHES),
      shrinkage: `${(Math.random() * 4).toFixed(1)}%`,
    };
    return { name, description, specs };
  }

  // notion / embellishment
  const material = one(NOTION_MATERIALS);
  const name = `${one(PRODUCT_ADJECTIVES)} ${leaf.name} #${seq}`;
  const description =
    `${material} ${leaf.name.toLowerCase()}, sold by the ${leaf.unit}. ` +
    `Ideal for ${one(["garment finishing", "tailoring", "embroidery work", "craft & décor projects", "bulk apparel production"])}. ` +
    `Consistent quality across production batches, bulk discounts available above MOQ.`;
  const specs: Record<string, unknown> = {
    material,
    sizeOrGauge: one(["Small", "Medium", "Large", "Standard", "3mm", "5mm", "10mm", "20mm"]),
  };
  if (leaf.kind === "embellishment") specs.pattern = one(["Floral", "Geometric", "Solid", "Metallic", "Beaded", "Embroidered"]);
  return { name, description, specs };
}

async function main() {
  console.log("Seeding categories (parent groups + leaves)...");
  const leafRecords: { id: string; def: LeafDef; parentId: string; parentName: string }[] = [];
  const parentRecords: { id: string; name: string }[] = [];

  for (const parent of CATEGORY_TREE) {
    const parentRecord = await prisma.category.upsert({
      where: { slug: parent.slug },
      update: {},
      create: { name: parent.name, slug: parent.slug, parentId: null },
    });
    parentRecords.push({ id: parentRecord.id, name: parentRecord.name });

    for (const leaf of parent.children) {
      const leafRecord = await prisma.category.upsert({
        where: { slug: leaf.slug },
        update: { parentId: parentRecord.id },
        create: { name: leaf.name, slug: leaf.slug, parentId: parentRecord.id },
      });
      leafRecords.push({ id: leafRecord.id, def: leaf, parentId: parentRecord.id, parentName: parentRecord.name });
    }
  }
  console.log(`Seeded ${parentRecords.length} parent categories and ${leafRecords.length} leaf categories.`);

  console.log("Seeding admin...");
  const adminPasswordHash = await bcrypt.hash("Password123", SALT_ROUNDS);
  await prisma.user.upsert({
    where: { email: "admin@textilemarket.test" },
    update: {},
    create: { email: "admin@textilemarket.test", passwordHash: adminPasswordHash, role: Role.admin },
  });

  console.log("Seeding suppliers...");
  const suppliers = [];
  for (let i = 0; i < SUPPLIER_NAMES.length; i++) {
    const email = `supplier${i + 1}@textilemarket.test`;
    const passwordHash = await bcrypt.hash("Password123", SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, role: Role.supplier },
    });

    const loc = one(CITIES);
    // Suppliers 1-5 focus on fabrics, 6-7 on trims/embellishments, 8 mixes both —
    // realistic specialization while still covering every leaf category overall.
    const focusPool =
      i < 5
        ? leafRecords.filter((l) => l.def.kind === "fabric")
        : i < 7
        ? leafRecords.filter((l) => l.def.kind !== "fabric")
        : leafRecords;
    const supplierLeaves = pick(focusPool, int(4, Math.min(7, focusPool.length)));

    const profile = await prisma.supplierProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: SUPPLIER_NAMES[i],
        businessType: one(SUPPLIER_BUSINESS_TYPES),
        contactInfo: `+91 ${int(70000, 99999)}${int(10000, 99999)} · ${email}`,
        address: `${int(1, 400)}, ${["Industrial Estate", "Textile Market", "Cloth Market Road", "GIDC Estate"][int(0, 3)]}, ${loc.city}, ${loc.state} - ${int(100000, 999999)}`,
        operatingHours: one(OPERATING_HOURS),
        categories: supplierLeaves.map((l) => l.id),
        fabricTypes: pick(FABRIC_TYPES, int(3, 6)),
        moq: [25, 50, 100, 150, 200, 250][int(0, 5)],
        additionalInfo: {
          yearsInBusiness: int(3, 35),
          gstVerified: true,
          certifications: pick(["ISO 9001", "OEKO-TEX Standard 100", "GOTS Certified", "WRAP Certified"], int(0, 2)),
          exportsInternationally: Math.random() > 0.5,
        },
      },
    });
    suppliers.push({ user, profile, leaves: supplierLeaves });
  }

  console.log("Seeding buyers...");
  const buyers = [];
  const BUYER_COUNT = 5;
  for (let i = 0; i < BUYER_COUNT; i++) {
    const email = `buyer${i + 1}@textilemarket.test`;
    const passwordHash = await bcrypt.hash("Password123", SALT_ROUNDS);
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, passwordHash, role: Role.buyer },
    });

    const profile = await prisma.buyerProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessType: one(BUYER_BUSINESS_TYPES),
        industry: one(INDUSTRIES),
        categoriesOfInterest: pick(leafRecords, int(2, 5)).map((l) => l.id),
        fabricPreferences: pick(FABRIC_TYPES, int(2, 4)),
        typicalOrderQty: [100, 250, 500, 1000, 2000][int(0, 4)],
        budgetRange: one(BUDGET_RANGES),
        additionalPrefs: {
          preferredContact: one(["Email", "Phone", "WhatsApp"]),
          deliveryPreference: one(["Standard", "Express"]),
        },
      },
    });

    const cart = await prisma.cart.upsert({
      where: { buyerId: user.id },
      update: {},
      create: { buyerId: user.id },
    });

    buyers.push({ user, profile, cart });
  }

  console.log("Seeding products (every leaf category, status, price band and unit)...");
  const allProducts: { id: string; price: number; supplierId: string }[] = [];
  let productSeq = 0;

  for (const supplier of suppliers) {
    for (const leaf of supplier.leaves) {
      // 2-4 products per supplier per leaf category they carry — enough to
      // exercise pagination, sorting and filtering within every category.
      const count = int(2, 4);
      for (let i = 0; i < count; i++) {
        productSeq++;
        const roll = Math.random();
        const status: ProductStatus = roll < 0.72 ? "active" : roll < 0.88 ? "out_of_stock" : "inactive";
        const stock = status === "out_of_stock" ? 0 : status === "inactive" ? int(0, 40) : one([0, 4, 8, 25, 60, 120, 300, 800]);
        const price = float(leaf.def.priceRange[0], leaf.def.priceRange[1]);
        const createdAt = daysAgo(int(0, 75)); // spreads listings for "New Arrivals" sorting
        const { name, description, specs } = buildProductContent(leaf.def, productSeq);

        // Rating is a display-only catalog aggregate (no review system yet).
        // Very recently listed products stay unrated, like a real storefront.
        const isBrandNew = createdAt.getTime() > daysAgo(3).getTime();
        const ratingCount = isBrandNew ? 0 : one([0, 0, 3, 6, 12, 28, 45, 90, 180, 340]);
        const rating = ratingCount === 0 ? 0 : Math.round(float(3.6, 5.0) * 10) / 10;

        const product = await prisma.product.create({
          data: {
            supplierId: supplier.user.id,
            name,
            categoryId: leaf.id,
            description,
            images: [
              `https://picsum.photos/seed/product${productSeq}a/800/800`,
              `https://picsum.photos/seed/product${productSeq}b/800/800`,
              `https://picsum.photos/seed/product${productSeq}c/800/800`,
            ],
            colors: pick(COLOR_PALETTE, int(2, 5)),
            specs: specs as Prisma.InputJsonValue,
            stock,
            price,
            moq: leaf.def.kind === "fabric" ? one([10, 25, 50, 100, 150, 200]) : one([5, 10, 20, 50, 100]),
            unit: leaf.def.unit,
            status,
            rating,
            ratingCount,
            createdAt,
          },
        });

        allProducts.push({ id: product.id, price: Number(product.price), supplierId: supplier.user.id });
      }
    }
  }
  console.log(`Seeded ${allProducts.length} products across ${suppliers.length} suppliers and ${leafRecords.length} leaf categories.`);

  console.log("Seeding cart items...");
  for (const buyer of buyers) {
    const itemCount = int(0, 4);
    const chosen = pick(allProducts, itemCount);
    for (const p of chosen) {
      await prisma.cartItem.upsert({
        where: { cartId_productId: { cartId: buyer.cart.id, productId: p.id } },
        update: {},
        create: { cartId: buyer.cart.id, productId: p.id, quantity: int(1, 5) * 10 },
      });
    }
  }

  console.log("Seeding orders across every status...");
  const ALL_ORDER_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "ready", "completed"];
  let orderSeq = 0;
  for (const buyer of buyers) {
    const orderCount = int(3, 6);
    for (let i = 0; i < orderCount; i++) {
      orderSeq++;
      const loc = one(CITIES);
      const items = pick(allProducts, int(1, 3));
      if (items.length === 0) continue;

      const status = ALL_ORDER_STATUSES[orderSeq % ALL_ORDER_STATUSES.length];

      await prisma.order.create({
        data: {
          buyerId: buyer.user.id,
          status,
          createdAt: daysAgo(int(1, 60)),
          shippingInfo: {
            fullName: `${buyer.user.email.split("@")[0]} Textiles`,
            phone: `+91 ${int(70000, 99999)}${int(10000, 99999)}`,
            addressLine: `${int(1, 200)}, ${["Sector", "Phase", "Block"][int(0, 2)]} ${int(1, 20)}`,
            city: loc.city,
            state: loc.state,
            postalCode: `${int(100000, 999999)}`,
            notes: Math.random() > 0.6 ? "Please deliver to the loading dock, call before arrival." : undefined,
          },
          items: {
            create: items.map((p) => ({
              productId: p.id,
              supplierId: p.supplierId,
              quantity: int(1, 4) * 10,
              priceAtOrder: p.price,
            })),
          },
        },
      });
    }
  }
  console.log(`Seeded ${orderSeq} orders.`);

  console.log("Seeding activity log...");
  const allUsers = [...suppliers.map((s) => s.user), ...buyers.map((b) => b.user)];
  const ACTIONS: { action: string; entityType: string }[] = [
    { action: "user.registered", entityType: "User" },
    { action: "product.created", entityType: "Product" },
    { action: "order.placed", entityType: "Order" },
    { action: "order.status_updated", entityType: "Order" },
    { action: "profile.updated", entityType: "User" },
  ];
  for (let i = 0; i < 50; i++) {
    const actor = one(allUsers);
    const { action, entityType } = one(ACTIONS);
    await prisma.activityLog.create({
      data: {
        actorId: actor.id,
        action,
        entityType,
        entityId: actor.id,
        createdAt: daysAgo(int(0, 60)),
      },
    });
  }

  console.log("\nSeed complete.");
  console.log("Login with any of these (password: Password123):");
  console.log("  admin@textilemarket.test");
  suppliers.forEach((s) => console.log(`  ${s.user.email}  (${s.profile.businessName})`));
  buyers.forEach((b) => console.log(`  ${b.user.email}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
