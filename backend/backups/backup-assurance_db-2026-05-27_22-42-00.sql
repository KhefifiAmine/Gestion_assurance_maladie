-- Hybrid Database Backup SQL Dump
-- Generated at: 2026-05-27T22:42:00.347Z

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Table structure for table `acte_medicaux`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `acte_medicaux`;
CREATE TABLE `acte_medicaux` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date_acte` date NOT NULL,
  `cote` varchar(255) DEFAULT NULL,
  `acte` varchar(255) NOT NULL,
  `identifiant_unique_mf` varchar(255) DEFAULT NULL,
  `cachet_signature_present` tinyint(1) NOT NULL DEFAULT 0,
  `date_cachet_signature` date DEFAULT NULL,
  `code_acte` varchar(255) DEFAULT NULL,
  `honoraires` double NOT NULL DEFAULT 0,
  `statut` int(11) DEFAULT 0,
  `objet_rejet` varchar(255) DEFAULT NULL,
  `motif_rejet` text DEFAULT NULL,
  `montant_remboursement` double NOT NULL DEFAULT 0,
  `numero_dent` varchar(255) DEFAULT NULL,
  `bulletinId` int(11) NOT NULL,
  `prestataireId` int(11) DEFAULT NULL,
  `message_remboursement` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bulletinId` (`bulletinId`),
  KEY `prestataireId` (`prestataireId`),
  CONSTRAINT `acte_medicaux_ibfk_35` FOREIGN KEY (`bulletinId`) REFERENCES `bulletin_soins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `acte_medicaux_ibfk_36` FOREIGN KEY (`prestataireId`) REFERENCES `prestataires` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `acte_medicaux`

INSERT INTO `acte_medicaux` (`id`, `date_acte`, `cote`, `acte`, `identifiant_unique_mf`, `cachet_signature_present`, `date_cachet_signature`, `code_acte`, `honoraires`, `statut`, `objet_rejet`, `motif_rejet`, `montant_remboursement`, `numero_dent`, `bulletinId`, `prestataireId`, `message_remboursement`, `createdAt`, `updatedAt`) VALUES 
(1, '2026-04-29', 'C1', 'Consultation', NULL, 1, '0000-00-00', '', 80, 2, 'Traitements non prévus par le contrat', 'ytfdscfvgbn', 0, '', 1, 56, '', '2026-05-18 20:00:03', '2026-05-18 20:06:32'),
(2, '2026-04-15', 'R', 'Radiologie / Électroradiologie', NULL, 1, '0000-00-00', '', 120, 0, NULL, NULL, 108, '', 1, 57, '', '2026-05-18 20:00:03', '2026-05-18 20:05:24'),
(3, '2026-05-04', 'Transport Maladie', 'Divers', NULL, 1, '0000-00-00', '', 20, 0, NULL, NULL, 16, '', 1, 58, '', '2026-05-18 20:00:03', '2026-05-18 20:05:24'),
(4, '2026-05-09', 'Soin dentaire', 'Dentaire', NULL, 1, '0000-00-00', '07', 10, 0, NULL, NULL, 8, '3', 1, 59, '', '2026-05-18 20:00:03', '2026-05-18 20:05:25');

-- --------------------------------------------------------
-- Table structure for table `beneficiaires`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `beneficiaires`;
CREATE TABLE `beneficiaires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `userId` int(11) NOT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `relation` varchar(255) NOT NULL,
  `ddn` date DEFAULT NULL,
  `sexe` enum('M','F') DEFAULT NULL,
  `document` text DEFAULT NULL,
  `statut` enum('En attente','Validé','Rejeté') DEFAULT 'En attente',
  `motifRefus` text DEFAULT NULL,
  `handicape` tinyint(1) DEFAULT 0,
  `etudiant` tinyint(1) DEFAULT 0,
  `chomage` tinyint(1) DEFAULT 0,
  `celibataire` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `objetRefus` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `beneficiaires_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `beneficiaires`

INSERT INTO `beneficiaires` (`id`, `userId`, `nom`, `prenom`, `relation`, `ddn`, `sexe`, `document`, `statut`, `motifRefus`, `handicape`, `etudiant`, `chomage`, `celibataire`, `createdAt`, `updatedAt`, `objetRefus`) VALUES 
(1, 1, 'Admin', 'Test', 'Titulaire', '1990-01-01', '', NULL, 'Validé', NULL, 0, 0, 0, 0, '2026-05-18 19:45:55', '2026-05-18 19:45:55', NULL),
(2, 2, 'Responsable', 'RH', 'Titulaire', '1990-01-01', '', NULL, 'Validé', NULL, 0, 0, 0, 0, '2026-05-18 19:45:55', '2026-05-18 19:45:55', NULL),
(3, 3, 'Adherent', 'User', 'Titulaire', '1990-01-01', '', NULL, 'Validé', NULL, 0, 0, 0, 0, '2026-05-18 19:45:55', '2026-05-18 19:45:55', NULL),
(4, 4, 'Super', 'Admin', 'Titulaire', '1990-01-01', '', NULL, 'Validé', NULL, 0, 0, 0, 0, '2026-05-18 19:45:55', '2026-05-18 19:45:55', NULL),
(5, 2, 'test', 'test', 'Conjoint', '2026-05-12', 'M', '[\"1779137060844-419705599.jpg\"]', 'Rejeté', 'jkuighlumilk', 0, 0, 0, 0, '2026-05-18 20:44:20', '2026-05-18 21:18:24', 'Pièce justificative non conforme ou illisible');

-- --------------------------------------------------------
-- Table structure for table `bulletin_soins`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `bulletin_soins`;
CREATE TABLE `bulletin_soins` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `numero_bulletin` varchar(255) NOT NULL,
  `date_soin` date DEFAULT NULL,
  `code_cnam` varchar(255) DEFAULT NULL,
  `qualite_malade` varchar(255) DEFAULT NULL,
  `est_apci` tinyint(1) NOT NULL DEFAULT 0,
  `suivi_grossesse` tinyint(1) NOT NULL DEFAULT 0,
  `date_prevue_accouchement` date DEFAULT NULL,
  `soins_cadre` varchar(255) DEFAULT NULL,
  `montant_total` double NOT NULL DEFAULT 0,
  `date_depot` date NOT NULL,
  `montant_total_remboursé` double NOT NULL DEFAULT 0,
  `statut` int(11) DEFAULT 0,
  `est_signe_adherent` tinyint(1) NOT NULL DEFAULT 0,
  `date_traitement` datetime DEFAULT NULL,
  `date_validation` datetime DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `beneficiaireId` int(11) DEFAULT NULL,
  `adminId` int(11) DEFAULT NULL,
  `confiance_score` int(11) DEFAULT 100,
  `suspicion_locale` tinyint(1) DEFAULT 0,
  `fraud_score` int(11) DEFAULT 0,
  `niveauRisque` varchar(255) NOT NULL,
  `resultat_analyse` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `numero_bulletin` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_2` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_3` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_4` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_5` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_6` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_7` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_8` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_9` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_10` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_11` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_12` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_13` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_14` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_15` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_16` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_17` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_18` (`numero_bulletin`),
  UNIQUE KEY `numero_bulletin_19` (`numero_bulletin`),
  KEY `userId` (`userId`),
  KEY `adminId` (`adminId`),
  CONSTRAINT `bulletin_soins_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `bulletin_soins_ibfk_2` FOREIGN KEY (`adminId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `bulletin_soins`

INSERT INTO `bulletin_soins` (`id`, `numero_bulletin`, `date_soin`, `code_cnam`, `qualite_malade`, `est_apci`, `suivi_grossesse`, `date_prevue_accouchement`, `soins_cadre`, `montant_total`, `date_depot`, `montant_total_remboursé`, `statut`, `est_signe_adherent`, `date_traitement`, `date_validation`, `userId`, `beneficiaireId`, `adminId`, `confiance_score`, `suspicion_locale`, `fraud_score`, `niveauRisque`, `resultat_analyse`, `createdAt`, `updatedAt`) VALUES 
(1, 'BS-7010', '2026-05-09', '920752', 'Titulaire', 0, 0, '0000-00-00', 'Autres', 480, '2026-05-18', 165, 1, 1, '2026-05-18 20:06:32', NULL, 1, 1, 1, 10, 1, 20, 'élevé', 'Vérification IA: Aucun fichier joint pour vérification.', '2026-05-18 20:00:03', '2026-05-18 20:06:32');

-- --------------------------------------------------------
-- Table structure for table `document_justificatifs`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `document_justificatifs`;
CREATE TABLE `document_justificatifs` (
  `id_document` int(11) NOT NULL AUTO_INCREMENT,
  `fichier` varchar(255) NOT NULL,
  `hash_fichier` varchar(255) DEFAULT NULL,
  `bulletinId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id_document`),
  UNIQUE KEY `hash_fichier` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_2` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_3` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_4` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_5` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_6` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_7` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_8` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_9` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_10` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_11` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_12` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_13` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_14` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_15` (`hash_fichier`),
  UNIQUE KEY `hash_fichier_16` (`hash_fichier`),
  KEY `bulletinId` (`bulletinId`),
  CONSTRAINT `document_justificatifs_ibfk_1` FOREIGN KEY (`bulletinId`) REFERENCES `bulletin_soins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `document_justificatifs`

INSERT INTO `document_justificatifs` (`id_document`, `fichier`, `hash_fichier`, `bulletinId`, `createdAt`, `updatedAt`) VALUES 
(1, '1779134403193-19064240.jpg', 'cf0684da2c89a44cc2157b57a4a39b54d0784d0a8504e832f87bdd3967a9c290', 1, '2026-05-18 20:00:03', '2026-05-18 20:00:03'),
(2, '1779134403298-331472817.jpg', 'a2e111eb4f443af40a2bb92675fb4048aa7b8125e84cf13e8a0707e84a43cb36', 1, '2026-05-18 20:00:03', '2026-05-18 20:00:03');

-- --------------------------------------------------------
-- Table structure for table `fraud_alerts`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `fraud_alerts`;
CREATE TABLE `fraud_alerts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `entity_type` enum('prestataire','adherent') NOT NULL,
  `entity_id` int(11) NOT NULL,
  `score` int(11) NOT NULL,
  `reason` text NOT NULL,
  `statut` enum('active','resolved','ignored') DEFAULT 'active',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `journaux`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `journaux`;
CREATE TABLE `journaux` (
  `id_log` int(11) NOT NULL AUTO_INCREMENT,
  `action` varchar(255) NOT NULL,
  `adresse_ip` varchar(255) DEFAULT NULL,
  `userId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `ancienneValeur` varchar(255) DEFAULT NULL,
  `nouvelleValeur` varchar(255) DEFAULT NULL,
  `dateAction` datetime DEFAULT NULL,
  PRIMARY KEY (`id_log`),
  KEY `userId` (`userId`),
  CONSTRAINT `journaux_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `journaux`

INSERT INTO `journaux` (`id_log`, `action`, `adresse_ip`, `userId`, `createdAt`, `updatedAt`, `ancienneValeur`, `nouvelleValeur`, `dateAction`) VALUES 
(1, 'Modification des barèmes de remboursement (Plafonds / Tarifs)', '::1', 1, '2026-05-18 19:50:00', '2026-05-18 19:50:00', NULL, NULL, NULL),
(2, 'PUT sur /api/reimbursement/rules', '::1', 1, '2026-05-18 19:50:00', '2026-05-18 19:50:00', NULL, NULL, NULL),
(3, 'PUT sur /api/reimbursement/rules', '::1', 1, '2026-05-18 19:52:44', '2026-05-18 19:52:44', NULL, NULL, NULL),
(4, 'Modification des barèmes de remboursement (Plafonds / Tarifs)', '::1', 1, '2026-05-18 19:52:44', '2026-05-18 19:52:44', NULL, NULL, NULL),
(5, 'POST sur /api/ai/analyze-bulletin', '::1', 1, '2026-05-18 19:57:22', '2026-05-18 19:57:22', NULL, NULL, NULL),
(6, 'POST sur /api/bulletins', '::1', 1, '2026-05-18 20:00:03', '2026-05-18 20:00:03', NULL, NULL, NULL),
(7, 'PUT sur /api/bulletins/:id', '::1', 1, '2026-05-18 20:02:58', '2026-05-18 20:02:58', NULL, NULL, NULL),
(8, 'PUT sur /api/bulletins/:id', '::1', 1, '2026-05-18 20:03:44', '2026-05-18 20:03:44', NULL, NULL, NULL),
(9, 'PUT sur /api/bulletins/:id', '::1', 1, '2026-05-18 20:04:21', '2026-05-18 20:04:21', NULL, NULL, NULL),
(10, 'PUT sur /api/bulletins/:id', '::1', 1, '2026-05-18 20:05:25', '2026-05-18 20:05:25', NULL, NULL, NULL),
(11, 'PUT sur /api/bulletins/acte/:id/status', '::1', 1, '2026-05-18 20:06:32', '2026-05-18 20:06:32', NULL, NULL, NULL),
(12, 'POST sur /api/auth/logout', '::1', 1, '2026-05-18 20:42:25', '2026-05-18 20:42:25', NULL, NULL, NULL),
(13, 'POST sur /api/auth/logout', '::1', 1, '2026-05-18 20:42:25', '2026-05-18 20:42:25', NULL, NULL, NULL),
(14, 'POST sur /api/auth/login', '::1', 2, '2026-05-18 20:42:51', '2026-05-18 20:42:51', NULL, NULL, NULL),
(15, 'POST sur /api/beneficiaries', '::1', 2, '2026-05-18 20:44:21', '2026-05-18 20:44:21', NULL, NULL, NULL),
(16, 'PUT sur /api/beneficiaries/:id/status', '::1', 2, '2026-05-18 20:44:29', '2026-05-18 20:44:29', NULL, NULL, NULL),
(17, 'PUT sur /api/beneficiaries/:id/status', '::1', 2, '2026-05-18 20:58:08', '2026-05-18 20:58:08', NULL, NULL, NULL),
(18, 'POST sur /api/auth/logout', '::1', 2, '2026-05-18 21:11:38', '2026-05-18 21:11:38', NULL, NULL, NULL),
(19, 'POST sur /api/auth/logout', '::1', 2, '2026-05-18 21:11:38', '2026-05-18 21:11:38', NULL, NULL, NULL),
(20, 'POST sur /api/auth/login', '::1', 1, '2026-05-18 21:11:50', '2026-05-18 21:11:50', NULL, NULL, NULL),
(21, 'POST sur /api/auth/logout', '::1', 1, '2026-05-18 21:15:31', '2026-05-18 21:15:31', NULL, NULL, NULL),
(22, 'POST sur /api/auth/logout', '::1', 1, '2026-05-18 21:15:31', '2026-05-18 21:15:31', NULL, NULL, NULL),
(23, 'POST sur /api/auth/login', '::1', 2, '2026-05-18 21:15:58', '2026-05-18 21:15:58', NULL, NULL, NULL),
(24, 'PUT sur /api/beneficiaries/:id/status', '::1', 2, '2026-05-18 21:18:24', '2026-05-18 21:18:24', NULL, NULL, NULL),
(25, 'PUT sur /api/users/:id/status', '::1', 2, '2026-05-18 21:47:25', '2026-05-18 21:47:25', NULL, NULL, NULL),
(26, 'PUT sur /api/users/:id/status', '::1', 2, '2026-05-18 21:47:26', '2026-05-18 21:47:26', NULL, NULL, NULL),
(27, 'PUT sur /api/users/:id/status', '::1', 2, '2026-05-18 21:48:14', '2026-05-18 21:48:14', NULL, NULL, NULL),
(28, 'PUT sur /api/users/:id/status', '::1', 2, '2026-05-18 21:48:16', '2026-05-18 21:48:16', NULL, NULL, NULL),
(29, 'POST sur /api/auth/login', '127.0.0.1', 2, '2026-05-20 20:10:59', '2026-05-20 20:10:59', NULL, NULL, NULL),
(30, 'PUT sur /api/users/:id/status', '127.0.0.1', 2, '2026-05-20 20:20:38', '2026-05-20 20:20:38', NULL, NULL, NULL),
(31, 'POST sur /api/auth/login', '127.0.0.1', 2, '2026-05-20 21:39:13', '2026-05-20 21:39:13', NULL, NULL, NULL),
(32, 'PUT sur /api/users/:id/status', '127.0.0.1', 2, '2026-05-20 21:40:05', '2026-05-20 21:40:05', NULL, NULL, NULL),
(33, 'POST sur /api/auth/login', '127.0.0.1', 2, '2026-05-21 15:55:06', '2026-05-21 15:55:06', NULL, NULL, NULL),
(34, 'PUT sur /api/users/:id/status', '127.0.0.1', 2, '2026-05-21 15:55:11', '2026-05-21 15:55:11', NULL, NULL, NULL),
(35, 'POST sur /api/auth/logout', '127.0.0.1', 2, '2026-05-21 15:55:16', '2026-05-21 15:55:16', NULL, NULL, NULL),
(36, 'POST sur /api/auth/logout', '127.0.0.1', 2, '2026-05-21 15:55:16', '2026-05-21 15:55:16', NULL, NULL, NULL),
(37, 'POST sur /api/auth/login', '127.0.0.1', 1, '2026-05-21 15:55:26', '2026-05-21 15:55:26', NULL, NULL, NULL),
(38, 'POST sur /api/reclamations', '127.0.0.1', 1, '2026-05-21 15:55:42', '2026-05-21 15:55:42', NULL, NULL, NULL),
(39, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 1, '2026-05-21 15:55:54', '2026-05-21 15:55:54', NULL, NULL, NULL),
(40, 'POST sur /api/auth/logout', '127.0.0.1', 1, '2026-05-21 15:57:44', '2026-05-21 15:57:44', NULL, NULL, NULL),
(41, 'POST sur /api/auth/logout', '127.0.0.1', 1, '2026-05-21 15:57:44', '2026-05-21 15:57:44', NULL, NULL, NULL),
(42, 'POST sur /api/auth/login', '127.0.0.1', 4, '2026-05-21 15:57:59', '2026-05-21 15:57:59', NULL, NULL, NULL),
(43, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 4, '2026-05-21 15:58:09', '2026-05-21 15:58:09', NULL, NULL, NULL),
(44, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 4, '2026-05-21 15:58:13', '2026-05-21 15:58:13', NULL, NULL, NULL),
(45, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 4, '2026-05-21 15:58:17', '2026-05-21 15:58:17', NULL, NULL, NULL),
(46, 'POST sur /api/auth/login', '127.0.0.1', 4, '2026-05-27 22:01:00', '2026-05-27 22:01:00', NULL, NULL, NULL),
(47, 'POST sur /api/backups', '127.0.0.1', 4, '2026-05-27 22:02:34', '2026-05-27 22:02:34', NULL, NULL, NULL),
(48, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 4, '2026-05-27 22:14:36', '2026-05-27 22:14:36', NULL, '{\"statusChange\":\"En cours\"}', '2026-05-27 22:14:36'),
(49, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 4, '2026-05-27 22:15:23', '2026-05-27 22:15:23', NULL, '{\"priorityChange\":\"Moyenne\"}', '2026-05-27 22:15:23'),
(50, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 4, '2026-05-27 22:16:07', '2026-05-27 22:16:07', NULL, '{\"statusChange\":\"En cours\"}', '2026-05-27 22:16:07'),
(51, 'POST sur /api/backups', '127.0.0.1', 4, '2026-05-27 22:16:23', '2026-05-27 22:16:23', NULL, NULL, '2026-05-27 22:16:23'),
(52, 'POST sur /api/backups', '127.0.0.1', 4, '2026-05-27 22:31:03', '2026-05-27 22:31:03', NULL, NULL, '2026-05-27 22:31:03'),
(53, 'POST sur /api/reclamations/:id/messages', '127.0.0.1', 4, '2026-05-27 22:32:16', '2026-05-27 22:32:16', '{\"statut\":\"En cours\",\"priorite\":\"Moyenne\"}', '{\"statusChange\":\"Répondu\"}', '2026-05-27 22:32:16'),
(54, 'DELETE sur /api/backups/backup-assurance_db-2026-05-27_22-02-33.sql', '127.0.0.1', 4, '2026-05-27 22:35:42', '2026-05-27 22:35:42', NULL, NULL, '2026-05-27 22:35:42');

-- --------------------------------------------------------
-- Table structure for table `maladie_consumptions`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `maladie_consumptions`;
CREATE TABLE `maladie_consumptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `maladieId` int(11) NOT NULL,
  `annee` int(11) NOT NULL,
  `categorie` varchar(255) NOT NULL,
  `montant_consomme` decimal(10,3) NOT NULL DEFAULT 0.000,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `maladie_consumptions_maladie_id_annee_categorie` (`maladieId`,`annee`,`categorie`),
  CONSTRAINT `maladie_consumptions_ibfk_1` FOREIGN KEY (`maladieId`) REFERENCES `beneficiaires` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `maladie_consumptions`

INSERT INTO `maladie_consumptions` (`id`, `maladieId`, `annee`, `categorie`, `montant_consomme`, `createdAt`, `updatedAt`) VALUES 
(1, 1, 2026, 'AUTRES', '16.000', '2026-05-18 20:00:03', '2026-05-18 20:06:32'),
(2, 1, 2026, 'GLOBAL', '165.000', '2026-05-18 20:00:03', '2026-05-18 20:06:32'),
(3, 1, 2026, 'RADIOLOGIE', '108.000', '2026-05-18 20:00:03', '2026-05-18 20:05:24'),
(4, 1, 2026, 'DENTAIRE', '8.000', '2026-05-18 20:00:03', '2026-05-18 20:05:24'),
(5, 1, 2026, 'PHARMACIE', '33.000', '2026-05-18 20:04:20', '2026-05-18 20:05:24');

-- --------------------------------------------------------
-- Table structure for table `medicaments`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `medicaments`;
CREATE TABLE `medicaments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pharmacieId` int(11) NOT NULL,
  `nom_medicament` varchar(255) NOT NULL,
  `dosage` varchar(255) DEFAULT NULL,
  `quantite` int(11) NOT NULL DEFAULT 1,
  `prix_unitaire` double NOT NULL DEFAULT 0,
  `montant_total` double NOT NULL DEFAULT 0,
  `montant_remboursement` double NOT NULL DEFAULT 0,
  `statut` int(11) DEFAULT 0,
  `objet_rejet` varchar(255) DEFAULT NULL,
  `motif_rejet` text DEFAULT NULL,
  `message_remboursement` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pharmacieId` (`pharmacieId`),
  CONSTRAINT `medicaments_ibfk_1` FOREIGN KEY (`pharmacieId`) REFERENCES `pharmacies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `medicaments`

INSERT INTO `medicaments` (`id`, `pharmacieId`, `nom_medicament`, `dosage`, `quantite`, `prix_unitaire`, `montant_total`, `montant_remboursement`, `statut`, `objet_rejet`, `motif_rejet`, `message_remboursement`, `createdAt`, `updatedAt`) VALUES 
(1, 1, 'FINALGON 100MG', '100MG', 1, 20, 20, 18, 2, 'Attiendre plafond', 'Plafond annuel global atteint (200 TND).', '', '2026-05-18 20:00:03', '2026-05-18 20:05:25'),
(2, 1, 'PAYBUNA 500', '500', 1, 100, 100, 15, 2, 'Attiendre plafond', 'Plafond annuel global atteint (200 TND).', 'Plafond annuel global atteint (200 TND).', '2026-05-18 20:00:03', '2026-05-18 20:05:25'),
(3, 1, 'SINE', '', 1, 30, 30, 0, 2, 'Attiendre plafond', 'Plafond annuel global atteint (200 TND).', NULL, '2026-05-18 20:00:03', '2026-05-18 20:05:25'),
(4, 1, 'TORROD 1000', '1000', 1, 100, 100, 0, 2, 'Attiendre plafond', 'Plafond annuel global atteint (200 TND).', NULL, '2026-05-18 20:00:03', '2026-05-18 20:05:25');

-- --------------------------------------------------------
-- Table structure for table `motifs_rejet`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `motifs_rejet`;
CREATE TABLE `motifs_rejet` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `libelle` varchar(255) NOT NULL COMMENT 'Libellé court du motif, ex: Document illisible',
  `description` text DEFAULT NULL COMMENT 'Description longue affichée à l''adhérent',
  `categorie` enum('document','montant','beneficiaire','doublon','autre') NOT NULL DEFAULT 'autre',
  `actif` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Permet de désactiver un motif sans le supprimer',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- Table structure for table `notifications`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `titre` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `type` varchar(255) DEFAULT NULL,
  `priorite` varchar(255) DEFAULT NULL,
  `lu` tinyint(1) NOT NULL DEFAULT 0,
  `userId` int(11) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `notifications`

INSERT INTO `notifications` (`id`, `titre`, `description`, `type`, `priorite`, `lu`, `userId`, `createdAt`, `updatedAt`) VALUES 
(1, '👶 Nouveau bénéficiaire à valider', 'Un nouveau bénéficiaire (test test) a été ajouté par RH Responsable.', 'beneficiaire', 'normale', 0, 2, '2026-05-18 20:44:20', '2026-05-18 20:44:20'),
(2, '✅ Bénéficiaire validé', 'Votre demande d\'ajout du bénéficiaire test test a été validée par l\'administration.', 'beneficiaire', 'normale', 0, 2, '2026-05-18 20:44:29', '2026-05-18 20:44:29'),
(3, '❌ Bénéficiaire rejeté', 'Votre demande d\'ajout du bénéficiaire test test a été rejetée. Motif : Informations incohérentes entre les documents fournis — yytfgkjh', 'beneficiaire', 'haute', 0, 2, '2026-05-18 20:58:08', '2026-05-18 20:58:08'),
(4, '❌ Bénéficiaire rejeté', 'Votre demande d\'ajout du bénéficiaire test test a été rejetée. Motif : Pièce justificative non conforme ou illisible — jkuighlumilk', 'beneficiaire', 'haute', 0, 2, '2026-05-18 21:18:24', '2026-05-18 21:18:24'),
(5, '📢 Nouvelle réclamation', 'Nouvelle réclamation de Test Admin : \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-21 15:55:42', '2026-05-21 15:55:42'),
(6, '💬 Nouveau message (Réclamation)', 'Test Admin a envoyé un message sur la réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-21 15:55:54', '2026-05-21 15:55:54'),
(7, '💬 Nouveau message de l\'administration', 'Vous avez reçu un nouveau message concernant votre réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-21 15:58:09', '2026-05-21 15:58:09'),
(8, '💬 Nouveau message de l\'administration', 'Vous avez reçu un nouveau message concernant votre réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-21 15:58:13', '2026-05-21 15:58:13'),
(9, '💬 Nouveau message de l\'administration', 'Vous avez reçu un nouveau message concernant votre réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-21 15:58:17', '2026-05-21 15:58:17'),
(10, '💬 Nouveau message de l\'administration', 'Vous avez reçu un nouveau message concernant votre réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-27 22:14:36', '2026-05-27 22:14:36'),
(11, '💬 Nouveau message de l\'administration', 'Vous avez reçu un nouveau message concernant votre réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-27 22:15:23', '2026-05-27 22:15:23'),
(12, '💬 Nouveau message de l\'administration', 'Vous avez reçu un nouveau message concernant votre réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-27 22:16:07', '2026-05-27 22:16:07'),
(13, '💬 Nouveau message de l\'administration', 'Vous avez reçu un nouveau message concernant votre réclamation \"AUTRES RECLAMATIONS BS\"', 'reclamation', NULL, 0, 1, '2026-05-27 22:32:16', '2026-05-27 22:32:16');

-- --------------------------------------------------------
-- Table structure for table `pharmacies`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `pharmacies`;
CREATE TABLE `pharmacies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `bulletinId` int(11) NOT NULL,
  `identifiant_unique_mf` varchar(255) DEFAULT NULL,
  `prestataireId` int(11) DEFAULT NULL,
  `est_cachet` tinyint(1) NOT NULL DEFAULT 0,
  `est_signature` tinyint(1) NOT NULL DEFAULT 0,
  `date_cachet_signature` date DEFAULT NULL,
  `montant_pharmacie` double NOT NULL DEFAULT 0,
  `montant_remboursement` double NOT NULL DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `bulletinId` (`bulletinId`),
  KEY `prestataireId` (`prestataireId`),
  CONSTRAINT `pharmacies_ibfk_35` FOREIGN KEY (`bulletinId`) REFERENCES `bulletin_soins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `pharmacies_ibfk_36` FOREIGN KEY (`prestataireId`) REFERENCES `prestataires` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `pharmacies`

INSERT INTO `pharmacies` (`id`, `bulletinId`, `identifiant_unique_mf`, `prestataireId`, `est_cachet`, `est_signature`, `date_cachet_signature`, `montant_pharmacie`, `montant_remboursement`, `createdAt`, `updatedAt`) VALUES 
(1, 1, 'MF-53210', 60, 1, 1, NULL, 250, 33, '2026-05-18 20:00:03', '2026-05-18 20:05:25');

-- --------------------------------------------------------
-- Table structure for table `prestataires`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `prestataires`;
CREATE TABLE `prestataires` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `identifiant_unique_mf` varchar(255) DEFAULT NULL,
  `nom` varchar(255) DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `specialite` varchar(255) DEFAULT NULL,
  `gsm` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `identifiant_unique_mf` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_2` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_2` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_3` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_3` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_4` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_4` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_5` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_5` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_6` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_6` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_7` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_7` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_8` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_8` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_9` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_9` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_10` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_10` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_11` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_11` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_12` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_12` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_13` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_13` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_14` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_14` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_15` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_15` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_16` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_16` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_17` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_17` (`telephone`),
  UNIQUE KEY `identifiant_unique_mf_18` (`identifiant_unique_mf`),
  UNIQUE KEY `telephone_18` (`telephone`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `prestataires`

INSERT INTO `prestataires` (`id`, `identifiant_unique_mf`, `nom`, `telephone`, `adresse`, `specialite`, `gsm`, `createdAt`, `updatedAt`) VALUES 
(1, NULL, 'Centre D\'imagerie de CAP-BON', '72 287 155', '166 Avenue Habib bourguiba IMMEUBLE TOUR D\'ARGENT 4ÉME ÉTAGE', 'Centre de radiologie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(2, NULL, 'Ph Abdelkader BOUFEID', '72 296 254', 'Avenue Habib Bourguiba kelibia', 'Pharmacie', '98 628 450', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(3, NULL, 'Ph Ali BEN ALI', '72 373 303', '113 Rue Ali Chouk 8021 Beni Khalled, Nabeul', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(4, NULL, 'Ph Mohamed Alaeddine REGUIG', '72 287 930', '157 Avenue Habib Bourguiba, Nabeul', 'Pharmacie', '50 975 853', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(5, NULL, 'Ph Mouna MILED BOUGHZALA', '72 272 817', '72 Avenue Habib Bourguiba 8000 Nabeul', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(6, NULL, 'Ph Nabil MEHRI', '72 213 683', 'Avenue HABIB BOURGUIBA NABEUL GROMBALIA', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(7, NULL, 'Ph Saloua SEBAI', '72 258 012', 'Rue Farhat Hached 8030 Grombalia, Nabeul', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(8, NULL, 'Ph Samar BOUACHIR JEDIDI', '72 213 383', 'Cite Olympique , Grombalia Nabeul', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(9, NULL, 'Ph Soumaya NAJJAR EP BEN NACEF', '72 384 223', 'Rue de la liberté korba', 'Pharmacie', '98 248 124', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(10, NULL, 'Ph Walid MAALEJ', '72 323 024', 'Avenue abou dhabi 8050 mrezka Hammamet Nabeul', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(11, NULL, 'Ph Khemais BEL KAHLA', '72 213 046', 'Rue Ali balhouane grombalia 8030', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(12, NULL, 'Ph Monia ROUIS', '72 361 672', '91, avenue Habib Bourguiba, Dar Chaabane el Fehri, Nabeul', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(13, NULL, 'Ph Amira ZOUITER', '72 355 040', '9, Avenue DE L\'INDÉPENDANCE NABEUL SOMAA Beni khiar', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(14, NULL, 'Ph Rayan ISSAOUI', '72 346 506', 'Rue Manzel Temime Nabeul 8080', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(15, NULL, 'Ph Wafa GHARBI', '72 285 950', '44, Avenue 2 MARS 1934 -SIDI ACHOUR Nabeul', 'Pharmacie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(16, NULL, 'Dr Abdelkader BEY', '98 264 690', '198 av habib bourguiba Korba 8070 Nabeul', 'Généraliste', '98 264 690', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(17, NULL, 'Dr Amel HASSINE', '31 137 226', 'Avenue Habib Bourguiba imm Herguem 2 eme étage - Beni Khalled', 'Généraliste', '24 247 509', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(18, NULL, 'Dr Amir JOUIDA', '72 257 673', '21 Rue Tazarka Grombalia 8030 Nabeul', 'Généraliste', '98 262 494', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(19, NULL, 'Dr Foued OUESLATI', '72 230 007', '45 Bis Av. Habib Thameur (A Côté De L\'Amen Bank)', 'Généraliste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(20, NULL, 'Dr Imed LEJMI', '72 230 414', '79 Avenue Habib Bourguiba', 'Généraliste', '98 309 660', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(21, NULL, 'Dr Insaf BOUKRAYA BEY', '98 484 983', 'Avenue 14 Janvier cite ennajah Tazarka 8024 Nabeul', 'Généraliste', '98 484 983', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(22, NULL, 'Dr Leila HAMMAMI BOUANANE', '72 275 066', '125 Avenue Ali Belahouane 8090 Kélibia, Nabeul', 'Généraliste', '98 345 463', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(23, NULL, 'Dr Modather MARZOUK', '97 396 707', 'Avenue Habib Bourguiba . Immeuble La Jarre 1, 2éme Étage 8000 Nabeul', 'Généraliste', '97 396 707', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(24, NULL, 'Dr Mohamed sghaier TRIMECHE', '72 257 326', '63 avenue de la république Grombalia 8030 Nabeul', 'Généraliste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(25, NULL, 'Dr Noureddine BEN ABDALLAH', '72 224 400', '156 Avenue habib bourguiba imm hadoussa 2éme étage 8000 nabeul', 'Généraliste', '98 342 451', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(26, NULL, 'Dr Samir CHRITI', '72 256 605', 'Rue Farhat Hached Immeuble Dhaouadi Grombalia, App n° 1, GROMBALIA, en face secteur de police, Nabeul, 8030', 'Généraliste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(27, NULL, 'Dr Hichem MOKHTAR', '72 384 679', 'Avenue Farhat hached Korba', 'Généraliste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(28, NULL, 'Kiné Saif Eddine HAMANDI', '36 389 901', 'Place 14 Janvier imm. la jarre 2 3ème etage 8000 Nabeul', 'Kinésithérapeute', '21 191 817', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(29, NULL, 'Dr Amal DIDOUNI', '58 696 405', 'Centre Médical Echifa -- 1er étage Avenue Habib Bourguiba -- GP1 -- Grombalia 8030, Nabeul (Au dessus de Pharmacie Nabil Mehri)', 'Gynécologue', '58 696 405', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(30, NULL, 'Dr Mohamed KHELIF', '51 559 620', 'Hermes médical, avenue habib bourguiba,Grombalia 8030 Nabeul', 'Ophtalmologie', '55 559 605', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(31, NULL, 'CLINIQUE AMEN NABEUL', '70 130 320', 'Avenue Hédi Nouira, Nabeul', 'Clinique', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(32, NULL, 'CLINIQUE EL HAKIM', '72 385 000', 'Route Korba-Tazarka 8024 Nabeul', 'Clinique', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(33, NULL, 'Dr Sophia BOUSNINA FEKIH', '72 232 053', 'Avenue hedi nouira immeuble jasmin 8000 Nabeul', 'Pneumologue', '98 325 002', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(34, NULL, 'Dr Farouk JAOUADI', '28 126 064', '144 avenue Habib Bourguiba ( en face de Enda) rez de chaussée Soliman 8020 Nabeul', 'Cardiologie', '28 299 194', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(35, NULL, 'Dr Hajer CHEMLI', '55 449 695', 'Bureau A1.1 1er étage, Bloc A, Centre Médical EYA, Av. Hédi Nouira, Nabeul', 'Dentiste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(36, NULL, 'Dr Houda DJEBALI', '72 262 195', '274 Avenue de la Libération 8050 Hammamet', 'Dentiste', '95 820 601', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(37, NULL, 'Dr Khaled BEN OTHMAN', '72 237 228', 'Avenue Mongi Bali Immeuble Tej 1 ére étage 8000 Nabeul', 'Dentiste', '20 299 917', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(38, NULL, 'Dr Mohamed Omar JEBALI', '26 621 665', 'Korba', 'Dentiste', '26 621 665', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(39, NULL, 'Dr Sabrine BOUANENE', '50 909 860', 'Rue Ali Belhouane, immeuble Msallem , 1er étage Grombalia 8030 Nabeul', 'Dentiste', '50 909 860', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(40, NULL, 'Dr Sami BOUOUD', '72 287 480', '121, Av. Hedi Chaker, immeuble silver tower, 8000 nabeul Tunisie', 'Dentiste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(41, NULL, 'Dr Azza TOUMI LAMIRI', '72 211 655', '32 rue hédi chaker GROMBALIA', 'Dentiste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(42, NULL, 'Dr Dhia LASSOUED', '20 222 347', 'Avenue Habib thameur immeuble zahrat nabeul 3ème bureau N2', 'Dentiste', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(43, NULL, 'Labo Ferid BEN FADHEL', '72 276 252', 'Place De La République -1er Étage- (A Coté De La Stb) Kélibia', 'Laboratoire d\'analyses', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(44, NULL, 'Labo Houda CHOUK', '72 286 440', 'Appt 301, Rue Habib Thameur (au dessus de Carrefour Market) 8000 Nabeul', 'Laboratoire d\'analyses', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(45, NULL, 'Labo Mohamed SALLEM', '72 270 777', '13 avenue Habib Thameur -- Immeuble Gannar, 3ème étage (au dessus de Gabana) prés de l\'hopital Régional Med Tletli nabeul', 'Laboratoire d\'analyses', '92 270 772', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(46, NULL, 'Labo Neila ZIADIA HAJJI', '72 211 520', 'Rue Mohamed V - Imm. Meriem R.D.C Appt A2 (à côté de la Poste) - 8030 Grombalia', 'Laboratoire d\'analyses', '97 707 732', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(47, NULL, 'Labo Safa BOUOTHMAN MABROUK', '72 345 203', 'Avenue hadj bechir ben fadhel manzel temime 8080', 'Laboratoire d\'analyses', '23 301 447', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(48, NULL, 'Labo Sameh BELHADJ BELLAMINE', '72 285 800', '156 AV HABIB BOURGUIBA IMM HADOUSSA 2EME ETAGE APP B2-3', 'Laboratoire d\'analyses', '53 285 800', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(49, NULL, 'Labo Mohamed Ali BEN SALEM', '72 256 652', 'Elyes Centre, 2ème étage (Ascenseur) Bureau N°213-Avenue Habib Bourguiba-Grombalia 8030', 'Laboratoire d\'analyses', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(50, NULL, 'Labo Zied AZAIEZ', '72 333 277', 'Rue de changement soliman', 'Laboratoire d\'analyses', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(51, NULL, 'Labo Marwa MAJDOUBI', '72 262 430', 'Avenue de koweit hammamet', 'Laboratoire d\'analyses', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(52, NULL, 'CENTRE DE RADIOLOGIE Dr Mohamed Amine CHEMLI', '72 231 560', '113 AvenueHabib Bourguiba 8000 Nabeul', 'Centre de radiologie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(53, NULL, 'CENTRE D\'IMAGERIE MÉDICALE KELIBIA', '72 275 790', '74 Avenue Ali belhouane, Kélibia', 'Centre de radiologie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(54, NULL, 'Dr Meriem MADHBOUH', '98 620 615', 'Avenue Habib Thameur, Complexe Essalama, 3ème étage (au-dessus de carrefour) -- N°401 Nabeul', 'Endocrinologie-Diabétologie', '98 620 615', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(55, NULL, 'Dr Nabiha BEN AHMED', '72 224 745', 'Avenue Hedi Chaker imm Larous 2ème étage en face Monoprix express Nabeul 8000', 'Ophtalmologie', '', '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(56, 'MF-987654', 'testkjlk', NULL, NULL, NULL, NULL, '2026-05-18 20:00:03', '2026-05-18 20:03:44'),
(57, 'MF-466321', 'testkpojikj', NULL, NULL, NULL, NULL, '2026-05-18 20:00:03', '2026-05-18 20:03:44'),
(58, 'MF-456321', 'testk ojlkn', NULL, NULL, NULL, NULL, '2026-05-18 20:00:03', '2026-05-18 20:03:44'),
(59, '06789', 'test', NULL, NULL, 'DENTISTE', NULL, '2026-05-18 20:00:03', '2026-05-18 20:00:03'),
(60, 'MF-53210', 'test', NULL, NULL, 'PHARMACIE', NULL, '2026-05-18 20:00:03', '2026-05-18 20:00:03');

-- --------------------------------------------------------
-- Table structure for table `reclamation_messages`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `reclamation_messages`;
CREATE TABLE `reclamation_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reclamationId` int(11) NOT NULL,
  `senderId` int(11) NOT NULL,
  `content` text DEFAULT NULL,
  `statusChange` enum('Ouverte','En cours','Répondu','Clôturée') DEFAULT NULL,
  `priorityChange` enum('Basse','Moyenne','Haute') DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `reclamationId` (`reclamationId`),
  KEY `senderId` (`senderId`),
  CONSTRAINT `reclamation_messages_ibfk_33` FOREIGN KEY (`reclamationId`) REFERENCES `reclamations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reclamation_messages_ibfk_34` FOREIGN KEY (`senderId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `reclamation_messages`

INSERT INTO `reclamation_messages` (`id`, `reclamationId`, `senderId`, `content`, `statusChange`, `priorityChange`, `createdAt`, `updatedAt`) VALUES 
(1, 1, 1, 'hello', NULL, NULL, '2026-05-21 15:55:54', '2026-05-21 15:55:54'),
(2, 1, 4, NULL, 'En cours', NULL, '2026-05-21 15:58:09', '2026-05-21 15:58:09'),
(3, 1, 4, NULL, 'Répondu', 'Basse', '2026-05-21 15:58:13', '2026-05-21 15:58:13'),
(4, 1, 4, 'hello', 'Répondu', NULL, '2026-05-21 15:58:17', '2026-05-21 15:58:17'),
(5, 1, 4, NULL, 'En cours', NULL, '2026-05-27 22:14:36', '2026-05-27 22:14:36'),
(6, 1, 4, NULL, 'Répondu', 'Moyenne', '2026-05-27 22:15:23', '2026-05-27 22:15:23'),
(7, 1, 4, NULL, 'En cours', NULL, '2026-05-27 22:16:07', '2026-05-27 22:16:07'),
(8, 1, 4, NULL, 'Répondu', NULL, '2026-05-27 22:32:16', '2026-05-27 22:32:16');

-- --------------------------------------------------------
-- Table structure for table `reclamations`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `reclamations`;
CREATE TABLE `reclamations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference` varchar(255) DEFAULT NULL,
  `objet` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `statut` enum('Ouverte','En cours','Répondu','Clôturée') DEFAULT 'Ouverte',
  `priorite` enum('Basse','Moyenne','Haute') DEFAULT 'Moyenne',
  `userId` int(11) NOT NULL,
  `adminId` int(11) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `bulletinId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `reference` (`reference`),
  UNIQUE KEY `reference_2` (`reference`),
  UNIQUE KEY `reference_3` (`reference`),
  UNIQUE KEY `reference_4` (`reference`),
  UNIQUE KEY `reference_5` (`reference`),
  UNIQUE KEY `reference_6` (`reference`),
  UNIQUE KEY `reference_7` (`reference`),
  UNIQUE KEY `reference_8` (`reference`),
  UNIQUE KEY `reference_9` (`reference`),
  UNIQUE KEY `reference_10` (`reference`),
  UNIQUE KEY `reference_11` (`reference`),
  UNIQUE KEY `reference_12` (`reference`),
  UNIQUE KEY `reference_13` (`reference`),
  UNIQUE KEY `reference_14` (`reference`),
  UNIQUE KEY `reference_15` (`reference`),
  UNIQUE KEY `reference_16` (`reference`),
  UNIQUE KEY `reference_17` (`reference`),
  KEY `userId` (`userId`),
  KEY `adminId` (`adminId`),
  KEY `bulletinId` (`bulletinId`),
  CONSTRAINT `reclamations_ibfk_49` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reclamations_ibfk_50` FOREIGN KEY (`adminId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reclamations_ibfk_51` FOREIGN KEY (`bulletinId`) REFERENCES `bulletin_soins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `reclamations`

INSERT INTO `reclamations` (`id`, `reference`, `objet`, `description`, `statut`, `priorite`, `userId`, `adminId`, `createdAt`, `updatedAt`, `bulletinId`) VALUES 
(1, 'REQ-1779378942035-455', 'AUTRES RECLAMATIONS BS', 'test', 'Répondu', 'Moyenne', 1, 4, '2026-05-21 15:55:42', '2026-05-27 22:32:16', 1);

-- --------------------------------------------------------
-- Table structure for table `users`
-- --------------------------------------------------------

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `matricule` varchar(255) DEFAULT NULL,
  `nom` varchar(255) NOT NULL,
  `prenom` varchar(255) NOT NULL,
  `ddn` date DEFAULT NULL,
  `telephone` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `mot_de_passe` varchar(255) DEFAULT NULL,
  `statut` int(11) DEFAULT 0,
  `objet_blocage` varchar(255) DEFAULT NULL,
  `motif_blocage` varchar(255) DEFAULT NULL,
  `adresse` varchar(255) DEFAULT NULL,
  `ville` varchar(255) DEFAULT NULL,
  `sexe` enum('M','F') DEFAULT NULL,
  `role` enum('ADMIN','ADHERENT','RESPONSABLE_RH','SUPER_ADMIN') NOT NULL DEFAULT 'ADHERENT',
  `resetPasswordCode` varchar(255) DEFAULT NULL,
  `resetPasswordExpires` datetime DEFAULT NULL,
  `derniere_connexion` datetime DEFAULT NULL,
  `nb_bulletins_soumis` int(11) DEFAULT 0,
  `nb_reclamation` int(11) DEFAULT 0,
  `total_rembourse_annuel` double DEFAULT 0,
  `avatar` varchar(255) DEFAULT NULL,
  `code_cnam` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `matricule` (`matricule`),
  UNIQUE KEY `code_cnam` (`code_cnam`),
  UNIQUE KEY `matricule_2` (`matricule`),
  UNIQUE KEY `code_cnam_2` (`code_cnam`),
  UNIQUE KEY `matricule_3` (`matricule`),
  UNIQUE KEY `code_cnam_3` (`code_cnam`),
  UNIQUE KEY `matricule_4` (`matricule`),
  UNIQUE KEY `code_cnam_4` (`code_cnam`),
  UNIQUE KEY `matricule_5` (`matricule`),
  UNIQUE KEY `code_cnam_5` (`code_cnam`),
  UNIQUE KEY `matricule_6` (`matricule`),
  UNIQUE KEY `code_cnam_6` (`code_cnam`),
  UNIQUE KEY `matricule_7` (`matricule`),
  UNIQUE KEY `code_cnam_7` (`code_cnam`),
  UNIQUE KEY `matricule_8` (`matricule`),
  UNIQUE KEY `code_cnam_8` (`code_cnam`),
  UNIQUE KEY `matricule_9` (`matricule`),
  UNIQUE KEY `code_cnam_9` (`code_cnam`),
  UNIQUE KEY `matricule_10` (`matricule`),
  UNIQUE KEY `code_cnam_10` (`code_cnam`),
  UNIQUE KEY `matricule_11` (`matricule`),
  UNIQUE KEY `code_cnam_11` (`code_cnam`),
  UNIQUE KEY `matricule_12` (`matricule`),
  UNIQUE KEY `code_cnam_12` (`code_cnam`),
  UNIQUE KEY `matricule_13` (`matricule`),
  UNIQUE KEY `code_cnam_13` (`code_cnam`),
  UNIQUE KEY `matricule_14` (`matricule`),
  UNIQUE KEY `code_cnam_14` (`code_cnam`),
  UNIQUE KEY `matricule_15` (`matricule`),
  UNIQUE KEY `code_cnam_15` (`code_cnam`),
  UNIQUE KEY `matricule_16` (`matricule`),
  UNIQUE KEY `code_cnam_16` (`code_cnam`),
  UNIQUE KEY `matricule_17` (`matricule`),
  UNIQUE KEY `code_cnam_17` (`code_cnam`),
  UNIQUE KEY `matricule_18` (`matricule`),
  UNIQUE KEY `code_cnam_18` (`code_cnam`),
  UNIQUE KEY `matricule_19` (`matricule`),
  UNIQUE KEY `code_cnam_19` (`code_cnam`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Dumping data for table `users`

INSERT INTO `users` (`id`, `matricule`, `nom`, `prenom`, `ddn`, `telephone`, `email`, `mot_de_passe`, `statut`, `objet_blocage`, `motif_blocage`, `adresse`, `ville`, `sexe`, `role`, `resetPasswordCode`, `resetPasswordExpires`, `derniere_connexion`, `nb_bulletins_soumis`, `nb_reclamation`, `total_rembourse_annuel`, `avatar`, `code_cnam`, `createdAt`, `updatedAt`) VALUES 
(1, 'ADM001', 'Admin', 'Test', '1990-01-01', NULL, 'admin@test.com', '$2b$10$qByKj.H67XKTMv/tyJGUwevpABQcPC9NX0TazUZF.wuBPI2JmKkZy', 1, 'Informations personnelles manquantes ou incomplètes', NULL, NULL, NULL, '', 'ADMIN', NULL, NULL, NULL, 0, 0, 0, NULL, NULL, '2026-05-18 19:45:55', '2026-05-21 15:55:11'),
(2, 'RH001', 'Responsable', 'RH', '1990-01-01', NULL, 'rh@test.com', '$2b$10$qByKj.H67XKTMv/tyJGUwevpABQcPC9NX0TazUZF.wuBPI2JmKkZy', 1, NULL, NULL, NULL, NULL, '', 'RESPONSABLE_RH', NULL, NULL, NULL, 0, 0, 0, NULL, NULL, '2026-05-18 19:45:55', '2026-05-18 19:45:55'),
(3, 'ADH001', 'Adherent', 'User', '1990-01-01', '12345678', 'user@test.com', '$2b$10$4BjdVMtaICq06SpXS7GCzOwOiJ7HAuvhR/VoDH.VA7z90kG/vb5km', 1, 'Adresse non valide', NULL, '123 Rue de Test', 'Ville de Test', '', 'ADHERENT', NULL, NULL, NULL, 0, 0, 0, NULL, NULL, '2026-05-18 19:45:55', '2026-05-20 20:20:38'),
(4, 'SUP001', 'Super', 'Admin', '1990-01-01', NULL, 'superadmin@test.com', '$2b$10$qByKj.H67XKTMv/tyJGUwevpABQcPC9NX0TazUZF.wuBPI2JmKkZy', 1, 'Adresse non valide', NULL, NULL, NULL, '', 'SUPER_ADMIN', NULL, NULL, NULL, 0, 0, 0, NULL, NULL, '2026-05-18 19:45:55', '2026-05-18 21:48:16');

SET FOREIGN_KEY_CHECKS = 1;
