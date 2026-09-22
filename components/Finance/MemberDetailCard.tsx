import MemberDetailLayout from './MemberDetailLayout';

interface MemberDetailCardProps {
  showBreakdown?: boolean;
  onToggleBreakdown?: (showBreakdown: boolean) => void;
}

function MemberDetailCard({ showBreakdown = false, onToggleBreakdown }: MemberDetailCardProps) {
  return (
    <div className="h-full min-h-0 w-full flex-1 overflow-hidden text-foreground">
      <MemberDetailLayout showBreakdown={showBreakdown} onToggleBreakdown={onToggleBreakdown} />
    </div>
  );
}

export default MemberDetailCard;
