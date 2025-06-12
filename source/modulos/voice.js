const core = require('PageGearCoreNode');
const extend = require("extend");
const axios = require("axios");

var voice = {
    time: async(utils, params, context)=>{
      return "Hola que hace";  
    },

    sendMessage: async(utils, params, context)=>{
        var telefonos = [];
        var tels = params.post.numeros;
        var mensaje = params.post.mensaje;

        tels.forEach(function(v){
            telefonos.push({'to':'+57'+v})
        });
    
    	const { data:stream } = await axios({
            method: 'post',
            url: "https://api.infobip.com/tts/3/advanced",
            headers:{
                "Authorization": "Basic  ZXh1c21lZDpEZVh1czEzMjU",
                "Content-Type": "application/json",
                "Accept": "application/json"
            },
            data: JSON.stringify({
                "messages":[{
                "from":"41793026700",
                "destinations": telefonos,
                "text": mensaje,
                "language":"es",
                "voice": { "name":"Penelope", "gender":"female" },
                "speechRate":1
            }]})
        });
    
    	return stream;
    },
    
    sendBulkMessage: async(utils, params, context)=>{},
    
    template: async(utils, params, context)=>{},
    
};

module.exports = voice;