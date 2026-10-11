import { useState } from 'react';
import { Link2, QrCode, MessageCircle, Check } from 'lucide-react';

export default function InviteToolbar({ code, onShowQr }) {
  const [copied, setCopied] = useState(false);

  const inviteUrl = `${window.location.origin}/join/${code}`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Join our expense group on SplitYaar!\n${inviteUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="grid grid-cols-3 gap-2 animate-fade-in">
      <button
        onClick={handleCopyLink}
        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-md transition-all"
        style={{
          background: copied ? 'rgba(52, 199, 89, 0.08)' : 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          cursor: 'pointer',
        }}
      >
        {copied ? <Check size={18} color="var(--color-positive)" /> : <Link2 size={18} color="var(--color-primary)" />}
        <span className="text-xs font-medium" style={{ color: copied ? 'var(--color-positive)' : 'var(--color-ink-muted-80)' }}>
          {copied ? 'Copied!' : 'Copy Link'}
        </span>
      </button>

      <button
        onClick={onShowQr}
        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-md transition-all"
        style={{
          background: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          cursor: 'pointer',
        }}
      >
        <QrCode size={18} color="var(--color-primary)" />
        <span className="text-xs font-medium text-ink-muted-80">Scan QR</span>
      </button>

      <button
        onClick={handleWhatsApp}
        className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-md transition-all"
        style={{
          background: 'var(--color-canvas)',
          border: '1px solid var(--color-hairline)',
          cursor: 'pointer',
        }}
      >
        <MessageCircle size={18} color="#25d366" />
        <span className="text-xs font-medium text-ink-muted-80">WhatsApp</span>
      </button>
    </div>
  );
}
