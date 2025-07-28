// /components/UberLoginButton.tsx
export default function UberLoginButton() {
  return (
    <a
      href="/api/uber/auth"
      className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
    >
      Connect Uber
    </a>
  );
}
