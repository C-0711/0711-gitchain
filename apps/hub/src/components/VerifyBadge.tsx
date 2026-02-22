interface VerifyBadgeProps {
  verified: boolean;
  network?: string;
  batchId?: number;
  size?: "sm" | "md" | "lg";
}

export default function VerifyBadge({
  verified,
  network,
  batchId,
  size = "md",
}: VerifyBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-2",
  };

  if (!verified) {
    return (
      <span
        className={"rounded-full bg-gray-700 text-gray-400 " + sizeClasses[size]}
      >
        Unverified
      </span>
    );
  }

  return (
    <span
      className={
        "rounded-full bg-emerald-900/30 text-emerald-400 border border-emerald-700 " +
        sizeClasses[size]
      }
      title={network && batchId ? "Batch " + batchId + " on " + network : undefined}
    >
      ✓ Verified
    </span>
  );
}
