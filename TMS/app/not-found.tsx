import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f7fa] p-4 text-center">
      <h1 className="text-4xl font-black text-[#16425B] mb-2">404</h1>
      <h2 className="text-base font-bold text-[#2F668F] mb-4">Page Not Found</h2>
      <p className="text-xs text-[#5A6E7F] max-w-sm mb-6">
        The requested page could not be found. Please sign in or return to your dashboard.
      </p>
      <Link
        href="/login"
        className="px-4 py-2 bg-[#16425B] text-white rounded-md text-xs font-semibold hover:bg-[#255273] transition-colors shadow-sm"
      >
        Go to Login
      </Link>
    </div>
  );
}
