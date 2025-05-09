# 📑 Conformité RGPD – Étape 0 : Gouvernance

Ce document sert de **point de départ** pour mettre en place la gouvernance RGPD du projet **ActivMap**.  
Il doit être complété, tenu à jour et partagé avec l'ensemble de l'équipe.

---

## 1. Désignation du DPO / Référent RGPD

| Élément | Valeur |
|---------|--------|
| Nom | _À renseigner_ |
| Fonction | _DPO / Référent RGPD_ |
| Email | _exemple : privacy@activmap.fr_ |
| Téléphone | _À renseigner_ |
| Date de nomination | _JJ/MM/AAAA_ |

**Missions principales :**
- Point de contact unique pour les questions relatives à la protection des données.
- Conseille l'équipe sur les obligations légales.
- Contrôle le respect du RGPD et des politiques internes.
- Coopère avec l'autorité de contrôle compétente (CNIL en France).

---

## 2. Registre des traitements (modèle simplifié)

Copiez ce tableau dans un fichier tableur si nécessaire (Excel/Sheets).  
Chaque ligne = un traitement de données personnelles.

| ID | Finalité du traitement | Catégories de données | Personnes concernées | Base légale | Durée de conservation | Sous-traitants | Mesures de sécurité |
|----|------------------------|-----------------------|----------------------|-------------|-----------------------|---------------|---------------------|
| 1  | Gestion des comptes utilisateurs | Email, mot de passe hashé, préférences | Utilisateurs ActivMap | Exécution du contrat (Art. 6.1.b) | Jusqu'à suppression du compte + 3 ans | PostgreSQL (hébergeur), SMTP | Bcrypt, TLS, accès restreint |
| 2  | Envoi d'e-mails transactionnels | Email | Utilisateurs | Intérêt légitime (communication de service) | 3 ans après inactivité | SMTP provider | TLS, DKIM, SPF |
| … | … | … | … | … | … | … | … |

> 🔄 **Mise à jour :** Compléter et réviser ce registre à chaque nouvelle fonctionnalité impliquant des données personnelles.

---

## 3. Sous-traitants & accords de traitement (DPA)

| Fournisseur | Service utilisé | Pays / Région | Contrat DPA signé ? | Point de contact | Commentaire |
|-------------|----------------|---------------|---------------------|------------------|-------------|
| **OVHCloud** | Hébergement VPS / DB | EU (France) | Oui / Non | … | … |
| **SendGrid** | SMTP | USA | Oui / Non (clauses SCC) | … | … |
| **Mapbox** | APIs cartographiques | USA | Oui / Non | … | … |
| … | … | … | … | … | … |

➡️ Pour chaque sous-traitant :
1. Vérifier la localisation des données (UE ou pays adéquat).  
2. Signer (ou archiver) le contrat de traitement des données (DPA).  
3. Documenter les mesures techniques/organisationnelles prises par le fournisseur.

---

## 4. Historique des modifications de ce document

| Date | Auteur | Changement |
|------|--------|------------|
| _JJ/MM/AAAA_ | _Nom_ | Création du document |
| _JJ/MM/AAAA_ | _Nom_ | … |

---

🔒 **Confidentiel interne** – Ne pas diffuser en dehors de l'organisation sans validation du DPO. 