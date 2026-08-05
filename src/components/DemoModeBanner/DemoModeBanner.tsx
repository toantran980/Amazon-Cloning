export default function DemoModeBanner() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-[#fff4e5] border-b border-[#f5c877] text-[#7a4a0b] text-center text-[13px] py-[6px] px-[15px]"
    >
      ⚠️ <strong>Demo mode</strong> — This is a portfolio demonstration. No real payments are
      processed and your data is not stored.
    </div>
  );
}
