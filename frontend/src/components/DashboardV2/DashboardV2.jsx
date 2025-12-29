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
      { id: "synthese", label: "🎯 Synthèse", badge: null },
      { id: "orthographe", label: "📝 Orthographe", badge: countOrthographe },
      { id: "legal", label: "⚖️ Pages légales", badge: countLegal },
      { id: "coherence", label: "🔍 Cohérence", badge: countCoherence },
      { id: "liens", label: "🔗 Liens", badge: countLiensSuspects },
      { id: "seo", label: "🏷️ SEO", badge: countMetasInvalides },
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

   return (
      <div className='tab-synthese'>
         <div className='synthese-resume'>
            <h3>Résumé</h3>
            <p>{resume || "Aucun résumé disponible"}</p>
         </div>

         {/* Priorités P0 */}
         {priorites.P0?.length > 0 && (
            <div className='priority-section p0'>
               <h3>🔴 P0 - Bloqueurs ({priorites.P0.length})</h3>
               <ul>
                  {priorites.P0.map((item, i) => (
                     <li key={i}>
                        <span className='priority-source'>{item.source}</span>
                        <span className='priority-resume'>{item.resume}</span>
                        {item.page_url && (
                           <span className='priority-url'>{item.page_url}</span>
                        )}
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {/* Priorités P1 */}
         {priorites.P1?.length > 0 && (
            <div className='priority-section p1'>
               <h3>🟠 P1 - Importants ({priorites.P1.length})</h3>
               <ul>
                  {priorites.P1.map((item, i) => (
                     <li key={i}>
                        <span className='priority-source'>{item.source}</span>
                        <span className='priority-resume'>{item.resume}</span>
                     </li>
                  ))}
               </ul>
            </div>
         )}

         {/* Priorités P2 */}
         {priorites.P2?.length > 0 && (
            <div className='priority-section p2'>
               <h3>🟢 P2 - Améliorations ({priorites.P2.length})</h3>
               <ul>
                  {priorites.P2.map((item, i) => (
                     <li key={i}>
                        <span className='priority-resume'>{item.resume}</span>
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

         {priorites.P0?.length === 0 &&
            priorites.P1?.length === 0 &&
            priorites.P2?.length === 0 && (
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
   const allErrors = data.flatMap((page) =>
      (page.orthographe || []).map((err) => ({
         ...err,
         page_url: page.page_url,
      }))
   );

   const allExtractions = data.map((page) => ({
      page_url: page.page_url,
      telephones: page.extraction?.telephones_trouves || [],
      noms: page.extraction?.noms_trouves || [],
      coherence: page.coherence,
   }));

   return (
      <div className='tab-orthographe'>
         {/* Erreurs d'orthographe */}
         <div className='section'>
            <h3>Fautes d'orthographe ({allErrors.length})</h3>
            {allErrors.length === 0 ? (
               <div className='alert alert-success'>
                  ✅ Aucune faute détectée
               </div>
            ) : (
               <div className='errors-list'>
                  {allErrors.map((err, i) => (
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
                        <p className='error-page'>{err.page_url}</p>
                     </div>
                  ))}
               </div>
            )}
         </div>

         {/* Extractions */}
         <div className='section'>
            <h3>Informations extraites</h3>
            <div className='extractions-grid'>
               {allExtractions
                  .filter((e) => e.telephones.length > 0 || e.noms.length > 0)
                  .map((ext, i) => (
                     <div key={i} className='extraction-card'>
                        <p className='extraction-page'>{ext.page_url}</p>
                        {ext.telephones.length > 0 && (
                           <p>📞 {ext.telephones.join(", ")}</p>
                        )}
                        {ext.noms.length > 0 && <p>👤 {ext.noms.join(", ")}</p>}
                        {ext.coherence && (
                           <div className='coherence-status'>
                              <span
                                 className={
                                    ext.coherence.telephone_statut === "ok"
                                       ? "ok"
                                       : "warning"
                                 }
                              >
                                 Tél: {ext.coherence.telephone_statut}
                              </span>
                              <span
                                 className={
                                    ext.coherence.nom_statut === "ok"
                                       ? "ok"
                                       : "warning"
                                 }
                              >
                                 Nom: {ext.coherence.nom_statut}
                              </span>
                           </div>
                        )}
                     </div>
                  ))}
            </div>
         </div>
      </div>
   );
}

// ============================================
// TAB: Pages légales (Étape 2)
// ============================================
function TabLegal({ data }) {
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
                     <p className='legal-type'>{page.type_page_legale}</p>
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
                                 <span className='issue-type'>
                                    {issue.type}
                                 </span>
                                 <p>« {issue.texte} »</p>
                                 <p className='issue-raison'>{issue.raison}</p>
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
   const allLiens = data.flatMap((page) =>
      (page.liens || []).map((l) => ({ ...l, source_page: page.page_url }))
   );

   const suspects = allLiens.filter((l) => l.statut === "suspect");
   const aVerifier = allLiens.filter((l) => l.statut === "a_verifier");
   const valides = allLiens.filter((l) => l.statut === "valide");

   return (
      <div className='tab-liens'>
         {/* Résumé */}
         <div className='liens-summary'>
            <div className='summary-item total'>{allLiens.length} liens</div>
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
                           <span className='lien-type'>{lien.type}</span>
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
                        <p className='lien-source'>📄 {lien.source_page}</p>
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
                        <span className='lien-type'>{lien.type}</span>
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
               <ul>
                  {metasValides.map((meta, i) => (
                     <li key={i}>{meta.url}</li>
                  ))}
               </ul>
            </details>
         )}
      </div>
   );
}

export default DashboardV2;
