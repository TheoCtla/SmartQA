import { useState } from "react";
import "./AuditForm.css";

function AuditForm({ onSubmit, isLoading }) {
   const [formData, setFormData] = useState({
      url: "",
      entreprise: "",
      activite: "",
      telephone_attendu: "",
      gerant_attendu: "",
      ville_attendue: "",
      adresse_attendue: "",
      siret_attendu: "",
      email_attendu: "",
      domaines_attendus: "",
      details: "",
   });
   const [errors, setErrors] = useState({});
   const [showAdvanced, setShowAdvanced] = useState(false);

   const validateUrl = (url) => {
      return url.startsWith("http://") || url.startsWith("https://");
   };

   // Format phone number with spaces: 01 23 45 67 89
   const formatPhoneNumber = (value) => {
      const digits = value.replace(/\D/g, "");
      const formatted = digits.match(/.{1,2}/g)?.join(" ") || "";
      return formatted.substring(0, 14);
   };

   const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (errors[name]) {
         setErrors((prev) => ({ ...prev, [name]: null }));
      }
   };

   const handlePhoneChange = (e) => {
      const formatted = formatPhoneNumber(e.target.value);
      setFormData((prev) => ({ ...prev, telephone_attendu: formatted }));
   };

   const handleSubmit = (e) => {
      e.preventDefault();

      const newErrors = {};

      if (!formData.url) {
         newErrors.url = "L'URL est requise";
      } else if (!validateUrl(formData.url)) {
         newErrors.url = "L'URL doit commencer par http:// ou https://";
      }

      if (!formData.entreprise) {
         newErrors.entreprise = "Le nom de l'entreprise est requis";
      }

      if (!formData.activite) {
         newErrors.activite =
            "L'activité est requise pour l'analyse de cohérence";
      }

      if (Object.keys(newErrors).length > 0) {
         setErrors(newErrors);
         return;
      }

      // Préparer les données pour l'API
      const apiData = {
         url: formData.url,
         entreprise: formData.entreprise,
         activite: formData.activite,
         telephone_attendu: formData.telephone_attendu || null,
         gerant_attendu: formData.gerant_attendu || null,
         ville_attendue: formData.ville_attendue || null,
         adresse_attendue: formData.adresse_attendue || null,
         siret_attendu: formData.siret_attendu || null,
         email_attendu: formData.email_attendu || null,
         domaines_attendus: formData.domaines_attendus
            ? formData.domaines_attendus
                 .split(",")
                 .map((d) => d.trim())
                 .filter(Boolean)
            : [],
         details: formData.details || null,
      };

      onSubmit(apiData);
   };

   return (
      <form className='audit-form card' onSubmit={handleSubmit}>
         <h2>Nouvel Audit</h2>
         <p className='form-subtitle'>
            Pipeline 6 étapes avec analyse IA avancée
         </p>

         {/* Section Obligatoire */}
         <div className='form-section'>
            <p className='form-section-label required'>Obligatoire</p>

            <div className='form-group'>
               <label htmlFor='url'>URL du site *</label>
               <input
                  type='text'
                  id='url'
                  name='url'
                  placeholder='https://exemple.webflow.io'
                  value={formData.url}
                  onChange={handleChange}
                  className={errors.url ? "error" : ""}
               />
               {errors.url && (
                  <span className='error-message'>{errors.url}</span>
               )}
            </div>
         </div>

         {/* Section Fortement recommandé */}
         <div className='form-section'>
            <p className='form-section-label recommended'>
               Fortement recommandé
            </p>

            <div className='form-row'>
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

               <div className='form-group'>
                  <label htmlFor='ville_attendue'>Ville</label>
                  <input
                     type='text'
                     id='ville_attendue'
                     name='ville_attendue'
                     placeholder='Narbonne'
                     value={formData.ville_attendue}
                     onChange={handleChange}
                  />
               </div>
            </div>

            <div className='form-group'>
               <label htmlFor='activite'>Activité de l'entreprise *</label>
               <textarea
                  id='activite'
                  name='activite'
                  placeholder='Ex: Magasin de literie spécialisé, vente de matelas, lits et accessoires de literie. Clientèle particuliers et professionnels dans la région de Narbonne...'
                  value={formData.activite}
                  onChange={handleChange}
                  className={errors.activite ? "error" : ""}
                  rows={3}
               />
               <span className='field-hint'>
                  Plus c'est détaillé, plus l'analyse sera précise
               </span>
               {errors.activite && (
                  <span className='error-message'>{errors.activite}</span>
               )}
            </div>
         </div>

         {/* Section Vérification infos */}
         <div className='form-section'>
            <p className='form-section-label verification'>
               Vérification des informations
            </p>

            <div className='form-row'>
               <div className='form-group'>
                  <label htmlFor='gerant_attendu'>
                     Nom du gérant / responsable
                  </label>
                  <input
                     type='text'
                     id='gerant_attendu'
                     name='gerant_attendu'
                     placeholder='Jean Dupont'
                     value={formData.gerant_attendu}
                     onChange={handleChange}
                  />
               </div>

               <div className='form-group'>
                  <label htmlFor='telephone_attendu'>Téléphone attendu</label>
                  <input
                     type='text'
                     id='telephone_attendu'
                     name='telephone_attendu'
                     placeholder='01 23 45 67 89'
                     value={formData.telephone_attendu}
                     onChange={handlePhoneChange}
                  />
               </div>
            </div>
         </div>

         {/* Section Optionnel avancé (collapsible) */}
         <div className='form-section'>
            <button
               type='button'
               className='form-section-toggle'
               onClick={() => setShowAdvanced(!showAdvanced)}
            >
               <span className={`toggle-arrow ${showAdvanced ? "open" : ""}`}>
                  ▶
               </span>
               Options avancées
            </button>

            {showAdvanced && (
               <div className='advanced-fields'>
                  <div className='form-row'>
                     <div className='form-group'>
                        <label htmlFor='email_attendu'>Email attendu</label>
                        <input
                           type='email'
                           id='email_attendu'
                           name='email_attendu'
                           placeholder='contact@entreprise.fr'
                           value={formData.email_attendu}
                           onChange={handleChange}
                        />
                     </div>

                     <div className='form-group'>
                        <label htmlFor='siret_attendu'>SIRET attendu</label>
                        <input
                           type='text'
                           id='siret_attendu'
                           name='siret_attendu'
                           placeholder='123 456 789 00012'
                           value={formData.siret_attendu}
                           onChange={handleChange}
                        />
                     </div>
                  </div>

                  <div className='form-group'>
                     <label htmlFor='adresse_attendue'>Adresse attendue</label>
                     <input
                        type='text'
                        id='adresse_attendue'
                        name='adresse_attendue'
                        placeholder='123 rue du Commerce, 11100 Narbonne'
                        value={formData.adresse_attendue}
                        onChange={handleChange}
                     />
                  </div>

                  <div className='form-group'>
                     <label htmlFor='domaines_attendus'>
                        Domaines officiels
                     </label>
                     <input
                        type='text'
                        id='domaines_attendus'
                        name='domaines_attendus'
                        placeholder='monsite.fr, monsite.com (séparés par des virgules)'
                        value={formData.domaines_attendus}
                        onChange={handleChange}
                     />
                     <span className='field-hint'>
                        Domaines considérés comme "officiels" pour la
                        vérification des liens
                     </span>
                  </div>

                  <div className='form-group'>
                     <label htmlFor='details'>
                        Détails / Objectifs / Promos
                     </label>
                     <textarea
                        id='details'
                        name='details'
                        placeholder='Ex: Promo -30% sur tous les lits pour Noël, mise en avant des matelas Emma, ouverture le dimanche...'
                        value={formData.details}
                        onChange={handleChange}
                        rows={3}
                     />
                  </div>
               </div>
            )}
         </div>

         <button type='submit' disabled={isLoading}>
            {isLoading ? "Analyse en cours..." : "Lancer l'audit"}
         </button>
      </form>
   );
}

export default AuditForm;
