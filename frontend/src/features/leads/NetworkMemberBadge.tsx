import { BadgeCheck, Sparkles } from 'lucide-react';
import type { LeadVM } from './use-leads-api-queries';
import './network-member-badge.css';

type NetworkMemberBadgeProps = {
  lead: Pick<
    LeadVM,
    'isNetworkMember' | 'networkBadge' | 'networkMemberName' | 'networkPitch'
  >;
  size?: 'sm' | 'md';
  showPitch?: boolean;
};

export function NetworkMemberBadge({
  lead,
  size = 'sm',
  showPitch = false,
}: NetworkMemberBadgeProps) {
  if (!lead.isNetworkMember) return null;

  const isSponsored = lead.networkBadge === 'sponsored';
  const label = isSponsored ? 'Sponsored' : 'Verified';
  const Icon = isSponsored ? Sparkles : BadgeCheck;
  const iconSize = size === 'sm' ? 10 : 12;

  return (
    <div className={`network-member-wrap network-member-wrap-${size}`}>
      <span
        className={`network-member-badge${isSponsored ? ' sponsored' : ' verified'}`}
        title={
          lead.networkPitch ??
          `${lead.networkMemberName ?? 'This company'} is on the Scouter network`
        }
      >
        <Icon size={iconSize} strokeWidth={2.25} />
        {label}
      </span>
      {showPitch && lead.networkPitch ? (
        <p className="network-member-pitch">{lead.networkPitch}</p>
      ) : null}
    </div>
  );
}

export function sortLeadsWithNetworkPriority<T extends { isNetworkMember: boolean; score: number }>(
  leads: T[],
): T[] {
  return [...leads].sort((a, b) => {
    if (a.isNetworkMember !== b.isNetworkMember) {
      return a.isNetworkMember ? -1 : 1;
    }
    return b.score - a.score;
  });
}
