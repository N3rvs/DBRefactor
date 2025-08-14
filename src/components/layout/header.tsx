import Link from 'next/link';
import Image from 'next/image';
import { MainNav } from './main-nav';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/refactor" className="mr-6 flex items-center space-x-2">
            <Image src="/logo.svg" alt="DBRefactor Logo" width={32} height={32} />
            <span className="hidden font-bold sm:inline-block">
              DBRefactor
            </span>
          </Link>
          <MainNav />
        </div>
      </div>
    </header>
  );
}
