CREATE TABLE `mailer` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_pge` varchar(200) DEFAULT NULL,
  `id_crm` int(11) unsigned DEFAULT NULL,
  `id_proveedor` int(11) DEFAULT '4',
  `id_listanegra` int(11) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `cliente` varchar(100) DEFAULT NULL,
  `email_notificaciones` varchar(300) DEFAULT NULL,
  `fecha_corte` date NOT NULL DEFAULT '0000-00-00',
  `permitir_prorateo` int(1) DEFAULT '0',
  `whitelabel` tinyint(1) DEFAULT '0',
  `mailer_version` float(2,1) DEFAULT '6.0',
  `cm_tiene_free_credits` smallint(1) DEFAULT '1',
  `api_key` varchar(200) DEFAULT NULL COMMENT 'Esta es la llave para el API',
  `api_secret` varchar(200) DEFAULT NULL COMMENT '-- Este no se usa.',
  `api_data` varchar(255) DEFAULT NULL,
  `api_email` varchar(100) DEFAULT NULL,
  `paquete` int(7) DEFAULT '0',
  `creditos` int(7) DEFAULT '0',
  `paquete_creditos_personalizados` int(7) DEFAULT '0',
  `creditos_personalizados` int(7) DEFAULT '0',
  `creditos_validacion` int(11) DEFAULT '0',
  `dia_corte` int(2) DEFAULT '1',
  `renovaciones` int(2) DEFAULT '1',
  `fecha_ini_contrato` date NOT NULL DEFAULT '0000-00-00',
  `fecha_fin_contrato` date NOT NULL DEFAULT '0000-00-00',
  `conector` varchar(100) DEFAULT NULL,
  `premium_vencimiento` timestamp NULL DEFAULT NULL,
  `listanegra_inicio` timestamp NULL DEFAULT NULL,
  `storage_size` int(11) DEFAULT '300',
  PRIMARY KEY (`id`),
  KEY `idx_id` (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE `remitentes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `estado` int(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`id_mailer`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `remitentes_dominios` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) DEFAULT NULL,
  `domain` varchar(191) DEFAULT NULL,
  `spf` smallint(1) DEFAULT '0',
  `dkim` smallint(1) DEFAULT '0',
  `fecha_validacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_mailer` (`id_mailer`,`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `m_campanas` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) DEFAULT NULL,
  `tipo` smallint(1) DEFAULT '0' COMMENT '0=Estandar 1=Personalizada',
  `nombre` varchar(200) DEFAULT NULL,
  `contenido` longtext,
  `contenido_json` longtext COMMENT 'Campo para el editor nuevo poder cargar la plantilla html',
  `plantilla` varchar(100) DEFAULT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultimo_uso` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_id_mailer` (`id_mailer`) USING BTREE,
  KEY `idx_id` (`id`) USING BTREE,
  KEY `idx_fecha_ultimo_uso` (`fecha_ultimo_uso`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE `m_contactos_est` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_lista` int(10) unsigned NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `validado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`,`id_lista`),
  KEY `id_lista` (`id_lista`),
  KEY `idx_id` (`id`) USING BTREE,
  CONSTRAINT `m_contactos_est_ibfk_1` FOREIGN KEY (`id_lista`) REFERENCES `m_listas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `m_contactos_per` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `id_lista` int(10) unsigned NOT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `direccion` varchar(50) DEFAULT NULL,
  `telefono` varchar(50) DEFAULT NULL,
  `telefono2` varchar(50) DEFAULT NULL,
  `celular` varchar(50) DEFAULT NULL,
  `ciudad` varchar(50) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `empresa` varchar(50) DEFAULT NULL,
  `profesion` varchar(50) DEFAULT NULL,
  `genero` varchar(10) DEFAULT NULL,
  `dinamico1` varchar(200) DEFAULT NULL,
  `dinamico2` varchar(200) DEFAULT NULL,
  `dinamico3` varchar(200) DEFAULT NULL,
  `dinamico4` varchar(200) DEFAULT NULL,
  `dinamico5` varchar(200) DEFAULT NULL,
  `dinamico6` varchar(200) DEFAULT NULL,
  `dinamico7` varchar(200) DEFAULT NULL,
  `dinamico8` varchar(200) DEFAULT NULL,
  `dinamico9` varchar(200) DEFAULT NULL,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `validado` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_lista` (`id_lista`,`email`),
  KEY `idx_id` (`id`) USING BTREE,
  KEY `idx_dinamico1` (`dinamico1`(191)) USING BTREE,
  KEY `idx_dinamico2` (`dinamico2`(191)) USING BTREE,
  CONSTRAINT `m_contactos_per_ibfk_1` FOREIGN KEY (`id_lista`) REFERENCES `m_listas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `m_envios` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) unsigned NOT NULL,
  `id_campana` int(11) DEFAULT NULL,
  `id_proveedor` int(11) DEFAULT NULL,
  `id_automatizacion` int(11) DEFAULT '0',
  `tipo` smallint(1) DEFAULT NULL COMMENT '0=Estandar 1=personalizad',
  `estado` smallint(1) DEFAULT '0' COMMENT '0=En espera 1=Enviado 2=Cancelado',
  `remitente` varchar(100) DEFAULT NULL,
  `remitente_nombre` varchar(100) DEFAULT NULL,
  `campana_subject` varchar(400) DEFAULT NULL,
  `campana_content` longtext,
  `campana_preview_text` text,
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_envio` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `e_total` int(11) DEFAULT '0' COMMENT 'Numero de emails de las listas seleccionadas',
  `e_lista_negra` int(11) DEFAULT '0' COMMENT 'Numero de emails que estaban en lista negra',
  `e_enviados` int(11) DEFAULT '0' COMMENT 'Numero de emails enviados',
  `e_enviados_exitosos` int(11) DEFAULT '0' COMMENT 'Numero de emails que se logro enviar',
  `e_enviados_fallidos` int(11) DEFAULT '0' COMMENT 'Numero de emails que rebotaron o quedaron en espera',
  `e_abiertos` int(11) DEFAULT '0' COMMENT 'Los que fueron abiertos por el usuario',
  `e_aperturas` int(11) DEFAULT '0' COMMENT 'La cantidad total de aperturas',
  `e_cliqueados` int(11) DEFAULT '0' COMMENT 'A los que dieron click',
  `e_clicks` int(11) DEFAULT '0',
  `e_retiradas` int(11) DEFAULT '0',
  `e_spam` int(11) DEFAULT '0' COMMENT 'Los marcados como spam',
  `e_en_cola` int(11) DEFAULT '0' COMMENT 'Los que estan pendientes de ser enviados',
  `listas` varchar(400) DEFAULT NULL,
  `data` longtext,
  `stats` longtext,
  `stats_id_remoto` varchar(100) DEFAULT NULL,
  `stats_last_update` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `aws_sqs` varchar(200) DEFAULT NULL,
  `link_bitly` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_id` (`id`) USING BTREE,
  KEY `idx_id_mailer` (`id_mailer`) USING BTREE,
  KEY `idx_id_campana` (`id_campana`) USING BTREE,
  CONSTRAINT `m_envios_ibfk_1` FOREIGN KEY (`id_mailer`) REFERENCES `mailer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `m_envios_data` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_envio` int(10) unsigned NOT NULL,
  `enviados` longtext,
  `ignorados` longtext,
  PRIMARY KEY (`id`),
  KEY `id_envio` (`id_envio`),
  CONSTRAINT `m_envios_data_ibfk_1` FOREIGN KEY (`id_envio`) REFERENCES `m_envios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `m_lista_negra` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) unsigned NOT NULL,
  `email` varchar(100) NOT NULL DEFAULT '',
  `fecha` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id_mailer` (`id_mailer`,`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `m_listas` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) unsigned NOT NULL,
  `nombre` varchar(200) DEFAULT NULL,
  `tipo` smallint(1) DEFAULT '0' COMMENT '0=Estandar 1=Personalizada',
  `emails` int(11) DEFAULT '0',
  `emails_no_validados` int(11) DEFAULT '0',
  `listanegra` smallint(1) DEFAULT '0',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_ultimo_uso` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_id_mailer` (`id_mailer`) USING BTREE,
  KEY `idx_id` (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `m_transaccional` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'ID de la cuenta de Mailer',
  `estado` enum('Enviado','Entregado','Abierto','Clickeado','Rebotado') DEFAULT NULL COMMENT 'Estado del mensaje',
  `segmento` varchar(40) DEFAULT NULL COMMENT 'Identificador para agrupar emails enviados.',
  `asunto` varchar(128) DEFAULT NULL COMMENT 'Asunto del correo electronico enviado',
  `mensaje` text COMMENT 'Contenido html del mensaje enviado',
  `remitente` varchar(128) DEFAULT NULL COMMENT 'Email usado como remitente',
  `remitente_nombre` varchar(128) DEFAULT NULL COMMENT 'Nombre puesto al remitente',
  `data` json DEFAULT NULL COMMENT 'Variables y otros parametros adicionales',
  PRIMARY KEY (`id`),
  KEY `idx_id` (`id`) USING BTREE,
  KEY `idx_id_mailer` (`id_mailer`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE `m_transaccional_events` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `id_mailer` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'ID de la cuenta de Mailer',
  `id_email` int(11) unsigned NOT NULL DEFAULT '0' COMMENT 'ID del email enviado',
  `fecha` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha del evento',
  `evento` varchar(15) DEFAULT NULL COMMENT 'Nomnbre del evento',
  `data` json DEFAULT NULL COMMENT 'Data de contexto del evento',
  PRIMARY KEY (`id`),
  KEY `idx_id` (`id`) USING BTREE,
  KEY `idx_id_mailer` (`id_mailer`) USING BTREE,
  KEY `idx_id_email` (`id_email`) USING BTREE,
  KEY `idx_id_email_id_mailer` (`id_email`,`id_mailer`) USING BTREE,
  CONSTRAINT `m_transaccional_events_ibfk_1` FOREIGN KEY (`id_email`) REFERENCES `m_transaccional` (`id`) ON DELETE CASCADE,
  CONSTRAINT `m_transaccional_events_ibfk_2` FOREIGN KEY (`id_mailer`) REFERENCES `mailer` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;