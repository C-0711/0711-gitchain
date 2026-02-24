"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Organization {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  website: string | null;
  verified: boolean;
  plan: string;
  created_at: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  email: string;
  name: string | null;
  username: string | null;
  avatar_url: string | null;
}

interface Stats {
  member_count: number;
  container_count: number;
  pending_invites: number;
}

export default function OrganizationPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrg() {
      try {
        const token = localStorage.getItem("gitchain_token");
        const headers: HeadersInit = {};
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const orgRes = await fetch(`/api/organizations/${slug}`, { headers });
        if (!orgRes.ok) {
          if (orgRes.status === 404) throw new Error("Organization not found");
          throw new Error("Failed to fetch organization");
        }
        const orgData = await orgRes.json();
        setOrg(orgData.organization);
        setRole(orgData.role);
        setStats(orgData.stats);

        const membersRes = await fetch(`/api/organizations/${slug}/members`, { headers });
        if (membersRes.ok) {
          const membersData = await membersRes.json();
          setMembers(membersData.members);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error loading organization");
      } finally {
        setLoading(false);
      }
    }
    fetchOrg();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Organization not found</h1>
          <p className="text-[#8b949e] mb-4">{error}</p>
          <Link href="/orgs" className="text-[#58a6ff] hover:underline">Back to organizations</Link>
        </div>
      </div>
    );
  }

  const isAdmin = role === "owner" || role === "admin";

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <div className="border-b border-[#30363d] bg-[#161b22]">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-[#30363d] flex items-center justify-center text-2xl">🏢</div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold text-white">{org.name}</h1>
                  {org.verified && <span className="px-2 py-0.5 bg-[#238636]/20 text-[#3fb950] text-xs rounded-full">✓ Verified</span>}
                  <span className="px-2 py-0.5 bg-[#30363d] text-[#8b949e] text-xs rounded-full uppercase">{org.plan}</span>
                </div>
                <p className="text-[#8b949e]">@{org.slug}</p>
                {org.description && <p className="text-[#8b949e] mt-1">{org.description}</p>}
              </div>
            </div>
            {isAdmin && (
              <Link href={`/orgs/${slug}/settings`} className="px-4 py-2 border border-[#30363d] rounded-md text-[#c9d1d9] hover:bg-[#30363d]">⚙️ Settings</Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="text-2xl font-bold text-white">{stats?.member_count || 0}</div>
            <div className="text-[#8b949e]">Members</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="text-2xl font-bold text-white">{stats?.container_count || 0}</div>
            <div className="text-[#8b949e]">Containers</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="text-2xl font-bold text-white">{stats?.pending_invites || 0}</div>
            <div className="text-[#8b949e]">Pending Invites</div>
          </div>
          <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-lg">
            <div className="text-2xl font-bold text-white capitalize">{role || "—"}</div>
            <div className="text-[#8b949e]">Your Role</div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Members</h2>
              {isAdmin && <Link href={`/orgs/${slug}/members`} className="text-sm text-[#58a6ff] hover:underline">Manage →</Link>}
            </div>
            <div className="bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden">
              {members.length === 0 ? (
                <div className="p-6 text-center text-[#8b949e]">No members yet</div>
              ) : (
                <div className="divide-y divide-[#30363d]">
                  {members.slice(0, 10).map((member) => (
                    <div key={member.id} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#30363d] flex items-center justify-center text-sm">
                          {(member.name || member.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-white">{member.name || member.username || member.email}</div>
                          <div className="text-xs text-[#8b949e]">{member.email}</div>
                        </div>
                      </div>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        member.role === "owner" ? "bg-[#da3633]/20 text-[#f85149]" :
                        member.role === "admin" ? "bg-[#a371f7]/20 text-[#a371f7]" :
                        "bg-[#30363d] text-[#8b949e]"
                      }`}>{member.role}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link href={`/containers/new?org=${slug}`} className="block w-full p-3 bg-[#238636] hover:bg-[#2ea043] text-white rounded-lg text-center">+ New Container</Link>
              {isAdmin && (
                <>
                  <Link href={`/orgs/${slug}/members/invite`} className="block w-full p-3 bg-[#161b22] border border-[#30363d] hover:border-[#484f58] text-white rounded-lg text-center">👤 Invite Member</Link>
                  <Link href={`/orgs/${slug}/settings`} className="block w-full p-3 bg-[#161b22] border border-[#30363d] hover:border-[#484f58] text-white rounded-lg text-center">⚙️ Settings</Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
