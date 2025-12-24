import { useState } from "react";
import "./AuditForm.css";

function AuditForm({ onSubmit, isLoading }) {
   const [formData, setFormData] = useState({
      url: "",
      nomComplet: "",
      telephone: "",
      activite: "",
      entreprise: "",
      details: "",
   });
   const [errors, setErrors] = useState({});

   const validateUrl = (url) => {
      return url.startsWith("http://") || url.startsWith("https://");
   };

   // Format phone number with spaces: 01 23 45 67 89
   const formatPhoneNumber = (value) => {
      // Remove all non-digits
      const digits = value.replace(/\D/g, "");
      // Add space every 2 digits
      const formatted = digits.match(/.{1,2}/g)?.join(" ") || "";
      return formatted.substring(0, 14); // Max 10 digits + 4 spaces
   };

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      // Clear error when user starts typing
      if (errors[name]) {
         setErrors((prev) => ({ ...prev, [name]: null }));
      }
   };

   const handlePhoneChange = (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      setFormData((prev) => ({ ...prev, telephone: formatted }));
   };

   const handleSubmit = (e) => {
      e.preventDefault();

      const newErrors = {};

      if (!formData.url) {
         newErrors.url = "L'URL est requise";
      } else if (!validateUrl(formData.url)) {
         newErrors.url = "L'URL doit commencer par http:// ou https://";
      }

      if (!formData.activite) {
         newErrors.activite =
            "L'activité est requise pour l'analyse de cohérence";
      }

      if (!formData.entreprise) {
         newErrors.entreprise = "Le nom de l'entreprise est requis";
      }

      if (Object.keys(newErrors).length > 0) {
         setErrors(newErrors);
         return;
      }

      onSubmit(formData);
   };

   return (
      <form className='audit-form card' onSubmit={handleSubmit}>
         <h2>🔍 Nouvel Audit</h2>

         <div className='form-group'>
            <label htmlFor='url'>URL du site Webflow *</label>
            <input
               type='text'
               id='url'
               name='url'
               placeholder='https://exemple.webflow.io'
               value={formData.url}
               onChange={handleChange}
               className={errors.url ? "error" : ""}
            />
            {errors.url && <span className='error-message'>{errors.url}</span>}
         </div>

         {/* Label pour vérification simple */}
         <p className='form-section-label simple'>Vérification simple</p>

         <div className='form-row'>
            <div className='form-group'>
               <label htmlFor='nomComplet'>Nom complet du client</label>
               <input
                  type='text'
                  id='nomComplet'
                  name='nomComplet'
                  placeholder='Jean Dupont'
                  value={formData.nomComplet}
                  onChange={handleChange}
               />
            </div>

            <div className='form-group'>
               <label htmlFor='telephone'>Téléphone</label>
               <input
                  type='text'
                  id='telephone'
                  name='telephone'
                  placeholder='01 23 45 67 89'
                  value={formData.telephone}
                  onChange={handlePhoneChange}
               />
            </div>
         </div>

         {/* Label pour analyse IA */}
         <p className='form-section-label ai'>Utilisé pour l'analyse IA</p>

         <div className='form-row'>
            <div className='form-group'>
               <label htmlFor='activite'>Activité de l'entreprise *</label>
               <input
                  type='text'
                  id='activite'
                  name='activite'
                  placeholder='Magasin de literie, Cuisiniste...'
                  value={formData.activite}
                  onChange={handleChange}
                  className={errors.activite ? "error" : ""}
               />
               {errors.activite && (
                  <span className='error-message'>{errors.activite}</span>
               )}
            </div>

            <div className='form-group'>
               <label htmlFor='entreprise'>Nom de l'entreprise *</label>
               <input
                  type='text'
                  id='entreprise'
                  name='entreprise'
                  placeholder='France Literie Narbonne'
                  value={formData.entreprise}
                  onChange={handleChange}
                  className={errors.entreprise ? "error" : ""}
               />
               {errors.entreprise && (
                  <span className='error-message'>{errors.entreprise}</span>
               )}
            </div>
         </div>

         <div className='form-group'>
            <label htmlFor='details'>Détails / Objectifs du site</label>
            <textarea
               id='details'
               name='details'
               placeholder='Ex: Promo -30% sur tous les lits pour Noël, mise en avant des matelas Emma...'
               value={formData.details}
               onChange={handleChange}
               rows={3}
            />
         </div>

         <button type='submit' disabled={isLoading}>
            {isLoading ? "Analyse en cours..." : "Lancer l'audit"}
         </button>
      </form>
   );
}

export default AuditForm;
