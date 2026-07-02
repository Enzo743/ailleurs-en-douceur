import { getSiteContent } from '@/lib/content';
import Image from 'next/image';
import RichTextDisplay from '@/components/layout/RichTextDisplay';

export default async function Home() {
    const c = await getSiteContent();

    return (
        <main>
            <RichTextDisplay html={c['hero/title'] || ''} />
            <RichTextDisplay html={c['hero/subtitle'] || ''} />
            {c['hero/image'] && (
                <Image
                    src={c['hero/image']}
                    alt="Hero"
                    width={1200}
                    height={600}
                />
            )}
        </main>
    );
}
