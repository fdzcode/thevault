import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { InviteManager } from "~/components/invite-manager";
import { ReferralTree } from "~/components/referral-tree";
import { DEFAULT_INVITE_LIMIT } from "~/server/auth/invite-utils";

export default async function InvitesPage() {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  const [memberInfo, inviteCodes, referralTree] = await Promise.all([
    api.auth.myMemberInfo(),
    api.auth.myInviteCodes(),
    api.auth.referralTree(),
  ]);

  return (
    <main className="page-bg min-h-screen">
      {/* Header with gold gradient overlay */}
      <section className="relative overflow-hidden bg-gradient-to-b from-zinc-900 via-zinc-800 to-transparent px-4 pb-16 pt-20 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/5 h-1 w-1 rounded-full bg-[#D4AF37]/30 animate-gold-pulse" />
          <div className="absolute top-1/3 right-1/3 h-1.5 w-1.5 rounded-full bg-[#D4AF37]/20 animate-gold-pulse" style={{ animationDelay: "1.5s" }} />
        </div>
        <div className="relative z-10">
          {/* Floating key icon */}
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4AF37]/10 key-float">
            <svg className="h-8 w-8 text-[#D4AF37]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" />
            </svg>
          </div>
          <h1 className="font-display text-5xl font-light gradient-text">Your Invitations</h1>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            You have <span className="font-semibold text-[#D4AF37]">{inviteCodes.filter(c => !c.used).length}</span> invite{inviteCodes.filter(c => !c.used).length !== 1 ? "s" : ""} available
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-2xl px-4 pb-16">
        {/* Member Info */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <p className="text-muted text-xs tracking-widest uppercase mb-3">Member Details</p>
          <div className="space-y-2 text-sm text-[var(--text-body)]">
            {memberInfo.memberNumber && (
              <p>
                Member Number:{" "}
                <span className="font-display text-lg font-semibold text-[#D4AF37]">
                  #{memberInfo.memberNumber}
                </span>
              </p>
            )}
            {memberInfo.invitedBy && (
              <p>
                Invited by:{" "}
                <span className="font-semibold text-[var(--text-heading)]">
                  {memberInfo.invitedBy.name}
                  {memberInfo.invitedBy.memberNumber &&
                    ` (#${memberInfo.invitedBy.memberNumber})`}
                </span>
              </p>
            )}
            <p>
              Referrals: <span className="font-semibold text-[var(--text-heading)]">{memberInfo.referralCount}</span>
            </p>
          </div>
        </div>

        {/* Invite Code Manager (client component) */}
        <div className="mb-8">
          <InviteManager
            initialCodes={inviteCodes}
            maxCodes={DEFAULT_INVITE_LIMIT}
          />
        </div>

        {/* Referral Tree */}
        <div>
          <p className="text-muted text-xs tracking-widest uppercase mb-2">Your Network</p>
          <h2 className="font-display text-2xl font-light text-[var(--text-heading)] mb-4">
            Referral <span className="gradient-text">Tree</span>
          </h2>
          <div className="glass-card rounded-2xl p-6">
            <ReferralTree
              invitees={referralTree}
              openSlots={inviteCodes.filter((c) => !c.used).length}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t divider-line py-8 text-center">
        <p className="font-display text-sm tracking-widest gradient-text">THE VAULT</p>
      </footer>
    </main>
  );
}
