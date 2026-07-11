import {getSiteContent} from "@/lib/content";
import styles from "./valuessection.module.scss";

const PublicIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM4 12C4 11.39 4.08 10.79 4.21 10.22L8.99 15V16C8.99 17.1 9.89 18 10.99 18V19.93C7.06 19.43 4 16.07 4 12ZM17.89 17.4C17.63 16.59 16.89 16 15.99 16H14.99V13C14.99 12.45 14.54 12 13.99 12H7.99V10H9.99C10.54 10 10.99 9.55 10.99 9V7H12.99C14.09 7 14.99 6.1 14.99 5V4.59C17.92 5.77 20 8.65 20 12C20 14.08 19.19 15.98 17.89 17.4Z" fill="#B2AC88"/>
    </svg>
);

const HandshakeIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12.222 19.8549C12.042 20.0349 11.722 20.0649 11.512 19.8549C11.332 19.6749 11.302 19.3549 11.512 19.1449L14.902 15.7549L13.492 14.3449L10.102 17.7349C9.91205 17.9349 9.59204 17.9249 9.39205 17.7349C9.18204 17.5249 9.21204 17.2049 9.39205 17.0249L12.782 13.6349L11.372 12.2249L7.98205 15.6149C7.80205 15.7949 7.48205 15.8249 7.27205 15.6149C7.08205 15.4249 7.08205 15.1049 7.27205 14.9049L10.662 11.5149L9.24204 10.1049L5.85205 13.4949C5.67205 13.6749 5.35205 13.7049 5.14205 13.4949C4.95204 13.2949 4.95204 12.9849 5.14205 12.7849L9.52205 8.40488L11.392 10.2649C12.342 11.2149 13.982 11.2049 14.932 10.2649C15.912 9.28488 15.912 7.70488 14.932 6.72488L13.072 4.86488L13.352 4.58488C14.132 3.80488 15.402 3.80488 16.182 4.58488L20.422 8.82488C21.202 9.60488 21.202 10.8749 20.422 11.6549L12.222 19.8549ZM21.832 13.0749C23.392 11.5149 23.392 8.98488 21.832 7.41488L17.592 3.17488C16.032 1.61488 13.502 1.61488 11.932 3.17488L11.652 3.45488L11.372 3.17488C9.81204 1.61488 7.28205 1.61488 5.71205 3.17488L2.17205 6.71488C0.752045 8.13488 0.622045 10.3449 1.77205 11.9049L3.22205 10.4549C2.83205 9.70488 2.96205 8.75488 3.59205 8.12488L7.13205 4.58488C7.91205 3.80488 9.18204 3.80488 9.96204 4.58488L13.522 8.14488C13.702 8.32488 13.732 8.64488 13.522 8.85488C13.312 9.06488 12.992 9.03488 12.812 8.85488L9.52205 5.57488L3.72205 11.3649C2.74205 12.3349 2.74205 13.9249 3.72205 14.9049C4.11205 15.2949 4.61205 15.5349 5.14205 15.6049C5.21205 16.1249 5.44205 16.6249 5.84205 17.0249C6.24205 17.4249 6.74205 17.6549 7.26205 17.7249C7.33205 18.2449 7.56205 18.7449 7.96205 19.1449C8.36205 19.5449 8.86204 19.7749 9.38204 19.8449C9.45204 20.3849 9.69204 20.8749 10.082 21.2649C10.552 21.7349 11.182 21.9949 11.852 21.9949C12.522 21.9949 13.152 21.7349 13.622 21.2649L21.832 13.0749Z" fill="#B2AC88"/>
    </svg>
);

const VerifiedUserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM19 11C19 15.52 16.02 19.69 12 20.93C7.98 19.69 5 15.52 5 11V6.3L12 3.19L19 6.3V11ZM7.41 11.59L6 13L10 17L18 9L16.59 7.58L10 14.17L7.41 11.59Z" fill="#B2AC88"/>
    </svg>
);

const PhoneIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20 15.5C18.75 15.5 17.55 15.3 16.43 14.93C16.33 14.9 16.22 14.88 16.12 14.88C15.86 14.88 15.61 14.98 15.41 15.17L13.21 17.37C10.38 15.93 8.06 13.62 6.62 10.79L8.82 8.58C9.1 8.31 9.18 7.92 9.07 7.57C8.7 6.45 8.5 5.25 8.5 4C8.5 3.45 8.05 3 7.5 3H4C3.45 3 3 3.45 3 4C3 13.39 10.61 21 20 21C20.55 21 21 20.55 21 20V16.5C21 15.95 20.55 15.5 20 15.5ZM5.03 5H6.53C6.6 5.88 6.75 6.75 6.99 7.59L5.79 8.8C5.38 7.59 5.12 6.32 5.03 5ZM19 18.97C17.68 18.88 16.4 18.62 15.2 18.21L16.4 17.01C17.25 17.25 18.12 17.4 19 17.46V18.97ZM12 3V13L15 10H21V3H12ZM19 8H14V5H19V8Z" fill="#B2AC88"/>
    </svg>
);

export default async function ValuesSection() {
    const c = await getSiteContent();

    return (
        <section className={styles.values}>
            <div className={styles.container}>
                <div className={styles.valuesContainer}>
                    <div className={styles.valueItem}>
                        <div className={styles.valueIcon}>
                            <VerifiedUserIcon />
                        </div>
                        <h3 className={styles.valueTitle}>{c['values/title-1']}</h3>
                        <p className={styles.valueDescription}>
                            {c['values/description-1']}
                        </p>
                        <div className={styles.valueDivider} />
                    </div>
                    <div className={styles.valueItem}>
                        <div className={styles.valueIcon}>
                            <PhoneIcon />
                        </div>
                        <h3 className={styles.valueTitle}>{c['values/title-2']}</h3>
                        <p className={styles.valueDescription}>
                            {c['values/description-2']}
                        </p>
                        <div className={styles.valueDivider} />
                    </div>
                    <div className={styles.valueItem}>
                        <div className={styles.valueIcon}>
                            <HandshakeIcon />
                        </div>
                        <h3 className={styles.valueTitle}>{c['values/title-3']}</h3>
                        <p className={styles.valueDescription}>
                            {c['values/description-3']}
                        </p>
                        <div className={styles.valueDivider} />
                    </div>
                    <div className={styles.valueItem}>
                        <div className={styles.valueIcon}>
                            <PublicIcon />
                        </div>
                        <h3 className={styles.valueTitle}>{c['values/title-4']}</h3>
                        <p className={styles.valueDescription}>
                            {c['values/description-4']}
                        </p>
                        <div className={styles.valueDivider} />
                    </div>
                </div>
            </div>
        </section>
    )
}