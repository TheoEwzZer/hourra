// Formations proposées à l'inscription (comme sur hiphiphip.app) + matières suggérées.

export const PATHWAY_GROUPS = [
  { id: 'lycee', label: 'au lycée', emoji: '🎒' },
  { id: 'college', label: 'au collège', emoji: '📓' },
  { id: 'sante', label: 'en étude de santé', emoji: '🩺' },
  { id: 'droit', label: 'en droit', emoji: '⚖️' },
  { id: 'prepa-sci', label: 'en prépa scientifique (CPGE)', emoji: '🧪' },
  { id: 'prepa-eco', label: 'en prépa économique et commerciale (CPGE)', emoji: '📈' },
  { id: 'prepa-lit', label: 'en prépa littéraire (CPGE)', emoji: '📜' },
  { id: 'univ', label: 'à l\'université / en école', emoji: '🎓' },
  { id: 'apprendre', label: 'pour apprendre à apprendre', emoji: '🧠' },
  { id: 'autre', label: 'Autre', emoji: '✨' },
];

export const PATHWAYS = {
  lycee: {
    Seconde: ['Mathématiques', 'Français', 'Histoire-Géographie', 'Physique-Chimie', 'SVT', 'Anglais', 'LV2', 'SES', 'SNT', 'EMC'],
    Première: ['Français', 'Histoire-Géographie', 'Enseignement scientifique', 'Anglais', 'LV2', 'Spécialité Mathématiques', 'Spécialité Physique-Chimie', 'Spécialité SVT', 'Spécialité SES', 'Spécialité NSI', 'Spécialité HGGSP', 'Spécialité HLP', 'Spécialité LLCER'],
    Terminale: ['Philosophie', 'Histoire-Géographie', 'Enseignement scientifique', 'Anglais', 'LV2', 'Grand oral', 'Spécialité Mathématiques', 'Spécialité Physique-Chimie', 'Spécialité SVT', 'Spécialité SES', 'Spécialité NSI', 'Spécialité HGGSP', 'Maths expertes', 'Maths complémentaires'],
  },
  college: {
    '6e': ['Français', 'Mathématiques', 'Histoire-Géographie', 'Anglais', 'Sciences', 'Arts plastiques', 'Musique'],
    '5e': ['Français', 'Mathématiques', 'Histoire-Géographie', 'Anglais', 'LV2', 'SVT', 'Physique-Chimie', 'Technologie'],
    '4e': ['Français', 'Mathématiques', 'Histoire-Géographie', 'Anglais', 'LV2', 'SVT', 'Physique-Chimie', 'Technologie'],
    '3e (Brevet)': ['Français', 'Mathématiques', 'Histoire-Géographie-EMC', 'Anglais', 'LV2', 'SVT', 'Physique-Chimie', 'Technologie', 'Oral du brevet'],
  },
  sante: {
    PASS: ['UE1 Chimie - Biochimie', 'UE2 Biologie cellulaire', 'UE3 Physique - Biophysique', 'UE4 Biostatistiques', 'UE5 Anatomie', 'UE6 Pharmacologie', 'UE7 SHS', 'UE8 Spécifique', 'Mineure'],
    LAS: ['Majeure disciplinaire', 'Mineure santé', 'Biologie', 'Chimie', 'Physiologie', 'Anatomie', 'SHS'],
    'DFGSM 2': ['Physiologie', 'Sémiologie', 'Biochimie', 'Immunologie', 'Génétique', 'Microbiologie', 'Anatomie'],
    'DFGSM 3': ['Pharmacologie', 'Sémiologie', 'Anatomopathologie', 'Imagerie', 'Microbiologie'],
    'Externat (EDN)': ['Cardiologie', 'Pneumologie', 'Gastro-entérologie', 'Neurologie', 'Pédiatrie', 'Gynécologie', 'Infectiologie', 'Néphrologie', 'Endocrinologie', 'Psychiatrie', 'Dermatologie', 'Rhumatologie'],
    IFSI: ['Sciences humaines', 'Sciences biologiques et médicales', 'Sciences et techniques infirmières', 'Intégration des savoirs'],
  },
  droit: {
    'L1 Droit': ['Droit constitutionnel', 'Droit civil (personnes, famille)', 'Introduction au droit', 'Histoire du droit', 'Institutions juridictionnelles', 'Science politique'],
    'L2 Droit': ['Droit des obligations', 'Droit administratif', 'Droit pénal', 'Finances publiques', 'Droit des affaires'],
    'L3 Droit': ['Droit des contrats spéciaux', 'Droit du travail', 'Procédure civile', 'Libertés fondamentales', 'Droit international public', 'Droit fiscal'],
    'Master / CRFPA': ['Note de synthèse', 'Droit des obligations', 'Procédures', 'Libertés et droits fondamentaux', 'Spécialité'],
  },
  'prepa-sci': {
    MPSI: ['Mathématiques', 'Physique', 'Chimie', 'Sciences de l\'ingénieur', 'Informatique', 'Français-Philo', 'Anglais'],
    PCSI: ['Mathématiques', 'Physique', 'Chimie', 'Sciences de l\'ingénieur', 'Informatique', 'Français-Philo', 'Anglais'],
    'MP / MP*': ['Mathématiques', 'Physique', 'Informatique', 'Français-Philo', 'Anglais'],
    'PC / PC*': ['Mathématiques', 'Physique', 'Chimie', 'Français-Philo', 'Anglais'],
    BCPST: ['Mathématiques', 'Physique-Chimie', 'SVT', 'Géologie', 'Français-Philo', 'Anglais'],
  },
  'prepa-eco': {
    'ECG 1': ['Mathématiques', 'ESH / HGG', 'Culture générale', 'LV1', 'LV2'],
    'ECG 2': ['Mathématiques', 'ESH / HGG', 'Culture générale', 'LV1', 'LV2', 'Concours blancs'],
  },
  'prepa-lit': {
    Hypokhâgne: ['Français', 'Philosophie', 'Histoire', 'Géographie', 'Langues anciennes', 'LV1'],
    Khâgne: ['Français', 'Philosophie', 'Histoire', 'Spécialité', 'LV1'],
  },
  univ: {
    'Licence 1': ['Matière 1', 'Matière 2', 'Matière 3'],
    'Licence 2': ['Matière 1', 'Matière 2', 'Matière 3'],
    'Licence 3': ['Matière 1', 'Matière 2', 'Matière 3'],
    Master: ['Matière 1', 'Matière 2'],
    'École d\'ingénieur': ['Mathématiques', 'Informatique', 'Physique', 'Langues', 'Projet'],
    'École de commerce': ['Finance', 'Marketing', 'Comptabilité', 'Stratégie', 'Langues'],
  },
  apprendre: {
    'Apprendre à apprendre': ['Mémoire & méthode des J', 'Organisation', 'Prise de notes', 'Gestion du stress'],
    'Langue étrangère': ['Vocabulaire', 'Grammaire', 'Compréhension orale', 'Expression écrite'],
    'Code de la route': ['Signalisation', 'Priorités', 'Conducteur', 'Mécanique', 'Premiers secours'],
  },
  autre: {},
};
