# Modèle Financier Dynamique pour KYA-SolDesign (Structure Excel)

Ce document décrit la structure d'un modèle financier dynamique et professionnel pour KYA-SolDesign, à construire dans un tableur comme Excel ou Google Sheets. Le modèle est conçu pour être flexible, où les projections se mettent à jour automatiquement en fonction des paramètres que vous définissez.

---

## Feuille 1 : `PARAMÈTRES`

C'est le cerveau du modèle. Toutes les hypothèses de base, les taux de croissance et les ratios stratégiques sont définis ici. C'est la seule feuille où vous saisissez des données manuellement.

### Section A : Paramètres Généraux
| Paramètre | Valeur | Unité |
| :--- | :--- | :--- |
| Année de départ | 2025 | Année |
| Durée de la simulation | 5 | Ans |
| Monnaie | F CFA | Texte |

### Section B : Hypothèses de Croissance & Évolution (Taux Annuels)
| Paramètre | Taux |
| :--- | :--- |
| Croissance des nouveaux utilisateurs **Freemium** | 20% |
| Croissance des nouveaux **Étudiants** | 15% |
| Croissance des **Ventes Directes Commerciales** | 10% |
| Augmentation annuelle des **Prix** | 5% |
| Inflation annuelle des **Coûts** | 3% |

### Section C : Hypothèses de Base (Point de Départ pour l'Année 1)
| Catégorie | Paramètre | Valeur (Année 1) |
| :--- | :--- | :--- |
| **Acquisition** | Nouveaux utilisateurs Freemium | 10,000 |
| | Nouveaux Étudiants touchés | 5,000 |
| | Ventes Directes Commerciales | 200 |
| | Institutions Académiques | 10 |
| **Coûts** | Coût initial Développement | 12,000,000 F CFA |
| | Coût initial Maintenance & Support | 1,500,000 F CFA |
| | Coût initial Marketing | 3,000,000 F CFA |
| | Coût initial Serveurs | 1,000,000 F CFA |

### Section D : Ratios Stratégiques (Le Cœur du Business Model)
| Paramètre | Taux |
| :--- | :--- |
| Taux de conversion **Freemium → Commercial** | 3% |
| Taux de conversion **Étudiant → Commercial** | 5% |
| Taux de **Rétention** des clients Commerciaux (annuel) | 80% |

### Section E : Structure des Offres & Prix (pour l'Année 1)
| Version | Durée | Prix (F CFA) |
| :--- | :--- | :--- |
| Étudiant | 1 Jour | 500 |
| Étudiant | 1 Mois | 2,500 |
| Étudiant | 3 Mois | 6,000 |
| Commercial | 1 Mois | 15,000 |
| Commercial | 1 An | 120,000 |
| Académique | 1 An (par institution) | 300,000 |

### Section F : Mix de Ventes (Comportement d'achat)
| Catégorie | Choix | Distribution |
| :--- | :--- | :--- |
| Étudiants Payants | % choisissant 1 Jour | 60% |
| | % choisissant 1 Mois | 30% |
| | % choisissant 3 Mois | 10% |
| Clients Commerciaux | % choisissant 1 Mois | 20% |
| | % choisissant 1 An | 80% |

---

## Feuille 2 : `PROJECTIONS`

Cette feuille contient tous les calculs dynamiques sur la durée de la simulation. Aucune saisie manuelle ici, uniquement des formules qui se réfèrent à la feuille `PARAMÈTRES` et aux colonnes précédentes.

### Section A : Projection des Utilisateurs & Clients
| Ligne | Année 1 | Année 2 | Année 3 | ... |
| :--- | :--- | :--- | :--- | :--- |
| **Clients Commerciaux** | | | | |
| Clients de l'année précédente | 0 | = Total Clients (Année 1) | = Total Clients (Année 2) | |
| Clients retenus (renouvellements) | 0 | = Clients (N-1) * Taux Rétention | = Clients (N-1) * Taux Rétention | |
| Nouveaux clients (Ventes Directes) | = Paramètres | = Nouveaux (N-1) * (1 + Croissance) | ... | |
| Nouveaux clients (via Freemium) | = Freemium (N) * Taux Conv. | ... | ... | |
| Nouveaux clients (via Étudiants N-1) | 0 | = Étudiants (N-1) * Taux Conv. | ... | |
| **Total Clients Commerciaux** | **= SOMME(Nouveaux)** | **= SOMME(Retenus + Nouveaux)** | **...** | |
| | | | | |
| **Autres Utilisateurs** | | | | |
| Nouveaux Freemium | = Paramètres | = Freemium (N-1) * (1 + Croissance) | ... | |
| Nouveaux Étudiants | = Paramètres | = Étudiants (N-1) * (1 + Croissance) | ... | |
| Nouvelles Institutions Académiques | = Paramètres | = Institutions (N-1) * (1 + Croissance) | ... | |


### Section B : Projection des Prix
| Ligne | Année 1 | Année 2 | Année 3 | ... |
| :--- | :--- | :--- | :--- | :--- |
| Prix Licence Commerciale (1 an) | = Paramètres | = Prix (N-1) * (1 + Augmentation) | ... | |
| ... (idem pour tous les autres prix) | | | | |

### Section C : Projection des Revenus (F CFA)
| Ligne | Année 1 | Année 2 | Année 3 | ... |
| :--- | :--- | :--- | :--- | :--- |
| **Revenus Commerciaux** | | | | |
| Revenus des renouvellements | 0 | = Clients retenus * Prix (N) | ... | |
| Revenus des nouveaux clients | = Nouveaux clients * Prix (N) | ... | ... | |
| **Sous-total Commerciaux** | **...** | **...** | **...** | |
| **Revenus Étudiants** | (Calcul basé sur mix de ventes) | ... | ... | |
| **Revenus Académiques** | = Institutions * Prix Académique (N) | ... | ... | |
| **TOTAL REVENUS** | **= SOMME(...)** | **...** | **...** | |

### Section D : Projection des Coûts (F CFA)
| Ligne | Année 1 | Année 2 | Année 3 | ... |
| :--- | :--- | :--- | :--- | :--- |
| Coût Développement | = Paramètres | = Coût (N-1) * (1 + Inflation) | ... | |
| Coût Maintenance & Support | = Paramètres | = Coût (N-1) * (1 + Inflation) | ... | |
| ... (idem pour tous les coûts) | | | | |
| **TOTAL COÛTS** | **= SOMME(...)** | **...** | **...** | |

---

## Feuille 3 : `SYNTHÈSE FINANCIÈRE`

Cette feuille présente le résumé final (compte de résultat) de manière claire et lisible.

| Ligne | Année 1 | Année 2 | Année 3 | ... |
| :--- | :--- | :--- | :--- | :--- |
| **Total des Revenus** | `=PROJECTIONS!Total_Revenus_A1` | `=PROJECTIONS!Total_Revenus_A2` | ... | |
| **Total des Coûts** | `=PROJECTIONS!Total_Coûts_A1` | `=PROJECTIONS!Total_Coûts_A2` | ... | |
| **Résultat Net (Profit / Perte)** | **= Revenus - Coûts** | **...** | **...** | |

---

## Feuille 4 : `BESOIN DE FINANCEMENT`

Un résumé simple et direct de la demande de financement.

| Poste de Dépense (pour l'Année 1) | Montant (F CFA) |
| :--- | :--- |
| Coût Développement | `=PARAMÈTRES!Coût_Initial_Dev` |
| Coût Marketing | `=PARAMÈTRES!Coût_Initial_Marketing` |
| Coût Maintenance & Support | `=PARAMÈTRES!Coût_Initial_Maintenance` |
| Coût Serveurs | `=PARAMÈTRES!Coût_Initial_Serveurs` |
| **Total du Besoin de Financement Initial** | **=SOMME(...)** |
