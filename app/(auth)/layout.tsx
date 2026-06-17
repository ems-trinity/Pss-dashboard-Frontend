export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-2xl font-bold text-[#111827]">Trinity PSS</div>
          <div className="text-sm text-[#6B7280] mt-1">Substation Management Platform</div>
        </div>
        {children}
      </div>
    </div>
  );
}
