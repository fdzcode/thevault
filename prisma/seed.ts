import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Check if data has already been seeded
  const existingUsers = await db.user.count();
  if (existingUsers > 0) {
    console.log("Database already seeded — skipping.");
    return;
  }

  const hash = await bcrypt.hash("password123", 10);

  // ── Users ──────────────────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      email: "admin@thevault.com",
      password: hash,
      name: "Nick Franklin",
      memberNumber: "0001",
      role: "admin",
    },
  });

  const maya = await db.user.create({
    data: {
      email: "maya@thevault.com",
      password: hash,
      name: "Maya Chen",
      memberNumber: "0002",
      invitedById: admin.id,
    },
  });

  const jordan = await db.user.create({
    data: {
      email: "jordan@thevault.com",
      password: hash,
      name: "Jordan West",
      memberNumber: "0003",
      invitedById: admin.id,
    },
  });

  const alex = await db.user.create({
    data: {
      email: "alex@thevault.com",
      password: hash,
      name: "Alex Rivera",
      memberNumber: "0004",
      invitedById: maya.id,
    },
  });

  const sam = await db.user.create({
    data: {
      email: "sam@thevault.com",
      password: hash,
      name: "Sam Nakamura",
      memberNumber: "0005",
      invitedById: jordan.id,
    },
  });

  // ── Profiles ───────────────────────────────────────────────────────
  await db.profile.createMany({
    data: [
      {
        userId: admin.id,
        username: "nickfranklin",
        displayName: "Nick Franklin",
        bio: "Founder of The Vault. Collector of rare streetwear and custom sneakers.",
        location: "Los Angeles, CA",
        specialty: "Sneaker customization",
        instagramHandle: "@nickfranklin",
        twitterHandle: "@nickfranklin",
        verified: true,
      },
      {
        userId: maya.id,
        username: "mayachen",
        displayName: "Maya Chen",
        bio: "Vintage collector & jewelry designer. Finding beauty in craftsmanship.",
        location: "Brooklyn, NY",
        specialty: "Vintage jewelry",
        instagramHandle: "@mayamakes",
        websiteUrl: "https://mayachen.art",
      },
      {
        userId: jordan.id,
        username: "jordanwest",
        displayName: "Jordan West",
        bio: "Sneakerhead since '09. If it's rare, I've probably had it.",
        location: "Chicago, IL",
        specialty: "Rare sneakers",
        twitterHandle: "@jwestkicks",
      },
      {
        userId: alex.id,
        username: "alexrivera",
        displayName: "Alex Rivera",
        bio: "Streetwear photographer & collector. Documenting the culture.",
        location: "Miami, FL",
        specialty: "Streetwear photography",
        instagramHandle: "@alexshootsculture",
      },
      {
        userId: sam.id,
        username: "samnakamura",
        displayName: "Sam Nakamura",
        bio: "Print artist & designer. Limited runs only.",
        location: "Portland, OR",
        specialty: "Screen printing",
        websiteUrl: "https://samnakamura.com",
        instagramHandle: "@samprints",
      },
    ],
  });

  // ── Invite Codes ───────────────────────────────────────────────────
  await db.inviteCode.createMany({
    data: [
      { code: "VAULT2025", createdById: admin.id },
      { code: "MAYAINVITE", createdById: maya.id },
      { code: "JWEST-001", createdById: jordan.id, used: true, usedById: sam.id },
    ],
  });

  // ── Listings ───────────────────────────────────────────────────────
  const listing1 = await db.listing.create({
    data: {
      sellerId: maya.id,
      title: "Handcrafted Silver Chain Necklace",
      description:
        "One-of-a-kind sterling silver chain necklace. Each link hand-formed and soldered. 20 inch length, lobster clasp. Comes in a custom velvet pouch.",
      price: 28500,
      category: "jewelry",
      condition: "new",
      listingType: "for_sale",
      tags: "silver, handmade, chain, necklace, one of one",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=800",
        "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=800",
      ]),
    },
  });

  const listing2 = await db.listing.create({
    data: {
      sellerId: jordan.id,
      title: "Nike Dunk Low 'Panda' DS Size 10",
      description:
        "Brand new, deadstock. Never tried on. Original box and all accessories included. Receipt available upon request.",
      price: 15000,
      category: "footwear",
      condition: "new",
      listingType: "both",
      tags: "nike, dunk, panda, deadstock, size 10",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800",
        "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800",
      ]),
    },
  });

  const listing3 = await db.listing.create({
    data: {
      sellerId: sam.id,
      title: "Screen Print — 'Neon Dreams' 18x24 Limited Edition",
      description:
        "4-color screen print on 100lb French Paper. Edition of 25, numbered and signed. Fluorescent pink and teal ink with metallic gold accent.",
      price: 7500,
      category: "prints",
      condition: "new",
      listingType: "for_sale",
      tags: "screen print, limited edition, art, neon, signed",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
      ]),
    },
  });

  const listing4 = await db.listing.create({
    data: {
      sellerId: alex.id,
      title: "Vintage 1994 Stussy Logo Tee",
      description:
        "Original 1994 Stussy big logo tee in black. Size XL fits like a modern L. Minor fading consistent with age. No holes, no stains. A true grail piece.",
      price: 22000,
      category: "apparel",
      condition: "good",
      listingType: "trade",
      tags: "stussy, vintage, 90s, streetwear, tee, grail",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
        "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800",
      ]),
    },
  });

  const listing5 = await db.listing.create({
    data: {
      sellerId: admin.id,
      title: "Custom Air Force 1 'Vault Edition'",
      description:
        "Hand-painted Nike Air Force 1 Low. Custom colorway with premium leather paint that won't crack or peel. Size 11. One of one — will never be remade.",
      price: 45000,
      category: "footwear",
      condition: "new",
      listingType: "for_sale",
      tags: "nike, air force 1, custom, hand painted, one of one",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800",
        "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800",
        "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
      ]),
    },
  });

  const listing6 = await db.listing.create({
    data: {
      sellerId: maya.id,
      title: "Brass & Turquoise Cuff Bracelet",
      description:
        "Hand-forged brass cuff with inlaid turquoise stones. Adjustable fit. Each stone is naturally unique.",
      price: 19500,
      category: "jewelry",
      condition: "new",
      listingType: "both",
      tags: "brass, turquoise, cuff, bracelet, handmade",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: jordan.id,
      title: "Supreme Box Logo Hoodie FW17 Natural",
      description:
        "Size L. Worn a handful of times, no flaws. Thick and heavy like the old Supreme blanks. Comes with original bag.",
      price: 68000,
      category: "apparel",
      condition: "like_new",
      listingType: "trade",
      tags: "supreme, box logo, bogo, hoodie, fw17",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: sam.id,
      title: "Ceramic Incense Holder — Handmade",
      description:
        "Wheel-thrown ceramic incense holder with matte black glaze. Holds standard stick incense. Each one slightly unique due to handmade process.",
      price: 3500,
      category: "collectibles",
      condition: "new",
      listingType: "for_sale",
      tags: "ceramic, incense, handmade, pottery",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800",
      ]),
    },
  });

  // ── Additional Listings ────────────────────────────────────────────

  const listing9 = await db.listing.create({
    data: {
      sellerId: admin.id,
      title: "Nike SB Dunk Low 'Travis Scott' Size 11",
      description:
        "Deadstock, never worn. Comes with original box, extra laces, and special packaging. One of the most sought-after SB collabs of the decade.",
      price: 135000,
      category: "footwear",
      condition: "new",
      listingType: "for_sale",
      tags: "nike, sb, dunk, travis scott, cactus jack, deadstock, size 11, grail",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800",
        "https://images.unsplash.com/photo-1605348532760-6753d2c43329?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: maya.id,
      title: "Gold-Filled Signet Ring — Custom Engraving",
      description:
        "14k gold-filled signet ring. Can be customized with initials or a small symbol. Sizes 5-12 available. Allow 5-7 days for engraving.",
      price: 16500,
      category: "jewelry",
      condition: "new",
      listingType: "for_sale",
      tags: "gold, signet, ring, custom, engraving, personalized",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=800",
        "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: jordan.id,
      title: "New Balance 550 'White Green' Size 9",
      description:
        "Worn twice, practically brand new. No creasing on the toe box. Original box included. Classic colorway that goes with everything.",
      price: 11000,
      category: "footwear",
      condition: "like_new",
      listingType: "both",
      tags: "new balance, 550, white, green, size 9",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1539185441755-769473a23570?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: alex.id,
      title: "Vintage BAPE Shark Hoodie — 1st Camo",
      description:
        "OG BAPE full-zip shark hoodie in 1st camo green. Size L. Some pilling on the inside but exterior is clean. Shark teeth zipper works perfectly.",
      price: 52000,
      category: "apparel",
      condition: "good",
      listingType: "trade",
      tags: "bape, shark, hoodie, camo, vintage, streetwear, japanese",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: sam.id,
      title: "Screen Print — 'Tokyo Drift' 18x24 AP",
      description:
        "Artist proof from a sold-out edition. 5-color screen print on heavyweight cotton paper. Inspired by Japanese car culture. Signed on the back.",
      price: 12000,
      category: "prints",
      condition: "new",
      listingType: "for_sale",
      tags: "screen print, art, tokyo, japanese, car culture, artist proof, signed",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: admin.id,
      title: "Off-White x Nike Dunk Low 'Lot 01' Size 10.5",
      description:
        "The one that started the 50 lot series. DS with original box, zip tie, and extra laces. This is lot 01 of 50 — the most coveted of the set.",
      price: 87500,
      category: "footwear",
      condition: "new",
      listingType: "for_sale",
      tags: "off-white, nike, dunk, lot 01, virgil abloh, deadstock",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800",
        "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: maya.id,
      title: "Vintage Sterling Silver Chain — Cuban Link 22\"",
      description:
        "Heavy .925 sterling silver Cuban link chain. 22 inches, 8mm width. Beautiful patina that can be polished to a mirror shine or worn as-is. Solid weight — not hollow.",
      price: 37500,
      category: "jewelry",
      condition: "good",
      listingType: "both",
      tags: "sterling silver, cuban link, chain, vintage, heavy",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1515562141589-67f0d569b6db?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: jordan.id,
      title: "Jordan 1 Retro High OG 'Chicago' 2015 Size 10",
      description:
        "The holy grail. 2015 Chicago 1s in size 10. Worn 3x, minimal creasing. Outsole has very light wear. Comes with OG box. These only go up in value.",
      price: 110000,
      category: "footwear",
      condition: "like_new",
      listingType: "trade",
      tags: "jordan, jordan 1, chicago, retro, og, grail, size 10",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800",
        "https://images.unsplash.com/photo-1597045566677-8cf032ed6634?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: alex.id,
      title: "Palace Tri-Ferg Tee — White Size M",
      description:
        "Classic Palace tri-ferg logo tee. Size M, fits TTS. Worn and washed once. No cracking on the print. Crisp white.",
      price: 8500,
      category: "apparel",
      condition: "like_new",
      listingType: "for_sale",
      tags: "palace, tri-ferg, tee, streetwear, london",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: sam.id,
      title: "Handmade Leather Card Wallet — Horween Shell Cordovan",
      description:
        "Minimalist card wallet hand-stitched from Horween shell cordovan leather. Holds 4-6 cards and folded bills. Will develop a beautiful patina over time.",
      price: 9500,
      category: "accessories",
      condition: "new",
      listingType: "for_sale",
      tags: "leather, wallet, horween, shell cordovan, handmade, minimalist",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: admin.id,
      title: "Kaws Companion Figure — Open Edition Grey",
      description:
        "Kaws Companion figure in grey. 11 inches tall. Open edition but sold out everywhere. Displayed in a glass case — no flaws or discoloration.",
      price: 42000,
      category: "collectibles",
      condition: "like_new",
      listingType: "both",
      tags: "kaws, companion, figure, art toy, collectible",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: maya.id,
      title: "Pearl Drop Earrings — Freshwater Baroque",
      description:
        "Asymmetric baroque freshwater pearl drop earrings on 14k gold-filled ear wires. Each pearl is unique in shape — no two pairs are the same.",
      price: 13500,
      category: "jewelry",
      condition: "new",
      listingType: "for_sale",
      tags: "pearls, earrings, baroque, gold-filled, handmade",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: jordan.id,
      title: "Yeezy 350 V2 'Zebra' Size 11",
      description:
        "DS pair, only taken out of box for photos. One of the most iconic Yeezy colorways. Original box, tags, and receipt from Adidas Confirmed.",
      price: 27000,
      category: "footwear",
      condition: "new",
      listingType: "both",
      tags: "yeezy, adidas, 350 v2, zebra, kanye, deadstock",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1587563871167-1ee9c731aefb?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: alex.id,
      title: "Carhartt WIP Michigan Coat — Black Size L",
      description:
        "Carhartt WIP Michigan chore coat in black rigid denim. Size L. Worn a few times — just starting to show character. No rips or stains.",
      price: 14000,
      category: "apparel",
      condition: "good",
      listingType: "for_sale",
      tags: "carhartt, wip, chore coat, michigan, workwear, denim",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: sam.id,
      title: "Risograph Print — 'Bloom' A3 Edition of 30",
      description:
        "3-color risograph print on 150gsm paper. Fluorescent pink, teal, and gold. Numbered and signed. Edition of 30.",
      price: 5500,
      category: "prints",
      condition: "new",
      listingType: "for_sale",
      tags: "risograph, print, art, limited edition, signed, numbered",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: admin.id,
      title: "Bearbrick 1000% — Keith Haring",
      description:
        "Medicom Toy Bearbrick 1000% Keith Haring edition. 28 inches tall. Displayed in a dust-free case since purchase. A statement piece for any collection.",
      price: 95000,
      category: "collectibles",
      condition: "like_new",
      listingType: "trade",
      tags: "bearbrick, medicom, keith haring, art toy, 1000%, collectible",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1563396983906-b3795482a59a?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: maya.id,
      title: "Enamel Pin Set — 'Celestial Bodies' (4 pins)",
      description:
        "Set of 4 hard enamel pins: sun, moon, Saturn, and shooting star. Gold-plated with rubber clutch backs. Each pin is about 1 inch. Limited run of 100 sets.",
      price: 4200,
      category: "accessories",
      condition: "new",
      listingType: "for_sale",
      tags: "enamel pins, celestial, gold, limited edition, set",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: jordan.id,
      title: "Vintage Starter Jacket — Chicago Bulls 90s",
      description:
        "OG Starter satin jacket from the early 90s. Size XL. Snap buttons all work. Minor pilling on inside lining. Exterior is pristine. A true vintage grail.",
      price: 34000,
      category: "apparel",
      condition: "good",
      listingType: "trade",
      tags: "starter, bulls, chicago, vintage, 90s, nba, jacket, satin",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: alex.id,
      title: "Polaroid SX-70 Camera — Fully Refurbished",
      description:
        "Classic Polaroid SX-70 folding SLR camera. Professionally cleaned, new leather skin in tan. Tested and shooting perfectly. Uses SX-70 film (not included).",
      price: 28000,
      category: "collectibles",
      condition: "good",
      listingType: "both",
      tags: "polaroid, sx-70, camera, vintage, refurbished, analog",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800",
      ]),
    },
  });

  await db.listing.create({
    data: {
      sellerId: sam.id,
      title: "Woodblock Print — 'Waves' 12x16",
      description:
        "Hand-carved and hand-printed woodblock print on Japanese washi paper. Inspired by traditional ukiyo-e. Water-based inks. Edition of 15.",
      price: 8500,
      category: "prints",
      condition: "new",
      listingType: "for_sale",
      tags: "woodblock, print, japanese, ukiyo-e, washi, art, handmade",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=800",
      ]),
    },
  });

  // Sold listings for order flow
  const listingSold = await db.listing.create({
    data: {
      sellerId: jordan.id,
      title: "Jordan 4 Retro 'Military Black' Size 9.5",
      description: "Worn once indoors. Essentially brand new. OG box and extra laces.",
      price: 21000,
      category: "footwear",
      condition: "like_new",
      tags: "jordan, retro, military black",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1607853202273-797f1c22a38e?w=800",
      ]),
      status: "sold",
    },
  });

  const listingDelivered = await db.listing.create({
    data: {
      sellerId: sam.id,
      title: "Screen Print — 'Midnight Garden' 11x17",
      description: "2-color screen print. Edition of 50. Signed and numbered.",
      price: 4500,
      category: "prints",
      condition: "new",
      tags: "screen print, art",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1578926375605-eaf7559b1458?w=800",
      ]),
      status: "sold",
    },
  });

  // ── Vouches ────────────────────────────────────────────────────────
  await db.legitCheck.createMany({
    data: [
      { listingId: listing1.id, userId: admin.id },
      { listingId: listing1.id, userId: jordan.id },
      { listingId: listing1.id, userId: alex.id },
      { listingId: listing2.id, userId: maya.id },
      { listingId: listing2.id, userId: sam.id },
      { listingId: listing4.id, userId: admin.id },
      { listingId: listing5.id, userId: maya.id },
      { listingId: listing5.id, userId: jordan.id },
      { listingId: listing5.id, userId: alex.id },
      { listingId: listing5.id, userId: sam.id },
      { listingId: listing9.id, userId: maya.id },
      { listingId: listing9.id, userId: jordan.id },
      { listingId: listing9.id, userId: alex.id },
    ],
  });

  // ── Orders ─────────────────────────────────────────────────────────
  const addr1 = await db.shippingAddress.create({
    data: {
      fullName: "Nick Franklin",
      line1: "123 Vault Street",
      city: "Los Angeles",
      state: "CA",
      postalCode: "90001",
    },
  });

  const addr2 = await db.shippingAddress.create({
    data: {
      fullName: "Maya Chen",
      line1: "456 Art Ave, Apt 2B",
      city: "Brooklyn",
      state: "NY",
      postalCode: "11201",
    },
  });

  // Shipped order (admin bought from jordan)
  await db.order.create({
    data: {
      listingId: listingSold.id,
      buyerId: admin.id,
      sellerId: jordan.id,
      totalAmount: listingSold.price,
      status: "shipped",
      paymentMethod: "stripe",
      trackingNumber: "1Z999AA10123456784",
      shippingAddressId: addr1.id,
    },
  });

  // Delivered order with review (maya bought from sam)
  const order2 = await db.order.create({
    data: {
      listingId: listingDelivered.id,
      buyerId: maya.id,
      sellerId: sam.id,
      totalAmount: listingDelivered.price,
      status: "delivered",
      paymentMethod: "crypto",
      cryptoPaymentId: "NPay-demo-001",
      cryptoTransactionHash: "0xabc123def456789012345678901234567890abcd",
      shippingAddressId: addr2.id,
    },
  });

  // ── Reviews ────────────────────────────────────────────────────────
  await db.review.create({
    data: {
      orderId: order2.id,
      authorId: maya.id,
      sellerId: sam.id,
      rating: 5,
      comment: "Amazing print quality — even better in person. Sam shipped fast and packed it perfectly.",
    },
  });

  // ── Conversations & Messages ───────────────────────────────────────
  const conv1 = await db.conversation.create({
    data: {
      listingId: listing1.id,
      participants: {
        create: [{ userId: admin.id }, { userId: maya.id }],
      },
    },
  });

  await db.message.createMany({
    data: [
      {
        conversationId: conv1.id,
        senderId: admin.id,
        content: "Hey Maya, love the chain. Is the clasp sterling too or plated?",
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      },
      {
        conversationId: conv1.id,
        senderId: maya.id,
        content: "Thanks! Everything is solid sterling — clasp, jump rings, all of it.",
        createdAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      },
      {
        conversationId: conv1.id,
        senderId: admin.id,
        content: "That's great. Would you consider $250?",
        offerAmount: 25000,
        offerStatus: "pending",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
    ],
  });

  const conv2 = await db.conversation.create({
    data: {
      listingId: listing2.id,
      participants: {
        create: [{ userId: alex.id }, { userId: jordan.id }],
      },
    },
  });

  await db.message.createMany({
    data: [
      {
        conversationId: conv2.id,
        senderId: alex.id,
        content: "Still got these? Any chance you'd do $120?",
        offerAmount: 12000,
        offerStatus: "declined",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        conversationId: conv2.id,
        senderId: jordan.id,
        content: "Appreciate the offer but these are firm at $150. DS pairs are going for more everywhere else.",
        createdAt: new Date(Date.now() - 23 * 60 * 60 * 1000),
      },
      {
        conversationId: conv2.id,
        senderId: alex.id,
        content: "Fair enough, let me think about it. Clean pair for sure.",
        createdAt: new Date(Date.now() - 22 * 60 * 60 * 1000),
      },
    ],
  });

  console.log("Seed complete!");
  console.log("");
  console.log("5 users, 28 listings (26 active, 2 sold)");
  console.log("2 orders (1 shipped, 1 delivered w/ review)");
  console.log("2 conversations with messages & offers");
  console.log("13 vouches, 3 invite codes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
