clear
echo "  _       _               _____                                  _    "
echo " | |     (_)             / ____|                                | |   "
echo " | |      _ __   __ ___ | |      ___   _ __   _ __    ___   ___ | |_  "
echo " | |     | |\ \ / // _ \| |     / _ \ | '_ \ | '_ \  / _ \ / __|| __| "
echo " | |____ | | \ V /|  __/| |____| (_) || | | || | | ||  __/| (__ | |_  "
echo " |______||_|  \_/  \___| \_____|\___/ |_| |_||_| |_| \___| \___| \__| "
echo ""
echo ""

 CLOUD="AWS1"
ZONE="us-east-1"
STACK="pagegear-mailer-api"

echo "Descargando cambios de GIT"
#git pull
echo ""

# Validar la plantilla SAM antes de continuar
sam validate --profile=$CLOUD --region=$ZONE
if [ $? -ne 0 ]; then
  echo "La validación de SAM falló; abortando despliegue."
  exit 1
fi

echo "Construyendo el proyecto"
echo "Zona: ${ZONE}"
echo "Perfil: ${CLOUD}"
echo "Stack: ${STACK}"
echo ""

echo "Instalando dependencias"
cd source/
npm install 
cd ..

echo ""
echo "Desplegando el proyecto"
sam build --profile=$CLOUD
sam deploy --profile=$CLOUD --region=$ZONE

#rm -rf .aws-sam

echo ""
echo "Listo!"
dt=$(date '+%d/%m/%Y %H:%M:%S');
echo "Fecha: ${dt}"
echo ""
echo ""
