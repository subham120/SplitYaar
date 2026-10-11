import { X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function QrCodeModal({ title, value, onClose, subtitle }) {
  if (!value) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-ink m-0">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-canvas-parchment transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={18} color="var(--color-ink-muted-48)" />
          </button>
        </div>

        <div className="flex justify-center py-4">
          <div className="p-4 bg-white rounded-2xl shadow-xs" style={{ border: '1px solid var(--color-hairline)' }}>
            <QRCodeSVG
              value={value}
              size={220}
              level="H"
              fgColor="#1d1d1f"
              bgColor="#ffffff"
              imageSettings={{
                src: '/logo.png',
                height: 46,
                width: 46,
                excavate: true,
              }}
            />
          </div>
        </div>

        {subtitle && (
          <p className="text-center text-sm text-ink-muted-48 mt-3 m-0">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
