import { useState } from "react";
import "./DashboardV2.css";

function DashboardV2({ results }) {
   const [activeTab, setActiveTab] = useState("synthese");

   const {
      meta,
      etape1_orthographe = [],
      etape2_legal = [],
      etape3_coherence = [],
      etape4_liens = [],
      etape5_seo = {},
      etape6_synthese = {},
   } = results || {};

   // Compteurs pour les badges
   const countOrthographe = etape1_orthographe.reduce(
      (acc, p) => acc + (p.orthographe?.length || 0),
      0
   );
   const countLegal = etape2_legal.filter((p) => !p.conforme).length;
   const countCoherence = etape3_coherence.filter((p) => !p.coherent).length;
   const countLiensSuspects = etape4_liens.reduce(
      (acc, p) => acc + (p.resume?.suspects || 0),
      0
   );
   const countMetasInvalides = (etape5_seo.metas || []).filter(
      (m) => !m.title_valide || !m.description_valide
   ).length;

   const tabs = [
      { id: "synthese", label: "Synthèse", badge: null },
      { id: "orthographe", label: "Orthographe", badge: countOrthographe },
      { id: "legal", label: "Pages légales", badge: countLegal },
      { id: "coherence", label: "Cohérence", badge: countCoherence },
      { id: "liens", label: "Liens", badge: countLiensSuspects },
      { id: "seo", label: "SEO", badge: countMetasInvalides },
   ];

   return (
      <div className='dashboard-v2'>
         {/* Header avec méta infos */}
         <div className='dashboard-header card'>
            <div className='header-info'>
               <h2>Audit terminé</h2>
               <p className='audit-url'>{meta?.url_auditee}</p>
               <p className='audit-meta'>
                  {meta?.pages_analysees} pages • {meta?.entreprise} •{" "}
                  {new Date(meta?.date_audit).toLocaleDateString("fr-FR")}
               </p>
            </div>
            <div className={`decision-big ${etape6_synthese.decision}`}>
               {etape6_synthese.decision === "go" && "✅ GO"}
               {etape6_synthese.decision === "go_avec_reserves" &&
                  "⚠️ GO avec réserves"}
               {etape6_synthese.decision === "no_go" && "❌ NO GO"}
            </div>
         </div>

         {/* Navigation par onglets */}
         <div className='tabs-nav'>
            {tabs.map((tab) => (
               <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
               >
                  {tab.label}
                  {tab.badge > 0 && (
                     <span className='tab-badge'>{tab.badge}</span>
                  )}
               </button>
            ))}
         </div>

         {/* Contenu des onglets */}
         <div className='tab-content card'>
            {activeTab === "synthese" && <TabSynthese data={etape6_synthese} />}
            {activeTab === "orthographe" && (
               <TabOrthographe data={etape1_orthographe} />
            )}
            {activeTab === "legal" && <TabLegal data={etape2_legal} />}
            {activeTab === "coherence" && (
               <TabCoherence data={etape3_coherence} />
            )}
            {activeTab === "liens" && <TabLiens data={etape4_liens} />}
            {activeTab === "seo" && <TabSeo data={etape5_seo} />}
         </div>
      </div>
   );
}

// ============================================
// TAB: Synthèse (Étape 6)
// ============================================
function TabSynthese({ data }) {
   const { decision, priorites = {}, resume, checklist = [] } = data;

   // Fonction pour dédupliquer les items par leur résumé
   const deduplicatePriorities = (items) => {
      if (!items) return [];
      const grouped = {};
      items.forEach((item) => {
         const key = item.resume;
         if (!grouped[key]) {
            grouped[key] = {
               ...item,
               page_urls: item.page_url ? [item.page_url] : [],
            };
         } else if (
            item.page_url &&
            !grouped[key].page_urls.includes(item.page_url)
         ) {
            grouped[key].page_urls.push(item.page_url);
         }
      });
      return Object.values(grouped);
   };

   // Extraire le slug d'une URL pour affichage compact
   const getSlug = (url) => {
      try {
         const path = new URL(url).pathname;
         return path === "/" ? "/" : path;
      } catch {
         return url;
      }
   };

   const p0Dedup = deduplicatePriorities(priorites.P0);
   const p1Dedup = deduplicatePriorities(priorites.P1);
   const p2Dedup = deduplicatePriorities(priorites.P2);

   return (
      <div className='tab-synthese'>
         <div className='synthese-resume'>
            <h3>Résumé</h3>
            <p>{resume || "Aucun résumé disponible"}</p>
         </div>

         {/* Priorités P0 */}
         {p0Dedup.length > 0 && (
            <div className='priority-section p0'>
               <h3>P0 - Bloqueurs ({p0Dedup.length})</h3>
               <ul>
                  {p0Dedup.map((item, i) => (
                     <li key={i}>
                        <span className='priority-source'>{item.source}</span>
                        <span className='priority-resume'>{item.resume}</span>
                        {item.page_urls.length > 0 && (
                           <span className='priority-urls'>
                              📄 {item.page_urls.map(getSlug).join(", ")}
                           </span>
                        )}
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {/* Priorités P1 */}
         {p1Dedup.length > 0 && (
            <div className='priority-section p1'>
               <h3>P1 - Importants ({p1Dedup.length})</h3>
               <ul>
                  {p1Dedup.map((item, i) => (
                     <li key={i}>
                        <span className='priority-source'>{item.source}</span>
                        <span className='priority-resume'>{item.resume}</span>
                        {item.page_urls.length > 0 && (
                           <span className='priority-urls'>
                              📄 {item.page_urls.map(getSlug).join(", ")}
                           </span>
                        )}
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {/* Priorités P2 */}
         {p2Dedup.length > 0 && (
            <div className='priority-section p2'>
               <h3>P2 - Améliorations ({p2Dedup.length})</h3>
               <ul>
                  {p2Dedup.map((item, i) => (
                     <li key={i}>
                        <span className='priority-resume'>{item.resume}</span>
                        {item.page_urls.length > 0 && (
                           <span className='priority-urls'>
                              📄 {item.page_urls.map(getSlug).join(", ")}
                           </span>
                        )}
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {/* Checklist */}
         {checklist.length > 0 && (
            <div className='checklist-section'>
               <h3>📋 Checklist de vérification manuelle</h3>
               <ul>
                  {checklist.map((item, i) => (
                     <li key={i}>{item}</li>
                  ))}
               </ul>
            </div>
         )}

         {p0Dedup.length === 0 &&
            p1Dedup.length === 0 &&
            p2Dedup.length === 0 && (
               <div className='alert alert-success'>
                  ✅ Aucun problème détecté !
               </div>
            )}
      </div>
   );
}

// ============================================
// TAB: Orthographe (Étape 1)
// ============================================
function TabOrthographe({ data }) {
   // Normaliser un texte pour comparaison (supprime uniquement caractères invisibles)
   const normalizeForComparison = (text) => {
      return (text || "")
         .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, " ") // Remplace caractères invisibles par espace
         .replace(/\s+/g, " ") // Normalise les espaces multiples
         .trim()
         .toLowerCase();
   };

   // Collecter toutes les erreurs avec leurs pages
   const allErrors = data
      .flatMap((page) =>
         (page.orthographe || []).map((err) => ({
            ...err,
            page_url: page.page_url,
         }))
      )
      .filter((err) => {
         // Filtrer les hallucinations où erreur === correction
         const errNorm = normalizeForComparison(err.erreur);
         const corrNorm = normalizeForComparison(err.correction);
         return errNorm !== corrNorm && errNorm.length > 0;
      });

   // Dédupliquer les erreurs par "erreur" + "correction" (normalisé)
   // Fusionne aussi les erreurs qui se contiennent (ex: "fort"/"forts" inclus dans "point fort"/"points forts")
   const deduplicateErrors = (errors) => {
      const grouped = {};
      errors.forEach((err) => {
         const erreurNorm = (err.erreur || "").trim().toLowerCase();
         const correctionNorm = (err.correction || "").trim().toLowerCase();
         const key = `${erreurNorm}|${correctionNorm}`;

         if (!grouped[key]) {
            grouped[key] = {
               ...err,
               page_urls: [err.page_url],
            };
         } else if (!grouped[key].page_urls.includes(err.page_url)) {
            grouped[key].page_urls.push(err.page_url);
         }
      });

      // Fusionner les erreurs qui se contiennent
      const values = Object.values(grouped);
      const toRemove = new Set();

      values.forEach((err1, i) => {
         values.forEach((err2, j) => {
            if (i !== j && !toRemove.has(j)) {
               const e1 = (err1.erreur || "").toLowerCase();
               const e2 = (err2.erreur || "").toLowerCase();
               const c1 = (err1.correction || "").toLowerCase();
               const c2 = (err2.correction || "").toLowerCase();

               // Si err1 est contenu dans err2, fusionner dans err2
               if (e2.includes(e1) && c2.includes(c1) && e1 !== e2) {
                  // Fusionner les pages
                  err1.page_urls.forEach((url) => {
                     if (!err2.page_urls.includes(url)) {
                        err2.page_urls.push(url);
                     }
                  });
                  toRemove.add(i);
               }
            }
         });
      });

      return values.filter((_, i) => !toRemove.has(i));
   };

   const deduplicateExtractions = () => {
      const allPhones = new Map();
      const allNames = new Map();

      const normalizeValue = (val) => {
         if (typeof val === "string") return val;
         if (typeof val === "object" && val !== null) {
            return (
               val.numero ||
               val.texte ||
               val.name ||
               val.value ||
               JSON.stringify(val)
            );
         }
         return String(val);
      };

      data.forEach((page) => {
         const phones = page.extraction?.telephones_trouves || [];
         const names = page.extraction?.noms_trouves || [];

         phones.forEach((phone) => {
            const normalizedPhone = normalizeValue(phone);
            if (!allPhones.has(normalizedPhone)) {
               allPhones.set(normalizedPhone, []);
            }
            if (!allPhones.get(normalizedPhone).includes(page.page_url)) {
               allPhones.get(normalizedPhone).push(page.page_url);
            }
         });

         names.forEach((name) => {
            const normalizedName = normalizeValue(name);
            if (!allNames.has(normalizedName)) {
               allNames.set(normalizedName, []);
            }
            if (!allNames.get(normalizedName).includes(page.page_url)) {
               allNames.get(normalizedName).push(page.page_url);
            }
         });
      });

      return { phones: allPhones, names: allNames };
   };

   // Extraire le slug d'une URL
   const getSlug = (url) => {
      try {
         const path = new URL(url).pathname;
         return path === "/" ? "/" : path;
      } catch {
         return url;
      }
   };

   // Catégoriser une erreur (orthographe, grammaire, autre)
   const categorizeError = (erreur, correction) => {
      const err = (erreur || "").toLowerCase();
      const corr = (correction || "").toLowerCase();

      // Autre : espaces ajoutés/supprimés ou ponctuation
      if (err.replace(/\s/g, "") === corr.replace(/\s/g, "")) {
         return "autre"; // Différence uniquement d'espaces
      }
      if (err.replace(/[.,!?;:]/g, "") === corr.replace(/[.,!?;:]/g, "")) {
         return "autre"; // Différence uniquement de ponctuation
      }

      // Grammaire : accords (pluriel, féminin, conjugaison)
      // Détection : même racine mais terminaison différente
      const errWords = err.split(/\s+/);
      const corrWords = corr.split(/\s+/);

      if (errWords.length === corrWords.length) {
         let isGrammar = false;
         for (let i = 0; i < errWords.length; i++) {
            const e = errWords[i];
            const c = corrWords[i];
            // Si un mot diffère juste par la fin (s, e, es, ent, etc.)
            if (e !== c && (c.startsWith(e) || e.startsWith(c))) {
               const diffLen = Math.abs(c.length - e.length);
               if (diffLen <= 3) {
                  isGrammar = true;
               }
            }
         }
         if (isGrammar) return "grammaire";
      }

      // Par défaut : orthographe
      return "orthographe";
   };

   const errorsDedup = deduplicateErrors(allErrors);

   // Catégoriser les erreurs
   const errorsCategorized = errorsDedup.map((err) => ({
      ...err,
      categorie: categorizeError(err.erreur, err.correction),
   }));

   const errorsOrthographe = errorsCategorized.filter(
      (e) => e.categorie === "orthographe"
   );
   const errorsGrammaire = errorsCategorized.filter(
      (e) => e.categorie === "grammaire"
   );
   const errorsAutre = errorsCategorized.filter((e) => e.categorie === "autre");

   const { phones, names } = deduplicateExtractions();

   // Composant pour afficher une liste d'erreurs
   const ErrorList = ({ errors, title, emoji }) =>
      errors.length > 0 && (
         <details className='error-category' open>
            <summary>
               {emoji} {title} ({errors.length})
            </summary>
            <div className='errors-list'>
               {errors.map((err, i) => (
                  <div key={i} className={`error-item ${err.gravite}`}>
                     <div className='error-header'>
                        <span className='error-word'>« {err.erreur} »</span>
                        <span className='arrow'>→</span>
                        <span className='correction-word'>
                           « {err.correction} »
                        </span>
                        <span className={`gravite-badge ${err.gravite}`}>
                           {err.gravite}
                        </span>
                     </div>
                     {err.contexte && (
                        <p className='error-context'>{err.contexte}</p>
                     )}
                     <div className='error-pages'>
                        📄 {err.page_urls.map(getSlug).join(", ")}
                     </div>
                  </div>
               ))}
            </div>
         </details>
      );

   return (
      <div className='tab-orthographe'>
         {/* Erreurs catégorisées */}
         <div className='section'>
            <h3>Fautes détectées ({errorsCategorized.length})</h3>
            {errorsCategorized.length === 0 ? (
               <div className='alert alert-success'>
                  ✅ Aucune faute détectée
               </div>
            ) : (
               <div className='errors-categories'>
                  <ErrorList
                     errors={errorsOrthographe}
                     title='Orthographe'
                     emoji='📝'
                  />
                  <ErrorList
                     errors={errorsGrammaire}
                     title='Grammaire'
                     emoji='📖'
                  />
                  <ErrorList
                     errors={errorsAutre}
                     title='Typographie (espaces, ponctuation)'
                     emoji='⌨️'
                  />
               </div>
            )}
         </div>

         {/* Extractions dédupliquées */}
         <div className='section'>
            <h3>Informations extraites</h3>

            {phones.size === 0 && names.size === 0 ? (
               <p className='no-extractions'>Aucune information extraite</p>
            ) : (
               <div className='extractions-dedup'>
                  {/* Téléphones */}
                  {phones.size > 0 && (
                     <div className='extraction-group'>
                        <h4>📞 Téléphones ({phones.size})</h4>
                        {Array.from(phones.entries()).map(
                           ([phone, pages], i) => (
                              <div key={i} className='extraction-item'>
                                 <span className='extraction-value'>
                                    {phone}
                                 </span>
                                 <span className='extraction-pages'>
                                    📄 {pages.map(getSlug).join(", ")}
                                 </span>
                              </div>
                           )
                        )}
                     </div>
                  )}

                  {/* Noms */}
                  {names.size > 0 && (
                     <div className='extraction-group'>
                        <h4>👤 Noms/Responsables ({names.size})</h4>
                        {Array.from(names.entries()).map(([name, pages], i) => (
                           <div key={i} className='extraction-item'>
                              <span className='extraction-value'>{name}</span>
                              <span className='extraction-pages'>
                                 📄 {pages.map(getSlug).join(", ")}
                              </span>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}
         </div>
      </div>
   );
}

// ============================================
// TAB: Pages légales (Étape 2)
// ============================================
function TabLegal({ data }) {
   // Traduire les types de pages légales
   const translateLegalType = (type) => {
      const translations = {
         legal: "Mentions légales",
         Legal: "Mentions légales",
         mentions_legales: "Mentions légales",
         "mentions-legales": "Mentions légales",
         privacy: "Politique de confidentialité",
         Privacy: "Politique de confidentialité",
         politique_confidentialite: "Politique de confidentialité",
         "politique-de-confidentialite": "Politique de confidentialité",
         cgv: "CGV",
         cgu: "CGU",
         cookies: "Politique des cookies",
      };
      return translations[type] || type;
   };

   if (data.length === 0) {
      return (
         <div className='alert alert-success'>
            ✅ Aucune page légale analysée
         </div>
      );
   }

   return (
      <div className='tab-legal'>
         {data.map((page, i) => (
            <div
               key={i}
               className={`legal-card ${
                  page.conforme ? "conforme" : "non-conforme"
               }`}
            >
               <div className='legal-header'>
                  <span className='legal-status'>
                     {page.conforme ? "✅" : "⚠️"}
                  </span>
                  <div>
                     <p className='legal-type'>
                        {translateLegalType(page.type_page_legale)}
                     </p>
                     <p className='legal-url'>{page.page_url}</p>
                  </div>
               </div>
               {page.issues?.length > 0 && (
                  <div className='legal-issues'>
                     {page.issues.map((issue, j) => (
                        <div key={j} className={`issue-item ${issue.gravite}`}>
                           <span className={`issue-type ${issue.type}`}>
                              {issue.type}
                           </span>
                           <p className='issue-text'>« {issue.texte} »</p>
                           <p className='issue-raison'>{issue.raison}</p>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         ))}
      </div>
   );
}

// ============================================
// TAB: Cohérence (Étape 3)
// ============================================
function TabCoherence({ data }) {
   const pagesWithIssues = data.filter(
      (p) => !p.coherent || p.copywriting_issues?.length > 0
   );
   const pagesOk = data.filter(
      (p) =>
         p.coherent &&
         (!p.copywriting_issues || p.copywriting_issues.length === 0)
   );

   return (
      <div className='tab-coherence'>
         {/* Pages avec problèmes */}
         {pagesWithIssues.length > 0 && (
            <div className='section'>
               <h3>⚠️ Pages avec problèmes ({pagesWithIssues.length})</h3>
               {pagesWithIssues.map((page, i) => (
                  <div key={i} className='coherence-card warning'>
                     <p className='coherence-url'>{page.page_url}</p>

                     {page.issues?.length > 0 && (
                        <div className='issues-block'>
                           <h4>Problèmes de cohérence</h4>
                           {page.issues.map((issue, j) => (
                              <div
                                 key={j}
                                 className={`issue-item ${issue.gravite}`}
                              >
                                 <span className={`issue-type ${issue.type}`}>
                                    {issue.type === "promo_date_ambigue"
                                       ? "📅 date ambiguë"
                                       : issue.type}
                                 </span>
                                 <p>« {issue.texte} »</p>
                                 <p className='issue-raison'>{issue.raison}</p>
                                 {issue.promo && (
                                    <p className='issue-promo-detail'>
                                       📅 Date trouvée : "
                                       {issue.promo.date_fin_texte}"
                                       {issue.promo.annee_presente
                                          ? ` (année explicite: ${issue.promo.date_fin_interpretee})`
                                          : " (année non précisée → vérifier manuellement)"}
                                    </p>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}

                     {page.copywriting_issues?.length > 0 && (
                        <div className='copywriting-block'>
                           <h4>💡 Suggestions copywriting</h4>
                           {page.copywriting_issues.map((issue, j) => (
                              <div key={j} className='copywriting-item'>
                                 <p className='copy-text'>« {issue.texte} »</p>
                                 <p className='copy-raison'>{issue.raison}</p>
                                 {issue.suggestion && (
                                    <p className='copy-suggestion'>
                                       💡 {issue.suggestion}
                                    </p>
                                 )}
                              </div>
                           ))}
                        </div>
                     )}
                  </div>
               ))}
            </div>
         )}

         {/* Pages OK */}
         {pagesOk.length > 0 && (
            <details className='pages-ok-details'>
               <summary>✅ {pagesOk.length} page(s) cohérentes</summary>
               <ul>
                  {pagesOk.map((page, i) => (
                     <li key={i}>{page.page_url}</li>
                  ))}
               </ul>
            </details>
         )}

         {data.length === 0 && (
            <div className='alert alert-success'>
               ✅ Aucune page de contenu analysée
            </div>
         )}
      </div>
   );
}

// ============================================
// TAB: Liens (Étape 4)
// ============================================
function TabLiens({ data }) {
   // Collecter tous les liens avec leurs pages sources
   const allLiens = data.flatMap((page) =>
      (page.liens || []).map((l) => ({ ...l, source_page: page.page_url }))
   );

   // Fonction pour dédupliquer les liens par URL
   const deduplicateLinks = (liens) => {
      const grouped = {};
      liens.forEach((lien) => {
         const key = lien.url;
         if (!grouped[key]) {
            grouped[key] = {
               ...lien,
               source_pages: [lien.source_page],
            };
         } else {
            if (!grouped[key].source_pages.includes(lien.source_page)) {
               grouped[key].source_pages.push(lien.source_page);
            }
         }
      });
      return Object.values(grouped);
   };

   // Extraire le slug d'une URL pour affichage compact
   const getSlug = (url) => {
      try {
         const path = new URL(url).pathname;
         return path === "/" ? "/" : path;
      } catch {
         return url;
      }
   };

   const suspects = deduplicateLinks(
      allLiens.filter((l) => l.statut === "suspect")
   );
   const aVerifier = deduplicateLinks(
      allLiens.filter((l) => l.statut === "a_verifier")
   );
   const valides = allLiens.filter((l) => l.statut === "valide");

   // Compter les liens uniques
   const totalUnique = new Set(allLiens.map((l) => l.url)).size;

   return (
      <div className='tab-liens'>
         {/* Résumé */}
         <div className='liens-summary'>
            <div className='summary-item total'>
               {totalUnique} liens uniques
            </div>
            <div className='summary-item valide'>{valides.length} valides</div>
            <div className='summary-item suspect'>
               {suspects.length} suspects
            </div>
            <div className='summary-item averifier'>
               {aVerifier.length} à vérifier
            </div>
         </div>

         {/* Liens suspects */}
         {suspects.length > 0 && (
            <div className='section'>
               <h3>🚨 Liens suspects ({suspects.length})</h3>
               <div className='liens-list'>
                  {suspects.map((lien, i) => (
                     <div key={i} className='lien-item suspect'>
                        <div className='lien-header'>
                           <span className='lien-type'> {lien.type}</span>
                           <a
                              href={lien.url}
                              target='_blank'
                              rel='noopener noreferrer'
                              className='lien-url'
                           >
                              {lien.url.length > 60
                                 ? lien.url.substring(0, 60) + "..."
                                 : lien.url}
                           </a>
                        </div>
                        {lien.texte && (
                           <p className='lien-texte'>"{lien.texte}"</p>
                        )}
                        <p className='lien-raison'>{lien.raison}</p>
                        <div className='lien-sources'>
                           📄 Présent sur :{" "}
                           {lien.source_pages.map(getSlug).join(", ")}
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         )}

         {/* Liens à vérifier */}
         {aVerifier.length > 0 && (
            <details className='section'>
               <summary>🔍 À vérifier ({aVerifier.length})</summary>
               <div className='liens-list'>
                  {aVerifier.map((lien, i) => (
                     <div key={i} className='lien-item averifier'>
                        <span className='lien-type'> {lien.type}</span>
                        <a
                           href={lien.url}
                           target='_blank'
                           rel='noopener noreferrer'
                        >
                           {lien.url}
                        </a>
                        {lien.raison && (
                           <p className='lien-raison'>{lien.raison}</p>
                        )}
                        <div className='lien-sources'>
                           📄 Présent sur :{" "}
                           {lien.source_pages.map(getSlug).join(", ")}
                        </div>
                     </div>
                  ))}
               </div>
            </details>
         )}

         {allLiens.length === 0 && (
            <div className='alert alert-success'>✅ Aucun lien analysé</div>
         )}
      </div>
   );
}

// ============================================
// TAB: SEO (Étape 5)
// ============================================
function TabSeo({ data }) {
   const { metas = [], doublons = {} } = data;

   const metasInvalides = metas.filter(
      (m) => !m.title_valide || !m.description_valide
   );
   const metasValides = metas.filter(
      (m) => m.title_valide && m.description_valide
   );

   return (
      <div className='tab-seo'>
         {/* Résumé */}
         <div className='seo-summary'>
            <div className='summary-item'>{metas.length} pages</div>
            <div className='summary-item valide'>{metasValides.length} OK</div>
            <div className='summary-item suspect'>
               {metasInvalides.length} à corriger
            </div>
         </div>

         {/* Doublons */}
         {(doublons.titles_identiques?.length > 0 ||
            doublons.descriptions_identiques?.length > 0) && (
            <div className='section doublons-section'>
               <h3>🔄 Doublons détectés</h3>
               {doublons.titles_identiques?.map((d, i) => (
                  <div key={`t-${i}`} className='doublon-item'>
                     <p>
                        <strong>Title identique :</strong> "{d.title}"
                     </p>
                     <p>Sur : {d.urls?.join(", ")}</p>
                  </div>
               ))}
               {doublons.descriptions_identiques?.map((d, i) => (
                  <div key={`d-${i}`} className='doublon-item'>
                     <p>
                        <strong>Description identique</strong>
                     </p>
                     <p>Sur : {d.urls?.join(", ")}</p>
                  </div>
               ))}
            </div>
         )}

         {/* Metas à corriger */}
         {metasInvalides.length > 0 && (
            <div className='section'>
               <h3>⚠️ À corriger ({metasInvalides.length})</h3>
               {metasInvalides.map((meta, i) => (
                  <div key={i} className='meta-card warning'>
                     <p className='meta-url'>{meta.url}</p>
                     <div className='meta-fields'>
                        <div
                           className={`meta-field ${
                              meta.title_valide ? "valid" : "invalid"
                           }`}
                        >
                           <span className='field-label'>Title:</span>
                           <span className='field-value'>
                              {meta.title || "(vide)"}
                           </span>
                           {meta.title_valide ? "✅" : "❌"}
                        </div>
                        <div
                           className={`meta-field ${
                              meta.description_valide ? "valid" : "invalid"
                           }`}
                        >
                           <span className='field-label'>Description:</span>
                           <span className='field-value'>
                              {meta.description || "(vide)"}
                           </span>
                           {meta.description_valide ? "✅" : "❌"}
                        </div>
                     </div>
                     {meta.alertes?.length > 0 && (
                        <div className='meta-alertes'>
                           {meta.alertes.map((a, j) => (
                              <span key={j} className='alerte-badge'>
                                 {a}
                              </span>
                           ))}
                        </div>
                     )}
                     {meta.commentaire && (
                        <p className='meta-commentaire'>{meta.commentaire}</p>
                     )}
                     {meta.suggestion_title && (
                        <p className='meta-suggestion'>
                           💡 Title suggéré : {meta.suggestion_title}
                        </p>
                     )}
                     {meta.suggestion_description && (
                        <p className='meta-suggestion'>
                           💡 Description suggérée :{" "}
                           {meta.suggestion_description}
                        </p>
                     )}
                  </div>
               ))}
            </div>
         )}

         {/* Metas OK */}
         {metasValides.length > 0 && (
            <details className='pages-ok-details'>
               <summary>
                  ✅ {metasValides.length} page(s) avec metas valides
               </summary>
               <div className='metas-valides-list'>
                  {metasValides.map((meta, i) => (
                     <div key={i} className='meta-valide-item'>
                        <p className='meta-valide-url'>{meta.url}</p>
                        <div className='meta-valide-details'>
                           <p>
                              <strong>Title:</strong> {meta.title || "(vide)"}
                           </p>
                           <p>
                              <strong>Description:</strong>{" "}
                              {meta.description || "(vide)"}
                           </p>
                        </div>
                     </div>
                  ))}
               </div>
            </details>
         )}
      </div>
   );
}

export default DashboardV2;
