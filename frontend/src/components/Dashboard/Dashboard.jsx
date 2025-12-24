import { useState } from "react";
import "./Dashboard.css";

function Dashboard({ results, formData }) {
   const { orthographe = [], coherence = {}, liens = [] } = results;
   const { telephone = "", nomComplet = "" } = formData || {};
   const [showAllErrors, setShowAllErrors] = useState(false);

   // État pour les sections collapsibles
   const [collapsedSections, setCollapsedSections] = useState({
      alertes: false,
      coherence: false,
      textesHorsSujet: false,
      metaSeo: false,
      medias: false,
      liens: false,
   });

   const toggleSection = (section) => {
      setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
   };

   // Composant pour les en-têtes de section
   const SectionHeader = ({ title, section }) => (
      <h2 className='section-header' onClick={() => toggleSection(section)}>
         <span>{title}</span>
         <span
            className={`collapse-arrow ${
               collapsedSections[section] ? "collapsed" : ""
            }`}
         >
            ▼
         </span>
      </h2>
   );

   // Limiter à 2 erreurs si pas en mode "voir plus"
   const displayedErrors = showAllErrors
      ? orthographe
      : orthographe.slice(0, 2);
   const hiddenCount = orthographe.length - 2;

   return (
      <div className='dashboard'>
         {/* Section Alertes Linguistiques */}
         <section className='dashboard-section card'>
            <SectionHeader title='Alertes Linguistiques' section='alertes' />
            {!collapsedSections.alertes &&
               (orthographe.length === 0 ? (
                  <div className='alert alert-success'>
                     ✅ Aucune erreur orthographique ou grammaticale détectée
                  </div>
               ) : (
                  <>
                     <div className='alerts-list'>
                        {displayedErrors.map((item, index) => (
                           <div key={index} className='alert alert-warning'>
                              <div className='alert-header'>
                                 <span className='error-word'>
                                    « {item.erreur} »
                                 </span>
                                 <span className='arrow'>→</span>
                                 <span className='correction-word'>
                                    « {item.correction} »
                                 </span>
                              </div>
                              {item.contexte && (
                                 <p className='alert-context'>
                                    {item.contexte}
                                 </p>
                              )}
                              {item.page && (
                                 <p className='alert-page'>
                                    📄{" "}
                                    <a
                                       href={item.page}
                                       target='_blank'
                                       rel='noopener noreferrer'
                                    >
                                       {item.page.replace(
                                          /https?:\/\/[^/]+/,
                                          ""
                                       )}
                                    </a>
                                 </p>
                              )}
                           </div>
                        ))}
                     </div>
                     {orthographe.length > 2 && !showAllErrors && (
                        <div className='show-more-section'>
                           <p className='error-count'>
                              {orthographe.length} erreurs détectées au total
                           </p>
                           <button
                              className='btn-show-more'
                              onClick={() => setShowAllErrors(true)}
                           >
                              Voir plus (+{hiddenCount})
                           </button>
                        </div>
                     )}
                     {showAllErrors && orthographe.length > 2 && (
                        <button
                           className='btn-show-less'
                           onClick={() => setShowAllErrors(false)}
                        >
                           Voir moins
                        </button>
                     )}
                  </>
               ))}
         </section>

         {/* Section Alertes de Cohérence */}
         <section className='dashboard-section card'>
            <SectionHeader
               title='🔎 Vérification des informations'
               section='coherence'
            />
            {!collapsedSections.coherence && (
               <>
                  {/* Téléphone */}
                  <div
                     className={`comparison-box ${
                        coherence.telephone_valide ? "valid" : "invalid"
                     }`}
                  >
                     <div className='comparison-header'>
                        <span className='comparison-icon'>
                           {coherence.telephone_valide ? "✅" : "⚠️"}
                        </span>
                        <span className='comparison-title'>Téléphone</span>
                     </div>
                     <div className='comparison-content'>
                        <div className='comparison-row'>
                           <span className='comparison-label'>Saisi :</span>
                           <span className='comparison-value'>
                              {telephone || "Non fourni"}
                           </span>
                        </div>
                        <div className='comparison-row'>
                           <span className='comparison-label'>
                              Trouvé sur le site :
                           </span>
                           <span className='comparison-value'>
                              {coherence.telephone_message || "Non analysé"}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Nom */}
                  <div
                     className={`comparison-box ${
                        coherence.nom_valide ? "valid" : "invalid"
                     }`}
                  >
                     <div className='comparison-header'>
                        <span className='comparison-icon'>
                           {coherence.nom_valide ? "✅" : "⚠️"}
                        </span>
                        <span className='comparison-title'>Nom du client</span>
                     </div>
                     <div className='comparison-content'>
                        <div className='comparison-row'>
                           <span className='comparison-label'>Saisi :</span>
                           <span className='comparison-value'>
                              {nomComplet || "Non fourni"}
                           </span>
                        </div>
                        <div className='comparison-row'>
                           <span className='comparison-label'>
                              Trouvé sur le site :
                           </span>
                           <span className='comparison-value'>
                              {coherence.nom_message || "Non analysé"}
                           </span>
                        </div>
                     </div>
                  </div>
               </>
            )}
         </section>

         {/* Section Cohérence par Page */}
         <section className='dashboard-section card'>
            <SectionHeader
               title='Cohérence par page'
               section='textesHorsSujet'
            />
            {!collapsedSections.textesHorsSujet &&
               (results.pagesCoherence && results.pagesCoherence.length > 0 ? (
                  <>
                     {/* Résumé */}
                     <div className='coherence-summary'>
                        <span className='coherent-count'>
                           ✅{" "}
                           {
                              results.pagesCoherence.filter((p) => p.coherent)
                                 .length
                           }{" "}
                           page(s) cohérente(s)
                        </span>
                        <span className='incoherent-count'>
                           ⚠️{" "}
                           {
                              results.pagesCoherence.filter((p) => !p.coherent)
                                 .length
                           }{" "}
                           page(s) avec problèmes
                        </span>
                     </div>

                     {/* Liste des pages */}
                     <div className='pages-coherence-list'>
                        {/* D'abord les pages avec problèmes */}
                        {results.pagesCoherence
                           .filter((page) => !page.coherent)
                           .map((page, index) => (
                              <div
                                 key={`inc-${index}`}
                                 className='page-coherence-item incoherent'
                              >
                                 <div className='page-header'>
                                    <span className='page-status'>⚠️</span>
                                    <div className='page-info'>
                                       <a
                                          href={page.url}
                                          target='_blank'
                                          rel='noopener noreferrer'
                                          className='page-url'
                                       >
                                          {page.slug || "/"}
                                       </a>
                                       <span className='page-theme'>
                                          Thème : {page.theme}
                                       </span>
                                    </div>
                                 </div>
                                 {page.issues && page.issues.length > 0 && (
                                    <div className='page-issues'>
                                       {page.issues.map((issue, i) => (
                                          <div key={i} className='issue-item'>
                                             <p className='issue-texte'>
                                                « {issue.texte} »
                                             </p>
                                             <p className='issue-raison'>
                                                {issue.raison}
                                             </p>
                                          </div>
                                       ))}
                                    </div>
                                 )}
                              </div>
                           ))}

                        {/* Ensuite les pages cohérentes (collapsed par défaut) */}
                        {results.pagesCoherence.filter((p) => p.coherent)
                           .length > 0 && (
                           <details className='coherent-pages-details'>
                              <summary className='coherent-pages-summary'>
                                 ✅{" "}
                                 {
                                    results.pagesCoherence.filter(
                                       (p) => p.coherent
                                    ).length
                                 }{" "}
                                 page(s) sans problème
                              </summary>
                              {results.pagesCoherence
                                 .filter((page) => page.coherent)
                                 .map((page, index) => (
                                    <div
                                       key={`coh-${index}`}
                                       className='page-coherence-item coherent'
                                    >
                                       <div className='page-header'>
                                          <span className='page-status'>
                                             ✅
                                          </span>
                                          <div className='page-info'>
                                             <a
                                                href={page.url}
                                                target='_blank'
                                                rel='noopener noreferrer'
                                                className='page-url'
                                             >
                                                {page.slug || "/"}
                                             </a>
                                             <span className='page-theme'>
                                                Thème : {page.theme}
                                             </span>
                                          </div>
                                       </div>
                                    </div>
                                 ))}
                           </details>
                        )}
                     </div>
                  </>
               ) : (
                  <div className='alert alert-success'>
                     ✅ Aucune page analysée ou toutes les pages sont cohérentes
                  </div>
               ))}
         </section>

         {/* Section Meta SEO */}
         <section className='dashboard-section card'>
            <SectionHeader title='Meta SEO' section='metaSeo' />
            {!collapsedSections.metaSeo &&
               (results.metas && results.metas.length > 0 ? (
                  <>
                     <div className='meta-summary'>
                        <span>
                           📝{" "}
                           <strong>
                              {
                                 results.metas.filter((m) => m.title_valide)
                                    .length
                              }
                           </strong>
                           /{results.metas.length} titres valides
                        </span>
                        <span>
                           📄{" "}
                           <strong>
                              {
                                 results.metas.filter(
                                    (m) => m.description_valide
                                 ).length
                              }
                           </strong>
                           /{results.metas.length} descriptions valides
                        </span>
                     </div>
                     <div className='metas-list'>
                        {results.metas.map((meta, index) => (
                           <div key={index} className='meta-item'>
                              <div className='meta-url'>
                                 📄{" "}
                                 <a
                                    href={meta.url}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                 >
                                    {meta.url.replace(/https?:\/\/[^/]+/, "")}
                                 </a>
                              </div>
                              <div className='meta-content'>
                                 <div
                                    className={`meta-field ${
                                       meta.title_valide ? "valid" : "invalid"
                                    }`}
                                 >
                                    <span className='meta-label'>Title:</span>
                                    <span className='meta-value'>
                                       {meta.title || "(vide)"}
                                    </span>
                                    {meta.title_valide ? "✅" : "⚠️"}
                                 </div>
                                 <div
                                    className={`meta-field ${
                                       meta.description_valide
                                          ? "valid"
                                          : "invalid"
                                    }`}
                                 >
                                    <span className='meta-label'>
                                       Description:
                                    </span>
                                    <span className='meta-value'>
                                       {meta.description || "(vide)"}
                                    </span>
                                    {meta.description_valide ? "✅" : "⚠️"}
                                 </div>
                                 {meta.commentaire && (
                                    <p className='meta-comment'>
                                       {meta.commentaire}
                                    </p>
                                 )}
                              </div>
                           </div>
                        ))}
                     </div>
                  </>
               ) : (
                  <div className='alert alert-success'>
                     ✅ Aucun meta tag à analyser
                  </div>
               ))}
         </section>

         {/* Section Liens externes */}
         <section className='dashboard-section card'>
            <SectionHeader title='Liens externes' section='medias' />
            {!collapsedSections.medias &&
               (results.liensExternesAnalysis?.liens_externes?.length > 0 ? (
                  <div className='links-columns three-columns'>
                     {/* Colonne liens OK */}
                     <div className='links-column valid-column'>
                        <h4>
                           Liens OK (
                           {
                              results.liensExternesAnalysis.liens_externes.filter(
                                 (l) =>
                                    l.valide &&
                                    l.httpStatus !== "broken" &&
                                    l.httpStatus !== "error"
                              ).length
                           }
                           )
                        </h4>
                        <div className='links-list'>
                           {results.liensExternesAnalysis.liens_externes
                              .filter(
                                 (l) =>
                                    l.valide &&
                                    l.httpStatus !== "broken" &&
                                    l.httpStatus !== "error"
                              )
                              .map((lien, index) => (
                                 <div key={index} className='link-item valid'>
                                    <a
                                       href={lien.url}
                                       target='_blank'
                                       rel='noopener noreferrer'
                                       className='link-url'
                                    >
                                       {lien.url.length > 50
                                          ? lien.url.substring(0, 50) + "..."
                                          : lien.url}
                                    </a>
                                    {lien.pages && lien.pages.length > 0 && (
                                       <p className='link-pages'>
                                          📄 {lien.pages.join(", ")}
                                       </p>
                                    )}
                                 </div>
                              ))}
                           {results.liensExternesAnalysis.liens_externes.filter(
                              (l) =>
                                 l.valide &&
                                 l.httpStatus !== "broken" &&
                                 l.httpStatus !== "error"
                           ).length === 0 && <p className='no-items'>Aucun</p>}
                        </div>
                     </div>

                     {/* Colonne liens à vérifier (Gemini) */}
                     <div className='links-column invalid-column'>
                        <h4>
                           À vérifier (
                           {
                              results.liensExternesAnalysis.liens_externes.filter(
                                 (l) =>
                                    !l.valide &&
                                    l.httpStatus !== "broken" &&
                                    l.httpStatus !== "error"
                              ).length
                           }
                           )
                        </h4>
                        <div className='links-list'>
                           {results.liensExternesAnalysis.liens_externes
                              .filter(
                                 (l) =>
                                    !l.valide &&
                                    l.httpStatus !== "broken" &&
                                    l.httpStatus !== "error"
                              )
                              .map((lien, index) => (
                                 <div key={index} className='link-item invalid'>
                                    <a
                                       href={lien.url}
                                       target='_blank'
                                       rel='noopener noreferrer'
                                       className='link-url'
                                    >
                                       {lien.url.length > 50
                                          ? lien.url.substring(0, 50) + "..."
                                          : lien.url}
                                    </a>
                                    {lien.pages && lien.pages.length > 0 && (
                                       <p className='link-pages'>
                                          📄 {lien.pages.join(", ")}
                                       </p>
                                    )}
                                    {lien.raison && (
                                       <p className='link-raison'>
                                          {lien.raison}
                                       </p>
                                    )}
                                 </div>
                              ))}
                           {results.liensExternesAnalysis.liens_externes.filter(
                              (l) =>
                                 !l.valide &&
                                 l.httpStatus !== "broken" &&
                                 l.httpStatus !== "error"
                           ).length === 0 && <p className='no-items'>Aucun</p>}
                        </div>
                     </div>

                     {/* Colonne liens cassés (HTTP) */}
                     <div className='links-column broken-column'>
                        <h4>
                           Liens cassés (
                           {
                              results.liensExternesAnalysis.liens_externes.filter(
                                 (l) =>
                                    l.httpStatus === "broken" ||
                                    l.httpStatus === "error"
                              ).length
                           }
                           )
                        </h4>
                        <div className='links-list'>
                           {results.liensExternesAnalysis.liens_externes
                              .filter(
                                 (l) =>
                                    l.httpStatus === "broken" ||
                                    l.httpStatus === "error"
                              )
                              .map((lien, index) => (
                                 <div key={index} className='link-item broken'>
                                    <a
                                       href={lien.url}
                                       target='_blank'
                                       rel='noopener noreferrer'
                                       className='link-url'
                                    >
                                       {lien.url.length > 50
                                          ? lien.url.substring(0, 50) + "..."
                                          : lien.url}
                                    </a>
                                    <p className='link-http-code'>
                                       🚫 {lien.httpCode}
                                    </p>
                                    {lien.pages && lien.pages.length > 0 && (
                                       <p className='link-pages'>
                                          📄 {lien.pages.join(", ")}
                                       </p>
                                    )}
                                 </div>
                              ))}
                           {results.liensExternesAnalysis.liens_externes.filter(
                              (l) =>
                                 l.httpStatus === "broken" ||
                                 l.httpStatus === "error"
                           ).length === 0 && <p className='no-items'>Aucun</p>}
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className='alert alert-success'>
                     ✅ Aucun lien externe à analyser
                  </div>
               ))}
         </section>

         {/* Section Liste des Liens */}
         <section className='dashboard-section card'>
            <SectionHeader
               title={`Liens internes (${liens.length})`}
               section='liens'
            />
            {!collapsedSections.liens &&
               (liens.length === 0 ? (
                  <p className='no-links'>Aucun lien trouvé sur le site</p>
               ) : (
                  <ul className='links-list'>
                     {liens.map((lien, index) => (
                        <li key={index}>
                           <a
                              href={lien}
                              target='_blank'
                              rel='noopener noreferrer'
                           >
                              {lien}
                           </a>
                        </li>
                     ))}
                  </ul>
               ))}
         </section>
      </div>
   );
}

export default Dashboard;
