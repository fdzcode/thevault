"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { goldButtonClass } from "~/lib/constants";

interface InviteCode {
  code: string;
  used: boolean;
  usedAt: Date | null;
  usedBy: { id: string; name: string | null } | null;
}

export function InviteManager({
  initialCodes,
  maxCodes,
}: {
  initialCodes: InviteCode[];
  maxCodes: number;
}) {
  const [codes, setCodes] = useState<InviteCode[]>(initialCodes);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const generateInvite = api.auth.generateInvite.useMutation({
    onSuccess: (result) => {
      setCodes((prev) => [
        { code: result.code, used: false, usedAt: null, usedBy: null },
        ...prev,
      ]);
      toast.success("Invite code generated");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Invite code copied to clipboard");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-muted text-xs tracking-widest uppercase mb-1">Invite Codes</p>
          <h2 className="font-display text-2xl font-light text-[var(--text-heading)]">
            <span className="gradient-text">{codes.length}</span>
            <span className="text-[var(--text-muted)] text-lg">/{maxCodes}</span>
          </h2>
        </div>
        <button
          onClick={() => generateInvite.mutate()}
          disabled={generateInvite.isPending || codes.length >= maxCodes}
          className={goldButtonClass}
        >
          {generateInvite.isPending ? "Generating..." : "Generate Code"}
        </button>
      </div>

      {generateInvite.error && (
        <p className="mb-4 text-sm text-red-400">
          {generateInvite.error.message}
        </p>
      )}

      {codes.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center">
          <p className="font-display text-lg italic text-[var(--text-muted)]">
            No invite codes yet. Generate one to invite someone.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {codes.map((invite) => (
            <li
              key={invite.code}
              className="glass-card rounded-2xl p-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                {/* Status dot */}
                {invite.used ? (
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[var(--text-muted)]" />
                ) : (
                  <span className="inline-block h-2.5 w-2.5 rounded-full bg-[#D4AF37] gold-pulse" />
                )}
                <div>
                  <span className="font-display text-2xl text-amber-500 tracking-wide">
                    {invite.code}
                  </span>
                  {invite.used ? (
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      Used{invite.usedBy?.name ? ` by ${invite.usedBy.name}` : ""}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs text-emerald-400">Available</p>
                  )}
                </div>
              </div>
              {!invite.used && (
                <button
                  onClick={() => handleCopy(invite.code)}
                  className="glass-card rounded-xl px-4 py-2 text-xs font-medium text-[var(--text-body)] transition hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
                >
                  {copiedCode === invite.code ? "Copied!" : "Copy"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
