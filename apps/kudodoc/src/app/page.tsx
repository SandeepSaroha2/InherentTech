export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">KudoDoc</h1>
        <p className="text-xl text-gray-600 mb-8">AI-Native Digital Signatures</p>
        <div className="flex gap-4 justify-center">
          <a href="/documents" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Documents
          </a>
          <a href="/templates" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Templates
          </a>
          <a href="/settings" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Settings
          </a>
        </div>
      </div>
    </main>
  );
}
