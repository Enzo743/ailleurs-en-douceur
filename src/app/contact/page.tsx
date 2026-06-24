import { Metadata } from "next";
import ContactForm from "@/app/contact/ContactForm";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Contact - Ailleurs en Douceur",
  description: "Contactez-nous pour organiser votre voyage sur mesure",
};

export default function ContactPage() {
  return (
    <main className={styles["contact-page"]}>
      <div className={styles["contact-container"]}>
        <div className={styles["contact-header"]}>
          <h1>Nous contacter</h1>
          <p className={styles.subtitle}>
            Remplissez ce formulaire et nous vous répondrons dans les plus brefs délais
            pour organiser l&apos;escapade de vos rêves.
          </p>
        </div>
        <ContactForm />
      </div>
    </main>
  );
}
