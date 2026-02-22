import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { api } from "~/trpc/server";
import { InviteManager } from "~/components/invite-manager";
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
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">Invite Codes</h1>

      {/* Member Info */}
      <div className="mb-8 rounded border border-zinc-800 p-4">
        <h2 className="mb-3 text-lg font-semibold">Member Info</h2>
        <div className="space-y-1 text-sm text-zinc-300">
          {memberInfo.memberNumber && (
            <p>
              Member Number:{" "}
              <span className="font-mono font-semibold">
                #{memberInfo.memberNumber}
              </span>
            </p>
          )}
          {memberInfo.invitedBy && (
            <p>
              Invited by:{" "}
              <span className="font-semibold">
                {memberInfo.invitedBy.name}
                {memberInfo.invitedBy.memberNumber &&
                  ` (#${memberInfo.invitedBy.memberNumber})`}
              </span>
            </p>
          )}
          <p>Referrals: {memberInfo.referralCount}</p>
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
      {referralTree.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold">Referral Tree</h2>
          <ul className="space-y-3">
            {referralTree.map((invitee) => (
              <li key={invitee.id} className="rounded border border-zinc-800 p-3">
                <p className="font-semibold">
                  {invitee.name}
                  {invitee.memberNumber && (
                    <span className="ml-2 font-mono text-sm text-zinc-400">
                      #{invitee.memberNumber}
                    </span>
                  )}
                </p>
                {invitee.invitees.length > 0 && (
                  <ul className="mt-2 ml-4 space-y-1 border-l border-zinc-800 pl-4">
                    {invitee.invitees.map((sub) => (
                      <li key={sub.id} className="text-sm text-zinc-400">
                        {sub.name}
                        {sub.memberNumber && (
                          <span className="ml-2 font-mono text-xs">
                            #{sub.memberNumber}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
