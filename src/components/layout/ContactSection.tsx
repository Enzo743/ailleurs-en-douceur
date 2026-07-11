import {getSiteContent} from "@/lib/content";
import {BotanicalDecoration} from "@/components";
import styles from "./contactsection.module.scss";
import Link from "next/link";
import Image from "next/image";

export default async function ContactSection() {
    const c = await getSiteContent();

    return (
        <section className={styles.contact}>
            <div className={styles.container}>
                <div className={styles.contactContainer}>
                    <div className={styles.contactImage}>
                        <Image src={c['contact/image']}
                               alt="Contact"
                               fill
                               sizes="(max-width: 768px) 100vw, 20vw"
                        />
                    </div>
                    <div className={styles.contactContent}>
                        <h2 className={styles.contactTitle}>{c['contact/title']}</h2>
                        <p className={styles.contactDescription}>{c['contact/description']}</p>
                        <Link href={'/contact'} className={styles.contactButton}>
                            {c['contact/button']}
                            <BotanicalDecoration type={"botanical-17"} />
                        </Link>
                    </div>
                    <BotanicalDecoration />
                </div>
            </div>
        </section>
    )
}