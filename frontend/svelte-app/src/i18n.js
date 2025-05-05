import { writable, get } from 'svelte/store';
import { preferences } from './stores/preferences.js';

export const locale = writable('fr');

preferences.subscribe(p => {
  if (p && p.language) {
    locale.set(p.language);
  }
});

const dict = {
  fr: {
    map_generator: 'Générateur de carte stylisée',
    latitude: 'Latitude',
    longitude: 'Longitude',
    distance: 'Distance (m)',
    generate_map: 'Générer la carte',
    generated_map: 'Carte générée :',
    download_svg: "Télécharger l'image SVG",
    settings: 'Paramètres',
    map_settings: 'Paramètres de carte',
    map_style: 'Style de carte',
    default_distance: 'Distance par défaut (m)',
    max_points: 'Points maximum',
    general_prefs: 'Préférences générales',
    enable_notifications: 'Activer les notifications',
    language: 'Langue',
    account_settings: 'Paramètres du compte',
    username: "Nom d'utilisateur", 
    email: 'Email',
    change_password: 'Changer le mot de passe',
    save: 'Enregistrer les modifications',
    reset: 'Réinitialiser',
    sidebar_map: 'Carte',
    sidebar_stats: 'Statistiques',
    sidebar_settings: 'Paramètres',
    sidebar_team: 'Équipe',
    sidebar_history: 'Historique',
    logout: 'Déconnexion',
    sidebar_report: 'Signaler un bug',
    sidebar_reports: 'Signalements',
    report_title: 'Signaler un bug ou un manque',
    report_description: 'Description',
    report_attachments: 'Pièces jointes',
    report_success: 'Signalement envoyé avec succès',
    submit: 'Envoyer',
    saving: 'Envoi',
    reports_admin_title: 'Signalements reçus',
    reports_empty: "Aucun signalement pour l'instant",
    loading: 'Chargement',
    delete: 'Supprimer',
    confirm_delete_thread: 'Voulez-vous vraiment supprimer cette conversation ?',
    delete_error: 'Erreur lors de la suppression de la conversation'
  },
  en: {
    map_generator: 'Stylized Map Generator',
    latitude: 'Latitude',
    longitude: 'Longitude',
    distance: 'Distance (m)',
    generate_map: 'Generate Map',
    generated_map: 'Generated Map:',
    download_svg: 'Download SVG image',
    settings: 'Settings',
    map_settings: 'Map settings',
    map_style: 'Map style',
    default_distance: 'Default distance (m)',
    max_points: 'Maximum points',
    general_prefs: 'General preferences',
    enable_notifications: 'Enable notifications',
    language: 'Language',
    account_settings: 'Account settings',
    username: 'Username',
    email: 'Email',
    change_password: 'Change password',
    save: 'Save changes',
    reset: 'Reset',
    sidebar_map: 'Map',
    sidebar_stats: 'Statistics',
    sidebar_settings: 'Settings',
    sidebar_team: 'Team',
    sidebar_history: 'History',
    logout: 'Logout',
    sidebar_report: 'Report an issue',
    sidebar_reports: 'Reports',
    report_title: 'Report a bug or missing feature',
    report_description: 'Description',
    report_attachments: 'Attachments',
    report_success: 'Report sent successfully',
    submit: 'Submit',
    saving: 'Sending',
    reports_admin_title: 'Reports received',
    reports_empty: 'No reports yet',
    loading: 'Loading',
    delete: 'Delete',
    confirm_delete_thread: 'Are you sure you want to delete this conversation?',
    delete_error: 'Error deleting the conversation'
  }
};

export function t(key, lang = null) {
  const l = lang || get(locale);
  return (dict[l] && dict[l][key]) || dict['fr'][key] || key;
} 