import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Clear existing data
  await db.notification.deleteMany();
  await db.dispute.deleteMany();
  await db.message.deleteMany();
  await db.conversationParticipant.deleteMany();
  await db.conversation.deleteMany();
  await db.legitCheck.deleteMany();
  await db.review.deleteMany();
  await db.order.deleteMany();
  await db.shippingAddress.deleteMany();
  await db.listing.deleteMany();
  await db.inviteCode.deleteMany();
  await db.profile.deleteMany();
  await db.session.deleteMany();
  await db.account.deleteMany();
  await db.user.deleteMany();

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
      tags: "ceramic, incense, handmade, pottery",
      images: JSON.stringify([
        "https://images.unsplash.com/photo-1602028915047-37269d1a73f7?w=800",
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
  console.log("5 users, 10 listings (8 active, 2 sold)");
  console.log("2 orders (1 shipped, 1 delivered w/ review)");
  console.log("2 conversations with messages & offers");
  console.log("10 vouches, 3 invite codes");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
