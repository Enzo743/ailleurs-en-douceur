import { getSiteContent } from '@/lib/content';
import Image from 'next/image';

export default async function Home() {
    const c = await getSiteContent();

    return (
        <main>
          <h1>{c['hero/title']}</h1>
          <p>{c['hero/subtitle']}</p>
          <Image
              src={c['hero/image'] || '/images/hero.jpg'}
              alt="Hero"
              width={1200}
              height={600}
          />
        </main>
    );
}
