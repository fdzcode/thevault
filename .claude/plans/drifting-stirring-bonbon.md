# The Vault — Full Feature Build Plan

## Context
The backend and basic frontend are complete. The user wants to build out the full feature set for a secret, luxury, invite-only designer marketplace. This plan covers 12 approved features organized into 6 phases. Each phase builds on the previous. No major visual UI changes — keep the existing dark zinc theme.

---

## Phase 1: Foundation (Admin Role, Image Uploads, Email)

**Packages to install:** `uploadthing`, `@uploadthing/react`, `resend`

### Schema changes (`prisma/schema.prisma`)
- Add `role String @default("member")` to User model

### New files
| File | Purpose |
|---|---|
| `src/app/api/uploadthing/core.ts` | Upload router: listingImage (10 imgs, 4MB), profileAvatar (1, 2MB), profileBanner (1, 4MB) |
| `src/app/api/uploadthing/route.ts` | Next.js route handler for UploadThing |
| `src/lib/uploadthing.ts` | Client helpers: `generateUploadButton()`, `generateUploadDropzone()` |
| `src/lib/email.ts` | Resend wrapper: `sendEmail({ to, subject, html })` |
| `src/lib/email-templates.ts` | HTML templates for offer, order, message, review notifications |

### Modified files
| File | Change |
|---|---|
| `src/env.js` | Add `UPLOADTHING_TOKEN`, `RESEND_API_KEY` |
| `.env.example` | Add placeholders for new env vars |
| `src/server/api/trpc.ts` | Add `adminProcedure` (checks user role) |
| `src/server/auth/config.ts` | Add `role` to session type + JWT/session callbacks |
| `src/lib/validators.ts` | Add `offerStatusEnum`, `escrowStatusEnum`, `userRoleEnum`, `trustLevelEnum` |
| `src/components/create-listing-form.tsx` | Replace URL inputs with UploadThing `UploadButton` |
| `src/components/profile-form.tsx` | Replace avatar/banner URL inputs with UploadThing `UploadButton` |

---

## Phase 2: Offer System + Escrow

### Schema changes (`prisma/schema.prisma`)
- New `Offer` model: buyerId, listingId, amount, message, status (pending/accepted/rejected/countered/expired), counterAmount, orderId
- Add to Order: `escrowStatus` (held/released/disputed), `escrowReleasedAt`, `disputeReason`, `disputeResolvedAt`
- Add relations: User→offersMade, Listing→offers, Order→offer

### New files
| File | Purpose |
|---|---|
| `src/server/api/routers/offer.ts` | create, respond (accept/reject/counter), acceptCounter, checkout, getForListing, getMyOffers |
| `src/components/make-offer-button.tsx` | Replaces BuyButton — amount input, message, shipping address form |
| `src/components/offer-manager.tsx` | Seller view: list pending offers, accept/reject/counter actions |
| `src/components/offer-checkout.tsx` | Accepted offer → shipping form → Stripe checkout |
| `src/app/(marketplace)/offers/page.tsx` | My Offers page (sent + received tabs) |

### Modified files
| File | Change |
|---|---|
| `src/server/api/root.ts` | Register `offer` router |
| `src/server/api/routers/order.ts` | Add escrow logic to status flow, add `raiseDispute` + `resolveDispute` mutations |
| `src/app/api/webhooks/stripe/route.ts` | Set `escrowStatus: "held"` on payment, link offer |
| `src/components/buy-button.tsx` | Delete or replace entirely with make-offer-button |
| `src/app/(marketplace)/listings/[id]/page.tsx` | Replace BuyButton with MakeOfferButton, add OfferManager for seller |
| `src/components/order-actions.tsx` | Add dispute button, escrow status display |
| `src/components/nav-bar.tsx` | Add "My Offers" link |

---

## Phase 3: Direct Messaging + Notifications

### Schema changes (`prisma/schema.prisma`)
- New `Conversation` model: participant1Id, participant2Id, listingId (optional), lastMessageAt
- New `Message` model: conversationId, senderId, body, readAt
- New `Notification` model: userId, type, title, body, read, metadata (JSON string)

### New files
| File | Purpose |
|---|---|
| `src/server/api/routers/conversation.ts` | create, list, getById, sendMessage, markRead, unreadCount |
| `src/server/api/routers/notification.ts` | list, markRead, markAllRead, unreadCount |
| `src/lib/notifications.ts` | `createNotification()` — creates DB record + optional email |
| `src/app/(marketplace)/messages/page.tsx` | Conversation list page |
| `src/app/(marketplace)/messages/[id]/page.tsx` | Conversation detail page |
| `src/components/conversation-list.tsx` | Client: conversation list with polling (10s) |
| `src/components/message-thread.tsx` | Client: messages + input, polling (5s), auto-markRead |
| `src/components/message-button.tsx` | "Message Seller" button for listings/profiles |
| `src/components/notification-bell.tsx` | Client: bell icon in nav, unread count badge, dropdown |
| `src/app/(marketplace)/notifications/page.tsx` | Full notification history page |

### Modified files
| File | Change |
|---|---|
| `src/server/api/root.ts` | Register `conversation`, `notification` routers |
| `src/server/api/routers/offer.ts` | Create notifications on offer events |
| `src/server/api/routers/order.ts` | Create notifications on status changes |
| `src/server/api/routers/review.ts` | Create notification on review creation |
| `src/app/api/webhooks/stripe/route.ts` | Create notifications on payment events |
| `src/components/nav-bar.tsx` | Add Messages link + NotificationBell component |
| `src/app/(marketplace)/listings/[id]/page.tsx` | Add MessageButton |

---

## Phase 4: Wishlist, Activity Feed, Trust Scoring, Badges

### Schema changes (`prisma/schema.prisma`)
- New `Wishlist` model: userId, listingId (@@unique pair)
- New `ActivityEvent` model: type, actorId, metadata (JSON)
- New `TrustScore` model: userId (unique), transactionCount, completionRate, averageRating, accountAgeDays, referralCount, disputeRate, overallScore (0-100), trustLevel (new/bronze/silver/gold/platinum)
- New `Badge` model: userId, type, grantedAt (@@unique userId+type)

### New files
| File | Purpose |
|---|---|
| `src/server/api/routers/wishlist.ts` | toggle, isWishlisted, getMyWishlist, getCount |
| `src/server/api/routers/activity.ts` | getFeed (protected, paginated) |
| `src/server/api/routers/trust.ts` | getScore, recalculate |
| `src/lib/activity.ts` | `createActivityEvent()` helper |
| `src/lib/trust.ts` | `recalculateTrustScore()` — weighted composite score |
| `src/lib/badges.ts` | `evaluateBadges()` — auto-grant based on thresholds |
| `src/components/wishlist-button.tsx` | Heart/bookmark toggle on listings |
| `src/app/(marketplace)/wishlist/page.tsx` | Wishlist page |
| `src/app/(marketplace)/activity/page.tsx` | Activity feed page |
| `src/components/activity-feed.tsx` | Vague, atmospheric event descriptions (secret society vibe) |
| `src/components/trust-badge.tsx` | Colored trust level indicator |
| `src/components/badge-display.tsx` | Badge row with icons |

### Modified files
| File | Change |
|---|---|
| `src/server/api/root.ts` | Register `wishlist`, `activity`, `trust` routers |
| `src/server/api/routers/auth.ts` | Create activity event on registration |
| `src/server/api/routers/review.ts` | Trigger trust recalc + badge eval |
| `src/app/api/webhooks/stripe/route.ts` | Create "item_sold" activity event |
| `src/app/(marketplace)/listings/page.tsx` | Add WishlistButton to listing cards |
| `src/app/(marketplace)/listings/[id]/page.tsx` | Add WishlistButton |
| `src/app/profile/[username]/page.tsx` | Display trust badge + earned badges |
| `src/components/nav-bar.tsx` | Add Activity + Wishlist links |

---

## Phase 5: Admin Dashboard + Seller Dashboard

### New files
| File | Purpose |
|---|---|
| `src/server/api/routers/admin.ts` | listUsers, banUser, listAllOrders, listAllListings, moderateListing, grantVerification, grantBadge, revokeBadge, platformStats |
| `src/app/admin/page.tsx` | Admin dashboard with platform stats |
| `src/app/admin/layout.tsx` | Admin layout with sidebar nav |
| `src/components/admin/stat-card.tsx` | Reusable stat card |
| `src/components/admin/user-management.tsx` | User table with ban/verify actions |
| `src/components/admin/order-management.tsx` | Order table with dispute resolution |
| `src/components/admin/listing-management.tsx` | Listing moderation table |
| `src/app/(marketplace)/dashboard/page.tsx` | Seller dashboard page |
| `src/components/dashboard/seller-stats.tsx` | Stat cards: sales, revenue, listings, rating |
| `src/components/dashboard/revenue-chart.tsx` | CSS bar chart (12 months) |
| `src/components/dashboard/recent-sales.tsx` | Recent sales list |

### Modified files
| File | Change |
|---|---|
| `src/server/api/root.ts` | Register `admin` router |
| `src/server/api/routers/listing.ts` | Add `sellerStats` procedure |
| `src/server/api/routers/order.ts` | Add `recentSales` procedure |
| `src/components/nav-bar.tsx` | Add Dashboard + Admin links |

---

## Phase 6: Mobile Responsive Pass

CSS-only pass, no data model changes.

### New files
| File | Purpose |
|---|---|
| `src/components/mobile-nav.tsx` | Client component: hamburger toggle for nav links on small screens |

### Modified files
| File | Change |
|---|---|
| `src/components/nav-bar.tsx` | Desktop links `hidden md:flex`, hamburger `md:hidden`, integrate MobileNav |
| `src/app/page.tsx` | Responsive hero text `text-3xl sm:text-5xl`, stack buttons `flex-col sm:flex-row` |
| `src/app/(marketplace)/listings/page.tsx` | Grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` |
| All form components | Change `grid-cols-2` → `grid-cols-1 sm:grid-cols-2` |
| Dashboard pages | Responsive stat card grid |

---

## Verification
1. `npx prisma db push` applies all schema changes without errors
2. `npm run build` compiles with no TypeScript errors
3. Offer flow: make offer → seller accepts → buyer checks out → payment → escrow held → shipped → delivered → escrow released → review
4. Messaging: create conversation → send messages → see unread count → mark read
5. Notifications: bell shows count, dropdown lists recent, mark all read
6. Wishlist: toggle on listing, view on /wishlist page
7. Activity feed: vague events appear on /activity
8. Trust score: auto-recalculates after transactions, badges auto-granted
9. Admin: /admin shows stats, can ban users, moderate listings, resolve disputes
10. Seller dashboard: /dashboard shows sales, revenue, active listings
11. Mobile: nav collapses, forms stack, listings grid adjusts
