const core = require('PageGearCoreNode');
const extend = require("extend");
const axios = require("axios");
const htmlToText = require('html-email-to-text');
const util = require('util');
var internal = {

    enviarEmail: async(params)=>{

        var vars = params.vars || {};
        var asunto = params.asunto;
        var mensaje = params.contenido;
        var template = params.template;
    
    
        Object.keys(vars).forEach(function(key) {
            var val = vars[key];
            
            asunto = core.tools.str_replace("{"+key+"}",val,asunto);
            mensaje = core.tools.str_replace("{"+key+"}",val,mensaje);
            
            asunto = core.tools.str_replace("(("+key+"))",val,asunto);
            mensaje = core.tools.str_replace("(("+key+"))",val,mensaje);
        });
        template = core.tools.str_replace("{asunto}",asunto,template);
    
        // mensaje = core.tools.str_replace("{text-preview}",params.portada,mensaje);
    
    
        var mailOptions = {
            fromName: 	params.remitente_nombre,
            from: 		params.remitente,
            to: 		params.email,
            subject: 	asunto,
            html: 		mensaje,
            text:       htmlToText(mensaje),
            template:   template
        };
        var send = await core.mail.sendTransactional(mailOptions).catch();
        
        var err, estado, messageId;
        if(typeof send.messageId != "undefined"){
            err = '';
            estado = 1;
            messageId = send.messageId;
        }else{
            err = send;
            estado = 2;
            messageId = '';
        }

        return messageId;
    },

};

var email = {

    OAuthTest: async(utils, params, context)=>{
		let utilsTmp = extend(true, {}, utils);
        let valid = await utils.validarApiKey(utilsTmp, params,true);
        if(!valid){
            return await utils.responder(-1, {}, "Invalid Key!", 401);
        }else{
            return await utils.responder(1,{}, "Good Key!", 200);
        }
    },

    send: async(utils, params, context)=>{
        let cuenta = await utils.validarApiKey(utils, params);
        //Obtener el envio
        let sqlCampaing  = util.format(
            "SELECT id,contenido,plantilla FROM m_campanas WHERE id_mailer=%s AND id = %s",
            utils.db.getSQLV(cuenta.id),
            utils.db.getSQLV(params.post.campaignId)
        );
        let campaign = await utils.db.getFilaSqlQuery(sqlCampaing);
        //Obtener la plantilla
        let sqlTemplate  = util.format(
            "SELECT id,html,css FROM m_plantillas WHERE id = %s",
            utils.db.getSQLV(campaign.plantilla)
        );
        let template = {html:"{contenido}"};
        let requestTemplate = await utils.db.getFilaSqlQuery(sqlTemplate);
        if(requestTemplate != false){
            template.html = core.tools.str_replace("{contenidosdelformato}","{contenido}",requestTemplate.html);
            template.html = core.tools.str_replace("</head>","<style>"+requestTemplate.css+"</style></head>",template.html);
        }
        // Insertarlo en la base de datos
        let sql = util.format("INSERT INTO `m_transaccional` (`id_mailer`, `estado`, `segmento`, `asunto`, `mensaje`, `remitente`, `remitente_nombre`, `data`) VALUES(%s,%s,%s,%s,%s,%s,%s,%s) ", 
            utils.db.getSQLV(cuenta.id),
            utils.db.getSQLV('Enviado'),
            utils.db.getSQLV(''),
            utils.db.getSQLV(params.post.subject),
            utils.db.getSQLV(campaign.contenido),
            utils.db.getSQLV(params.post.remitenteId),
            utils.db.getSQLV(params.post.remitenteName),
            utils.db.getSQLV(JSON.stringify(params.post))
        );
        await utils.db.conector(sql);
        let emailID = utils.db.queryResp.filas.insertId || 0;
        // Enviar el email
        let dataset = {
            vars: {
                id: emailID,
                ... params.post.variables
            },
            email: params.post.to,
            asunto: params.post.subject,
            contenido: campaign.contenido,
            template: `${template.html}`,
            preview: '',
            remitente_nombre:  params.post.remitenteName,
            remitente: params.post.remitenteName
        };
        let sendEmail = await internal.enviarEmail(dataset);
        if(sendEmail == false){
            return await utils.responder(1, [], "Email no enviado!");
        }
        return await utils.responder(1, {emailID,sendEmail}, "Email enviado!");
    },

	pixel: async(data)=>{

		let response = {
			"statusCode": 200,
			"headers": {
				"content-type": "image/png"
			},
			"body": "R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=",
			"isBase64Encoded": true
		};

		return response;
	},
	

    template: async(utils, params, context)=>{},
    
};

module.exports = email;