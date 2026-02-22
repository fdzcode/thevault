"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

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
    },
  });

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Your Invite Codes ({codes.length}/{maxCodes})
        </h2>
        <button
          onClick={() => generateInvite.mutate()}
          disabled={generateInvite.isPending || codes.length >= maxCodes}
          className="rounded bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:opacity-50"
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
        <p className="text-sm text-zinc-500">
          No invite codes yet. Generate one to invite someone.
        </p>
      ) : (
        <ul className="space-y-2">
          {codes.map((invite) => (
            <li
              key={invite.code}
              className="flex items-center justify-between rounded border border-zinc-800 px-4 py-3"
            >
              <div>
                <span className="font-mono text-sm font-semibold">
                  {invite.code}
                </span>
                {invite.used ? (
                  <span className="ml-3 text-xs text-zinc-500">
                    Used{invite.usedBy?.name ? ` by ${invite.usedBy.name}` : ""}
                  </span>
                ) : (
                  <span className="ml-3 text-xs text-green-400">Available</span>
                )}
              </div>
              {!invite.used && (
                <button
                  onClick={() => handleCopy(invite.code)}
                  className="text-xs text-zinc-400 transition hover:text-white"
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
