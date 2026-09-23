interface SpinnerProps {
  label?: string;
}

export default function Spinner({ label }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-x-[10px] p-[40px] text-[16px] text-[#565959]">
      <span
        className="inline-block h-[22px] w-[22px] rounded-full border-2 border-[#d5d9d9] border-t-[#007185] animate-spin"
        aria-hidden="true"
      />
      {label && <span>{label}</span>}
    </div>
  );
}