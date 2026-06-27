"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.scss";
import { getPackageLabel, PACKAGE_LABELS } from '@/lib/constants';

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  packageType: string;
  nights: string;
  message: string;
  privacyAccepted: boolean;
};

type FormErrors = {
  firstName?: string;
  lastName?: string;
  email?: string;
  packageType?: string;
  nights?: string;
  message?: string;
  privacyAccepted?: string;
};

// Options pour le select, base sur les constantes
const packageOptions = [
  { value: "", label: "Sélectionnez une formule" },
  { value: "escapade-en-douceur", label: PACKAGE_LABELS['escapade-en-douceur'] },
  { value: "voyage-sur-mesure", label: PACKAGE_LABELS['voyage-sur-mesure'] },
  { value: "voyage-de-noces", label: PACKAGE_LABELS['voyage-de-noces'] },
];

export default function ContactForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    packageType: "",
    nights: "",
    message: "",
    privacyAccepted: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; message: string } | null>(null);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = "Le prénom est obligatoire";
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = "Le nom est obligatoire";
    }

    if (!formData.email.trim()) {
      newErrors.email = "L'email est obligatoire";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Veuillez entrer un email valide";
    }

    if (!formData.packageType) {
      newErrors.packageType = "Veuillez sélectionner une formule";
    }

    if (!formData.nights.trim()) {
      newErrors.nights = "Le nombre de nuits est obligatoire";
    } else if (isNaN(parseInt(formData.nights)) || parseInt(formData.nights) <= 0) {
      newErrors.nights = "Veuillez entrer un nombre valide";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Le message est obligatoire";
    }

    if (!formData.privacyAccepted) {
      newErrors.privacyAccepted = "Vous devez accepter la politique de confidentialité";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined,
      });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitStatus({
          success: true,
          message: "Merci pour votre message ! Nous vous répondrons dans les plus brefs délais.",
        });
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          packageType: "",
          nights: "",
          message: "",
          privacyAccepted: false,
        });
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSubmitStatus({
          success: false,
          message: result.error || "Une erreur est survenue. Veuillez réessayer.",
        });
      }
    } catch (error) {
      setSubmitStatus({
        success: false,
        message: "Impossible de soumettre le formulaire. Veuillez vérifier votre connexion.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles["contact-form"]} onSubmit={handleSubmit}>
      {submitStatus && (
        <div className={`${styles["status-message"]} ${submitStatus.success ? styles.success : styles.error}`}>
          {submitStatus.message}
        </div>
      )}

      <div className={styles["form-grid"]}>
        <div className={styles["form-group"]}>
          <label htmlFor="firstName">Prénom *</label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className={errors.firstName ? styles.error : ""}
            placeholder="Votre prénom"
          />
          {errors.firstName && <span className={styles["error-message"]}>{errors.firstName}</span>}
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="lastName">Nom *</label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className={errors.lastName ? styles.error : ""}
            placeholder="Votre nom"
          />
          {errors.lastName && <span className={styles["error-message"]}>{errors.lastName}</span>}
        </div>

        <div className={`${styles["form-group"]} ${styles["full-width"]}`}>
          <label htmlFor="email">Email *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={errors.email ? styles.error : ""}
            placeholder="votre@email.com"
          />
          {errors.email && <span className={styles["error-message"]}>{errors.email}</span>}
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="packageType">Type de formule *</label>
          <select
            id="packageType"
            name="packageType"
            value={formData.packageType}
            onChange={handleChange}
            className={errors.packageType ? styles.error : ""}
          >
            {packageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.packageType && <span className={styles["error-message"]}>{errors.packageType}</span>}
        </div>

        <div className={styles["form-group"]}>
          <label htmlFor="nights">Nombre de nuits souhaité *</label>
          <input
            type="number"
            id="nights"
            name="nights"
            value={formData.nights}
            onChange={handleChange}
            className={errors.nights ? styles.error : ""}
            placeholder="1"
            min="1"
          />
          {errors.nights && <span className={styles["error-message"]}>{errors.nights}</span>}
        </div>

        <div className={`${styles["form-group"]} ${styles["full-width"]}`}>
          <label htmlFor="message">Votre message *</label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleChange}
            className={errors.message ? styles.error : ""}
            placeholder="Décrivez-nous vos attentes, vos dates préférées, votre budget, etc."
            rows={5}
          />
          {errors.message && <span className={styles["error-message"]}>{errors.message}</span>}
        </div>

        <div className={`${styles["form-group"]} ${styles["full-width"]} ${styles["checkbox-group"]}`}>
          <input
            type="checkbox"
            id="privacyAccepted"
            name="privacyAccepted"
            checked={formData.privacyAccepted}
            onChange={handleChange}
            className={errors.privacyAccepted ? styles.error : ""}
          />
          <label htmlFor="privacyAccepted" className={styles["checkbox-label"]}>
            J&apos;accepte la politique de confidentialité *
          </label>
          {errors.privacyAccepted && <span className={styles["error-message"]}>{errors.privacyAccepted}</span>}
        </div>

        <div className={`${styles["form-group"]} ${styles["full-width"]}`}>
          <button type="submit" className={styles["submit-button"]} disabled={isSubmitting}>
            {isSubmitting ? "Envoi en cours..." : "Envoyer votre demande"}
          </button>
        </div>
      </div>
    </form>
  );
}
