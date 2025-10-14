import Image from 'next/image';

const Header = () => {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center gap-4">
          <Image
            src="/short-logo.png"
            alt="Roaming Map Logo"
            width={40}
            height={40}
            className="rounded-lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Roaming Map</h1>
            <p className="text-gray-600">Travel Q&A Platform</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
